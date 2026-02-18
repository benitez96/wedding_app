// @vitest-environment jsdom

import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InviteLinksSection from "@/components/backoffice/InviteLinksSection";
import { PERMISSION_PRESETS } from "@/lib/permissions";

vi.mock("@/app/actions/collaborators", () => ({
  getEventInviteLinks: vi.fn(),
  createInviteLink: vi.fn(),
}));

// Mock child modal
vi.mock("@/components/backoffice/InviteCollaboratorModal", () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="invite-modal" /> : null,
}));

import { getEventInviteLinks } from "@/app/actions/collaborators";

const mockGetLinks = vi.mocked(getEventInviteLinks);

const FUTURE_DATE = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000,
).toISOString();
const PAST_DATE = new Date(Date.now() - 1000).toISOString();

const LINKS = [
  {
    id: "link-1",
    token: "tok-abcdef12",
    permissions: PERMISSION_PRESETS.EDITOR.toString(),
    expiresAt: FUTURE_DATE,
    maxUses: 5,
    usedCount: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "link-2",
    token: "tok-xyz78901",
    permissions: PERMISSION_PRESETS.VIEWER.toString(),
    expiresAt: null,
    maxUses: null,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  },
];

// Keep a stable reference to the clipboard mock so we can assert against it
// without re-reading navigator.clipboard (which may get restored by vitest)
const writeTextMock = vi.fn().mockResolvedValue(undefined);

describe("InviteLinksSection", () => {
  beforeEach(() => {
    mockGetLinks.mockResolvedValue({ success: true, data: LINKS });
    // navigator.clipboard is a getter-only property in jsdom — must use defineProperty
    // We reuse the same vi.fn() reference so assertions work after userEvent
    writeTextMock.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
  });

  describe("loading state", () => {
    it("shows spinner while loading", () => {
      mockGetLinks.mockReturnValue(new Promise(() => {}));
      const { container } = render(<InviteLinksSection />);
      expect(
        container.querySelector('[class*="animate-spin"]'),
      ).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty message when no links", async () => {
      mockGetLinks.mockResolvedValue({ success: true, data: [] });
      render(<InviteLinksSection />);

      await waitFor(() => {
        expect(
          screen.getByText("No hay links de invitación activos"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("with links", () => {
    it("renders the description text", async () => {
      render(<InviteLinksSection />);
      await waitFor(() => {
        expect(
          screen.getByText(
            "Genera links para invitar colaboradores a tu evento",
          ),
        ).toBeInTheDocument();
      });
    });

    it("renders 'Generar Link' button", async () => {
      render(<InviteLinksSection />);
      await waitFor(() => {
        expect(screen.getByText("Generar Link")).toBeInTheDocument();
      });
    });

    it("renders truncated token URLs", async () => {
      render(<InviteLinksSection />);
      await waitFor(() => {
        // "tok-abcdef12": 12 chars → slice(-8) = "abcdef12" → "...abcdef12"
        expect(screen.getByText("...abcdef12")).toBeInTheDocument();
        // "tok-xyz78901": 12 chars → slice(-8) = "xyz78901" → "...xyz78901"
        expect(screen.getByText("...xyz78901")).toBeInTheDocument();
      });
    });

    it("renders role labels for known presets", async () => {
      render(<InviteLinksSection />);
      await waitFor(() => {
        expect(screen.getByText("Editor")).toBeInTheDocument();
        expect(screen.getByText("Viewer")).toBeInTheDocument();
      });
    });

    it("renders 'Nunca' for links with no expiration", async () => {
      render(<InviteLinksSection />);
      await waitFor(() => {
        expect(screen.getByText("Nunca")).toBeInTheDocument();
      });
    });

    it("renders 'Expirado' for expired links", async () => {
      mockGetLinks.mockResolvedValue({
        success: true,
        data: [{ ...LINKS[0]!, expiresAt: PAST_DATE }],
      });
      render(<InviteLinksSection />);
      await waitFor(() => {
        expect(screen.getByText("Expirado")).toBeInTheDocument();
      });
    });

    it("renders uses count as 'used/max'", async () => {
      render(<InviteLinksSection />);
      await waitFor(() => {
        expect(screen.getByText("2/5")).toBeInTheDocument();
        expect(screen.getByText("0/∞")).toBeInTheDocument();
      });
    });

    it("disables copy button for expired links", async () => {
      mockGetLinks.mockResolvedValue({
        success: true,
        data: [{ ...LINKS[0]!, expiresAt: PAST_DATE }],
      });
      render(<InviteLinksSection />);
      await waitFor(() => screen.getByText("Expirado"));

      const copyButtons = screen.getAllByRole("button");
      // Find the copy icon button (isIconOnly)
      const copyButton = copyButtons.find(
        (b) =>
          b.querySelector("svg") &&
          b !== screen.getByText("Generar Link").closest("button"),
      );
      expect(copyButton).toBeDisabled();
    });

    it("disables copy button when maxUses reached", async () => {
      mockGetLinks.mockResolvedValue({
        success: true,
        data: [{ ...LINKS[0]!, maxUses: 2, usedCount: 2 }],
      });
      render(<InviteLinksSection />);
      await waitFor(() => screen.getByText("2/2"));

      const copyButtons = screen.getAllByRole("button");
      const copyButton = copyButtons.find(
        (b) =>
          b.querySelector("svg") &&
          b !== screen.getByText("Generar Link").closest("button"),
      );
      expect(copyButton).toBeDisabled();
    });
  });

  describe("copy to clipboard", () => {
    it("calls clipboard.writeText when copy button is clicked", async () => {
      render(<InviteLinksSection />);

      await waitFor(() => screen.getByText("...abcdef12"));

      // Find enabled icon-only copy buttons (have SVG, not "Generar Link")
      const allButtons = screen.getAllByRole("button");
      const genBtn = screen.getByText("Generar Link").closest("button");
      const copyButton = allButtons.find(
        (b) =>
          b !== genBtn &&
          !(b as HTMLButtonElement).disabled &&
          b.querySelector("svg"),
      );

      expect(copyButton).toBeDefined();

      // Use fireEvent + act to reliably trigger the async handler
      await act(async () => {
        fireEvent.click(copyButton!);
        // Flush any microtasks so the async clipboard call completes
        await new Promise((r) => setTimeout(r, 0));
      });

      // Assert against the stable mock reference
      expect(writeTextMock).toHaveBeenCalledTimes(1);
      const calledWith = writeTextMock.mock.calls[0]![0] as string;
      expect(calledWith).toContain("tok-abcdef12");
    });
  });

  describe("generate link modal", () => {
    it("opens InviteCollaboratorModal when 'Generar Link' is clicked", async () => {
      const user = userEvent.setup();
      render(<InviteLinksSection />);

      await waitFor(() => screen.getByText("Generar Link"));
      await user.click(screen.getByText("Generar Link"));

      expect(screen.getByTestId("invite-modal")).toBeInTheDocument();
    });
  });
});

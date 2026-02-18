// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CollaboratorsList from "@/components/backoffice/CollaboratorsList";
import { PERMISSION_PRESETS } from "@/lib/permissions";

// Mock server actions
vi.mock("@/app/actions/collaborators", () => ({
  getEventCollaborators: vi.fn(),
  removeCollaborator: vi.fn(),
}));

// Mock child modals — we test them separately
vi.mock("@/components/backoffice/InviteCollaboratorModal", () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="invite-modal" /> : null,
}));

vi.mock("@/components/backoffice/EditPermissionsModal", () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="edit-modal" /> : null,
}));

import {
  getEventCollaborators,
  removeCollaborator,
} from "@/app/actions/collaborators";

const mockGetCollaborators = vi.mocked(getEventCollaborators);
const mockRemoveCollaborator = vi.mocked(removeCollaborator);

const COLLABORATORS = [
  {
    id: "member-1",
    userId: "user-1",
    userName: "Juan García",
    userEmail: "juan@example.com",
    userImage: null,
    permissions: PERMISSION_PRESETS.EDITOR.toString(),
    invitedAt: "2026-01-15T10:00:00Z",
    invitedBy: "owner-id",
  },
  {
    id: "member-2",
    userId: "user-2",
    userName: "María López",
    userEmail: "maria@example.com",
    userImage: null,
    permissions: PERMISSION_PRESETS.VIEWER.toString(),
    invitedAt: "2026-01-20T10:00:00Z",
    invitedBy: "owner-id",
  },
];

describe("CollaboratorsList", () => {
  beforeEach(() => {
    mockGetCollaborators.mockResolvedValue({
      success: true,
      data: COLLABORATORS,
    });
    mockRemoveCollaborator.mockResolvedValue({ success: true });
  });

  describe("loading state", () => {
    it("shows spinner while loading", () => {
      // Never resolve — stays in loading
      mockGetCollaborators.mockReturnValue(new Promise(() => {}));
      const { container } = render(<CollaboratorsList />);
      // HeroUI Spinner renders an svg or a div with animation
      expect(
        container.querySelector("svg, [class*='animate']"),
      ).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no collaborators", async () => {
      mockGetCollaborators.mockResolvedValue({ success: true, data: [] });
      render(<CollaboratorsList />);

      await waitFor(() => {
        expect(
          screen.getByText("No hay colaboradores en este evento."),
        ).toBeInTheDocument();
      });
    });

    it("shows invite hint in empty state", async () => {
      mockGetCollaborators.mockResolvedValue({ success: true, data: [] });
      render(<CollaboratorsList />);

      await waitFor(() => {
        expect(
          screen.getByText(
            "Invita a otros usuarios para que colaboren contigo.",
          ),
        ).toBeInTheDocument();
      });
    });
  });

  describe("with collaborators", () => {
    it("renders the 'Colaboradores' heading", async () => {
      render(<CollaboratorsList />);
      await waitFor(() => {
        expect(screen.getByText("Colaboradores")).toBeInTheDocument();
      });
    });

    it("renders all collaborator names", async () => {
      render(<CollaboratorsList />);
      await waitFor(() => {
        expect(screen.getByText("Juan García")).toBeInTheDocument();
        expect(screen.getByText("María López")).toBeInTheDocument();
      });
    });

    it("renders collaborator emails", async () => {
      render(<CollaboratorsList />);
      await waitFor(() => {
        expect(screen.getByText("juan@example.com")).toBeInTheDocument();
        expect(screen.getByText("maria@example.com")).toBeInTheDocument();
      });
    });

    it("renders preset role labels", async () => {
      render(<CollaboratorsList />);
      await waitFor(() => {
        expect(screen.getByText("Editor")).toBeInTheDocument();
        expect(screen.getByText("Viewer")).toBeInTheDocument();
      });
    });

    it("renders 'Personalizado' for non-preset permissions", async () => {
      mockGetCollaborators.mockResolvedValue({
        success: true,
        data: [{ ...COLLABORATORS[0]!, permissions: "7" }],
      });
      render(<CollaboratorsList />);
      await waitFor(() => {
        expect(screen.getByText("Personalizado")).toBeInTheDocument();
      });
    });

    it("renders action buttons for each collaborator", async () => {
      render(<CollaboratorsList />);
      await waitFor(() => {
        expect(
          screen.getAllByRole("button", { name: /editar permisos/i }),
        ).toHaveLength(2);
        expect(
          screen.getAllByRole("button", { name: /revocar acceso/i }),
        ).toHaveLength(2);
      });
    });
  });

  describe("invite button", () => {
    it("renders 'Invitar' button", async () => {
      render(<CollaboratorsList />);
      await waitFor(() => {
        expect(screen.getByText("Invitar")).toBeInTheDocument();
      });
    });

    it("opens invite modal when 'Invitar' is clicked", async () => {
      const user = userEvent.setup();
      render(<CollaboratorsList />);

      await waitFor(() => screen.getByText("Invitar"));
      await user.click(screen.getByText("Invitar"));

      expect(screen.getByTestId("invite-modal")).toBeInTheDocument();
    });
  });

  describe("remove collaborator", () => {
    it("calls removeCollaborator when confirmed", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const user = userEvent.setup();
      render(<CollaboratorsList />);

      await waitFor(() =>
        screen.getAllByRole("button", { name: /revocar acceso/i }),
      );

      await user.click(
        screen.getAllByRole("button", { name: /revocar acceso/i })[0]!,
      );

      await waitFor(() => {
        expect(mockRemoveCollaborator).toHaveBeenCalledWith("member-1");
      });
    });

    it("does NOT call removeCollaborator when confirm is cancelled", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);
      const user = userEvent.setup();
      render(<CollaboratorsList />);

      await waitFor(() =>
        screen.getAllByRole("button", { name: /revocar acceso/i }),
      );

      await user.click(
        screen.getAllByRole("button", { name: /revocar acceso/i })[0]!,
      );

      expect(mockRemoveCollaborator).not.toHaveBeenCalled();
    });

    it("reloads collaborators after successful remove", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const user = userEvent.setup();
      render(<CollaboratorsList />);

      await waitFor(() =>
        screen.getAllByRole("button", { name: /revocar acceso/i }),
      );

      await user.click(
        screen.getAllByRole("button", { name: /revocar acceso/i })[0]!,
      );

      await waitFor(() => {
        // getEventCollaborators called once on mount + once after remove
        expect(mockGetCollaborators).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("edit permissions", () => {
    it("opens edit modal when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<CollaboratorsList />);

      await waitFor(() =>
        screen.getAllByRole("button", { name: /editar permisos/i }),
      );

      await user.click(
        screen.getAllByRole("button", { name: /editar permisos/i })[0]!,
      );

      expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
    });
  });
});

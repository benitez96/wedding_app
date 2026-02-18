// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InvitationInfoCard from "@/components/InvitationDetailModal/InvitationInfoCard";
import type { InvitationWithTokens } from "@/types/invitation";

vi.mock("@/utils/date", () => ({
  formatDateTime: vi.fn((d: Date | null) => (d ? "01/01/2026 10:00" : "—")),
}));

const BASE_INVITATION: InvitationWithTokens = {
  id: "inv-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  guestName: "Ana García",
  guestNickname: null,
  guestPhone: null,
  maxGuests: 3,
  hasResponded: false,
  isAttending: null,
  guestCount: null,
  respondedAt: null,
  tokens: [],
};

describe("InvitationInfoCard", () => {
  describe("header section", () => {
    it("renders the section heading", () => {
      render(<InvitationInfoCard invitation={BASE_INVITATION} />);
      expect(screen.getByText("Información del Invitado")).toBeInTheDocument();
    });
  });

  describe("status chip", () => {
    it("shows 'Pendiente' when hasResponded is false", () => {
      render(<InvitationInfoCard invitation={BASE_INVITATION} />);
      expect(screen.getByText("Pendiente")).toBeInTheDocument();
    });

    it("shows 'Confirmado' when attending", () => {
      render(
        <InvitationInfoCard
          invitation={{
            ...BASE_INVITATION,
            hasResponded: true,
            isAttending: true,
          }}
        />,
      );
      expect(screen.getByText("Confirmado")).toBeInTheDocument();
    });

    it("shows 'No asistirá' when not attending", () => {
      render(
        <InvitationInfoCard
          invitation={{
            ...BASE_INVITATION,
            hasResponded: true,
            isAttending: false,
          }}
        />,
      );
      expect(screen.getByText("No asistirá")).toBeInTheDocument();
    });
  });

  describe("guest details", () => {
    it("renders guest name", () => {
      render(<InvitationInfoCard invitation={BASE_INVITATION} />);
      expect(screen.getByText("Ana García")).toBeInTheDocument();
    });

    it("renders maxGuests", () => {
      render(
        <InvitationInfoCard
          invitation={{ ...BASE_INVITATION, maxGuests: 5 }}
        />,
      );
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("renders nickname when present", () => {
      render(
        <InvitationInfoCard
          invitation={{ ...BASE_INVITATION, guestNickname: "Anita" }}
        />,
      );
      // The nickname span renders &ldquo;Anita&rdquo; — use a function matcher
      expect(
        screen.getByText((content) => content.includes("Anita")),
      ).toBeInTheDocument();
    });

    it("does not render nickname section when absent", () => {
      render(<InvitationInfoCard invitation={BASE_INVITATION} />);
      expect(screen.queryByText("Apodo:")).not.toBeInTheDocument();
    });

    it("renders phone when present", () => {
      render(
        <InvitationInfoCard
          invitation={{ ...BASE_INVITATION, guestPhone: "+54 11 1234-5678" }}
        />,
      );
      expect(screen.getByText("+54 11 1234-5678")).toBeInTheDocument();
    });

    it("does not render phone section when absent", () => {
      render(<InvitationInfoCard invitation={BASE_INVITATION} />);
      expect(screen.queryByText("Teléfono:")).not.toBeInTheDocument();
    });
  });

  describe("response details (shown only when hasResponded)", () => {
    const responded: InvitationWithTokens = {
      ...BASE_INVITATION,
      hasResponded: true,
      isAttending: true,
      guestCount: 2,
      respondedAt: new Date("2026-01-15"),
    };

    it("renders 'Confirmados' count when responded", () => {
      render(<InvitationInfoCard invitation={responded} />);
      expect(screen.getByText("Confirmados:")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("shows 0 when guestCount is null but hasResponded", () => {
      render(
        <InvitationInfoCard invitation={{ ...responded, guestCount: null }} />,
      );
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("renders 'Respondió el:' when responded", () => {
      render(<InvitationInfoCard invitation={responded} />);
      expect(screen.getByText("Respondió el:")).toBeInTheDocument();
    });

    it("does not render response details when not responded", () => {
      render(<InvitationInfoCard invitation={BASE_INVITATION} />);
      expect(screen.queryByText("Confirmados:")).not.toBeInTheDocument();
      expect(screen.queryByText("Respondió el:")).not.toBeInTheDocument();
    });
  });

  describe("footer", () => {
    it("renders 'Creada el' timestamp", () => {
      render(<InvitationInfoCard invitation={BASE_INVITATION} />);
      expect(screen.getByText(/Creada el/)).toBeInTheDocument();
    });
  });
});

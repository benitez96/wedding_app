// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RSVPResponseCard from "@/components/InvitationDetailModal/RSVPResponseCard";
import type { InvitationWithTokens } from "@/types/invitation";

const BASE_INVITATION: InvitationWithTokens = {
  id: "inv-1",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  guestName: "Ana García",
  guestNickname: null,
  guestPhone: null,
  maxGuests: 3,
  hasResponded: true,
  isAttending: true,
  guestCount: 2,
  respondedAt: new Date("2026-01-15"),
  menuPreference: null,
  dietaryRestrictions: null,
  messageForCouple: null,
  tokens: [],
};

describe("RSVPResponseCard", () => {
  describe("visibility", () => {
    it("returns null when all extended fields are null", () => {
      const { container } = render(
        <RSVPResponseCard invitation={BASE_INVITATION} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders when menuPreference has a value", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, menuPreference: "Vegetariano" }}
        />,
      );
      expect(screen.getByText("Respuestas del RSVP")).toBeInTheDocument();
    });

    it("renders when dietaryRestrictions has a value", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, dietaryRestrictions: "Sin gluten" }}
        />,
      );
      expect(screen.getByText("Respuestas del RSVP")).toBeInTheDocument();
    });

    it("renders when messageForCouple has a value", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, messageForCouple: "¡Felicidades!" }}
        />,
      );
      expect(screen.getByText("Respuestas del RSVP")).toBeInTheDocument();
    });
  });

  describe("field rendering", () => {
    it("renders menuPreference with label", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, menuPreference: "Vegano" }}
        />,
      );
      expect(screen.getByText("Menú:")).toBeInTheDocument();
      expect(screen.getByText("Vegano")).toBeInTheDocument();
    });

    it("does not render menu row when menuPreference is null", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, dietaryRestrictions: "Sin gluten" }}
        />,
      );
      expect(screen.queryByText("Menú:")).not.toBeInTheDocument();
    });

    it("renders dietaryRestrictions with label", () => {
      render(
        <RSVPResponseCard
          invitation={{
            ...BASE_INVITATION,
            dietaryRestrictions: "Sin lactosa",
          }}
        />,
      );
      expect(screen.getByText("Restricciones:")).toBeInTheDocument();
      expect(screen.getByText("Sin lactosa")).toBeInTheDocument();
    });

    it("does not render restrictions row when dietaryRestrictions is null", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, menuPreference: "Vegano" }}
        />,
      );
      expect(screen.queryByText("Restricciones:")).not.toBeInTheDocument();
    });

    it("renders messageForCouple with label and quotes", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, messageForCouple: "¡Felicidades!" }}
        />,
      );
      expect(screen.getByText("Mensaje:")).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes("¡Felicidades!")),
      ).toBeInTheDocument();
    });

    it("does not render message row when messageForCouple is null", () => {
      render(
        <RSVPResponseCard
          invitation={{ ...BASE_INVITATION, menuPreference: "Vegano" }}
        />,
      );
      expect(screen.queryByText("Mensaje:")).not.toBeInTheDocument();
    });

    it("renders all three fields at once", () => {
      render(
        <RSVPResponseCard
          invitation={{
            ...BASE_INVITATION,
            menuPreference: "Vegetariano",
            dietaryRestrictions: "Sin gluten",
            messageForCouple: "¡Gracias!",
          }}
        />,
      );
      expect(screen.getByText("Menú:")).toBeInTheDocument();
      expect(screen.getByText("Restricciones:")).toBeInTheDocument();
      expect(screen.getByText("Mensaje:")).toBeInTheDocument();
    });
  });
});

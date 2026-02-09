// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvitationStatusSelect from "@/components/InvitationStatusSelect";

// No mocks - use real HeroUI components
// Note: HeroUI Select is complex and better suited for E2E tests
// These tests focus on critical behavior only

describe("InvitationStatusSelect", () => {
  const mockOnStatusChange = vi.fn();
  const mockOnGuestCountChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders the component with status select", () => {
      render(
        <InvitationStatusSelect
          status="pending"
          guestCount={1}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      // HeroUI renders label in multiple places (hidden select + button)
      expect(
        screen.getAllByText("Estado de la Invitación").length,
      ).toBeGreaterThan(0);
    });

    it("renders all status options in hidden select", () => {
      render(
        <InvitationStatusSelect
          status="pending"
          guestCount={1}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      expect(screen.getByText("Pendiente")).toBeInTheDocument();
      expect(screen.getByText("Asistirá")).toBeInTheDocument();
      expect(screen.getByText("No asistirá")).toBeInTheDocument();
    });

    it("does not show guest count input when status is pending", () => {
      render(
        <InvitationStatusSelect
          status="pending"
          guestCount={1}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      expect(
        screen.queryByText("Número de Asistentes"),
      ).not.toBeInTheDocument();
    });

    it("shows guest count input when status is attending", () => {
      render(
        <InvitationStatusSelect
          status="attending"
          guestCount={3}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      expect(screen.getByText("Número de Asistentes")).toBeInTheDocument();
    });

    it("does not show guest count input when status is not_attending", () => {
      render(
        <InvitationStatusSelect
          status="not_attending"
          guestCount={1}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      expect(
        screen.queryByText("Número de Asistentes"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Guest count input", () => {
    it("displays current guest count value (as number)", () => {
      render(
        <InvitationStatusSelect
          status="attending"
          guestCount={3}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      // HeroUI Input with type="number" returns number, not string
      // Just verify the input exists and has correct attributes
      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBeGreaterThan(0);

      // Check the input has the correct min/max
      const guestInput = inputs[0]; // Should be the only spinbutton
      expect(guestInput).toHaveAttribute("min", "1");
      expect(guestInput).toHaveAttribute("max", "5");
      expect(guestInput).toHaveValue(3); // number, not "3"
    });

    it("displays max guests in description", () => {
      render(
        <InvitationStatusSelect
          status="attending"
          guestCount={3}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      expect(
        screen.getByText("Máximo 5 invitados permitidos"),
      ).toBeInTheDocument();
    });
  });

  describe("Props synchronization", () => {
    it("updates when guestCount prop changes", () => {
      const { rerender } = render(
        <InvitationStatusSelect
          status="attending"
          guestCount={2}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      let guestInput = screen.getByRole("spinbutton");
      expect(guestInput).toHaveValue(2);

      rerender(
        <InvitationStatusSelect
          status="attending"
          guestCount={4}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      guestInput = screen.getByRole("spinbutton");
      expect(guestInput).toHaveValue(4);
    });
  });

  describe("Disabled state", () => {
    it("disables select when disabled prop is true", () => {
      render(
        <InvitationStatusSelect
          status="pending"
          guestCount={1}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
          disabled={true}
        />,
      );

      // The button trigger should be disabled
      const buttons = screen.getAllByRole("button");
      const selectButton = buttons.find((btn) =>
        btn.hasAttribute("aria-haspopup"),
      );
      expect(selectButton).toBeDisabled();
    });

    it("disables guest count input when disabled prop is true", () => {
      render(
        <InvitationStatusSelect
          status="attending"
          guestCount={3}
          maxGuests={5}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
          disabled={true}
        />,
      );

      const guestInput = screen.getByRole("spinbutton");
      expect(guestInput).toBeDisabled();
    });
  });

  describe("Edge cases", () => {
    it("handles maxGuests of 1", () => {
      render(
        <InvitationStatusSelect
          status="attending"
          guestCount={1}
          maxGuests={1}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      expect(
        screen.getByText("Máximo 1 invitados permitidos"),
      ).toBeInTheDocument();
    });

    it("handles large maxGuests value", () => {
      render(
        <InvitationStatusSelect
          status="attending"
          guestCount={5}
          maxGuests={100}
          onStatusChange={mockOnStatusChange}
          onGuestCountChange={mockOnGuestCountChange}
        />,
      );

      expect(
        screen.getByText("Máximo 100 invitados permitidos"),
      ).toBeInTheDocument();
    });
  });
});

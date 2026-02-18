// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EventListSelector from "@/components/backoffice/EventListSelector";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

// Mock server action
vi.mock("@/app/actions/events", () => ({
  switchActiveEvent: vi.fn(),
}));

import { switchActiveEvent } from "@/app/actions/events";

const mockSwitchActiveEvent = vi.mocked(switchActiveEvent);

const EVENTS = [
  { id: "event-1", name: "Mi Boda 2026", isOwner: true },
  { id: "event-2", name: "Fiesta de 15", isOwner: false },
  { id: "event-3", name: "Evento Extra", isOwner: true },
];

describe("EventListSelector", () => {
  beforeEach(() => {
    mockSwitchActiveEvent.mockResolvedValue({ success: true });
  });

  describe("empty state", () => {
    it("shows empty state message when no events", () => {
      render(
        <EventListSelector
          events={[]}
          activeEventId={null}
          onCreateEvent={vi.fn()}
        />,
      );
      expect(screen.getByText("No tienes eventos")).toBeInTheDocument();
    });

    it("shows 'Crear Primer Evento' button when empty", () => {
      render(
        <EventListSelector
          events={[]}
          activeEventId={null}
          onCreateEvent={vi.fn()}
        />,
      );
      expect(screen.getByText("Crear Primer Evento")).toBeInTheDocument();
    });

    it("calls onCreateEvent when 'Crear Primer Evento' is clicked", async () => {
      const onCreateEvent = vi.fn();
      const user = userEvent.setup();

      render(
        <EventListSelector
          events={[]}
          activeEventId={null}
          onCreateEvent={onCreateEvent}
        />,
      );

      await user.click(screen.getByText("Crear Primer Evento"));
      expect(onCreateEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("with events", () => {
    it("renders 'Mis Eventos' heading", () => {
      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );
      expect(screen.getByText("Mis Eventos")).toBeInTheDocument();
    });

    it("renders all event names", () => {
      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );
      expect(screen.getByText("Mi Boda 2026")).toBeInTheDocument();
      expect(screen.getByText("Fiesta de 15")).toBeInTheDocument();
      expect(screen.getByText("Evento Extra")).toBeInTheDocument();
    });

    it("shows EventBadge for each event", () => {
      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );
      // event-1 and event-3 are owners, event-2 is collaborator
      expect(screen.getAllByText("Owner")).toHaveLength(2);
      expect(screen.getByText("Colaborador")).toBeInTheDocument();
    });

    it("renders 'Crear Nuevo Evento' button", () => {
      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );
      expect(screen.getByText("Crear Nuevo Evento")).toBeInTheDocument();
    });

    it("calls onCreateEvent when 'Crear Nuevo Evento' is clicked", async () => {
      const onCreateEvent = vi.fn();
      const user = userEvent.setup();

      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={onCreateEvent}
        />,
      );

      await user.click(screen.getByText("Crear Nuevo Evento"));
      expect(onCreateEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe("active event state", () => {
    it("active event button is disabled", () => {
      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );
      // Find the button for the active event
      const buttons = screen.getAllByRole("button");
      const activeButton = buttons.find((b) =>
        b.textContent?.includes("Mi Boda 2026"),
      );
      expect(activeButton).toBeDisabled();
    });

    it("inactive event buttons are enabled", () => {
      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );
      const buttons = screen.getAllByRole("button");
      const inactiveButton = buttons.find((b) =>
        b.textContent?.includes("Fiesta de 15"),
      );
      expect(inactiveButton).not.toBeDisabled();
    });
  });

  describe("event switching", () => {
    it("calls switchActiveEvent when an inactive event is clicked", async () => {
      const user = userEvent.setup();

      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const inactiveButton = buttons.find((b) =>
        b.textContent?.includes("Fiesta de 15"),
      )!;

      await user.click(inactiveButton);

      await waitFor(() => {
        expect(mockSwitchActiveEvent).toHaveBeenCalledWith("event-2");
      });
    });

    it("does NOT call switchActiveEvent when active event is clicked", async () => {
      const user = userEvent.setup();

      render(
        <EventListSelector
          events={EVENTS}
          activeEventId="event-1"
          onCreateEvent={vi.fn()}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const activeButton = buttons.find((b) =>
        b.textContent?.includes("Mi Boda 2026"),
      )!;

      await user.click(activeButton);
      expect(mockSwitchActiveEvent).not.toHaveBeenCalled();
    });
  });
});

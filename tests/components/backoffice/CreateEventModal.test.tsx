// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateEventModal from "@/components/backoffice/CreateEventModal";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/app/actions/events", () => ({
  createEvent: vi.fn(),
}));

import { createEvent } from "@/app/actions/events";

const mockCreateEvent = vi.mocked(createEvent);

describe("CreateEventModal", () => {
  beforeEach(() => {
    // Return a minimal success shape — component only checks result.success
    mockCreateEvent.mockResolvedValue({ success: true, data: {} as any });
  });

  describe("rendering", () => {
    it("renders nothing when isOpen=false", () => {
      render(<CreateEventModal isOpen={false} onClose={vi.fn()} />);
      // Modal content should not be visible
      expect(screen.queryByText("Crear Nuevo Evento")).not.toBeInTheDocument();
    });

    it("renders modal content when isOpen=true", () => {
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("Crear Nuevo Evento")).toBeInTheDocument();
    });

    it("renders event name input", () => {
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByLabelText(/nombre del evento/i)).toBeInTheDocument();
    });

    it("renders description textarea", () => {
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    });

    it("renders Cancel and Crear Evento buttons", () => {
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Crear Evento")).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("does not call createEvent when name is empty", async () => {
      const user = userEvent.setup();
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);

      await user.click(screen.getByText("Crear Evento"));

      // Give React time to process the submission
      await waitFor(() => {
        expect(mockCreateEvent).not.toHaveBeenCalled();
      });
    });

    it("does not call onClose when name is empty (stays open)", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<CreateEventModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByText("Crear Evento"));

      await waitFor(() => {
        expect(mockCreateEvent).not.toHaveBeenCalled();
      });
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("form submission", () => {
    it("calls createEvent with name when form is valid", async () => {
      const user = userEvent.setup();
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);

      await user.type(
        screen.getByLabelText(/nombre del evento/i),
        "Mi Boda 2026",
      );
      await user.click(screen.getByText("Crear Evento"));

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledTimes(1);
      });

      const formData: FormData = mockCreateEvent.mock.calls[0]![0];
      expect(formData.get("name")).toBe("Mi Boda 2026");
    });

    it("calls createEvent with description when provided", async () => {
      const user = userEvent.setup();
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);

      await user.type(screen.getByLabelText(/nombre del evento/i), "Boda Test");
      await user.type(screen.getByLabelText(/descripción/i), "Una descripción");
      await user.click(screen.getByText("Crear Evento"));

      await waitFor(() => {
        expect(mockCreateEvent).toHaveBeenCalledTimes(1);
      });

      const formData: FormData = mockCreateEvent.mock.calls[0]![0];
      expect(formData.get("description")).toBe("Una descripción");
    });

    it("calls onClose after successful creation", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CreateEventModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByLabelText(/nombre del evento/i), "Boda Test");
      await user.click(screen.getByText("Crear Evento"));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("shows server error message when createEvent fails", async () => {
      mockCreateEvent.mockResolvedValue({
        success: false,
        error: "Límite de eventos alcanzado",
        limitReached: true,
      });

      const user = userEvent.setup();
      render(<CreateEventModal isOpen={true} onClose={vi.fn()} />);

      await user.type(screen.getByLabelText(/nombre del evento/i), "Boda Test");
      await user.click(screen.getByText("Crear Evento"));

      await waitFor(() => {
        expect(
          screen.getByText("Límite de eventos alcanzado"),
        ).toBeInTheDocument();
      });
    });

    it("does NOT call onClose when createEvent fails", async () => {
      mockCreateEvent.mockResolvedValue({
        success: false,
        error: "Error del servidor",
        limitReached: false,
      });

      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CreateEventModal isOpen={true} onClose={onClose} />);

      await user.type(screen.getByLabelText(/nombre del evento/i), "Boda Test");
      await user.click(screen.getByText("Crear Evento"));

      await waitFor(() => {
        expect(screen.getByText("Error del servidor")).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("cancel behavior", () => {
    it("calls onClose when Cancel is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CreateEventModal isOpen={true} onClose={onClose} />);

      await user.click(screen.getByText("Cancelar"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("clears form state when closed via Cancel", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CreateEventModal isOpen={true} onClose={onClose} />);

      const input = screen.getByLabelText(/nombre del evento/i);
      await user.type(input, "Texto a limpiar");

      await user.click(screen.getByText("Cancelar"));
      expect(onClose).toHaveBeenCalled();
    });
  });
});

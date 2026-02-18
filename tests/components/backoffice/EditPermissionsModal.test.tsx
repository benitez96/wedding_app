// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditPermissionsModal from "@/components/backoffice/EditPermissionsModal";
import { PERMISSION_PRESETS } from "@/lib/permissions";

vi.mock("@/app/actions/collaborators", () => ({
  updateCollaboratorPermissions: vi.fn(),
}));

import { updateCollaboratorPermissions } from "@/app/actions/collaborators";

const mockUpdate = vi.mocked(updateCollaboratorPermissions);

const DEFAULT_PROPS = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  memberId: "member-123",
  memberName: "Juan García",
  currentPermissions: PERMISSION_PRESETS.EDITOR.toString(),
};

describe("EditPermissionsModal", () => {
  beforeEach(() => {
    mockUpdate.mockResolvedValue({
      success: true,
      data: {
        id: "member-123",
        permissions: PERMISSION_PRESETS.EDITOR.toString(),
      },
    });
  });

  describe("rendering", () => {
    it("renders the member name in the header", () => {
      render(<EditPermissionsModal {...DEFAULT_PROPS} />);
      expect(
        screen.getByText("Editar permisos de Juan García"),
      ).toBeInTheDocument();
    });

    it("renders PermissionsSelector", () => {
      render(<EditPermissionsModal {...DEFAULT_PROPS} />);
      // PermissionsSelector renders "Tipo de acceso" label
      expect(screen.getByText("Tipo de acceso")).toBeInTheDocument();
    });

    it("renders Cancel and Guardar buttons", () => {
      render(<EditPermissionsModal {...DEFAULT_PROPS} />);
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Guardar")).toBeInTheDocument();
    });

    it("pre-selects the correct preset based on currentPermissions", () => {
      render(<EditPermissionsModal {...DEFAULT_PROPS} />);
      // EDITOR preset radio should be selected
      const editorRadio = screen.getByRole("radio", { name: /editor/i });
      expect(editorRadio).toBeChecked();
    });

    it("does not render when isOpen=false", () => {
      render(<EditPermissionsModal {...DEFAULT_PROPS} isOpen={false} />);
      expect(
        screen.queryByText("Editar permisos de Juan García"),
      ).not.toBeInTheDocument();
    });
  });

  describe("save behavior", () => {
    it("calls updateCollaboratorPermissions with memberId and permissions", async () => {
      const user = userEvent.setup();
      render(<EditPermissionsModal {...DEFAULT_PROPS} />);

      await user.click(screen.getByText("Guardar"));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          "member-123",
          PERMISSION_PRESETS.EDITOR.toString(),
        );
      });
    });

    it("calls onSuccess after successful save", async () => {
      const onSuccess = vi.fn();
      const user = userEvent.setup();
      render(<EditPermissionsModal {...DEFAULT_PROPS} onSuccess={onSuccess} />);

      await user.click(screen.getByText("Guardar"));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("calls onClose after successful save", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<EditPermissionsModal {...DEFAULT_PROPS} onClose={onClose} />);

      await user.click(screen.getByText("Guardar"));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it("shows error message when save fails", async () => {
      mockUpdate.mockResolvedValue({
        success: false,
        error: "Sin permisos para editar",
      });

      const user = userEvent.setup();
      render(<EditPermissionsModal {...DEFAULT_PROPS} />);

      await user.click(screen.getByText("Guardar"));

      await waitFor(() => {
        expect(
          screen.getByText("Sin permisos para editar"),
        ).toBeInTheDocument();
      });
    });

    it("does NOT call onSuccess when save fails", async () => {
      mockUpdate.mockResolvedValue({
        success: false,
        error: "Error",
      });

      const onSuccess = vi.fn();
      const user = userEvent.setup();
      render(<EditPermissionsModal {...DEFAULT_PROPS} onSuccess={onSuccess} />);

      await user.click(screen.getByText("Guardar"));

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  describe("cancel behavior", () => {
    it("calls onClose when Cancel is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<EditPermissionsModal {...DEFAULT_PROPS} onClose={onClose} />);

      await user.click(screen.getByText("Cancelar"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does NOT call updateCollaboratorPermissions when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<EditPermissionsModal {...DEFAULT_PROPS} />);

      await user.click(screen.getByText("Cancelar"));
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe("CUSTOM preset disabled state", () => {
    it("Guardar is disabled when CUSTOM preset is selected and no permissions set", async () => {
      const user = userEvent.setup();
      render(
        <EditPermissionsModal {...DEFAULT_PROPS} currentPermissions="0" />,
      );

      // 0n detects as CUSTOM with no permissions
      const saveButton = screen.getByText("Guardar");
      expect(saveButton.closest("button")).toBeDisabled();
    });
  });
});

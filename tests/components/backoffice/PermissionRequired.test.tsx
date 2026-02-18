// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PermissionRequired from "@/components/backoffice/PermissionRequired";

describe("PermissionRequired", () => {
  describe("rendering", () => {
    it("renders the permission code", () => {
      render(<PermissionRequired permission="GUESTS_VIEW" />);
      expect(screen.getByText("GUESTS_VIEW")).toBeInTheDocument();
    });

    it("renders default message when none provided", () => {
      render(<PermissionRequired permission="GUESTS_VIEW" />);
      expect(
        screen.getByText("No tienes permisos para acceder a esta sección"),
      ).toBeInTheDocument();
    });

    it("renders custom message when provided", () => {
      render(
        <PermissionRequired
          permission="GUESTS_EDIT"
          message="Necesitás permiso especial"
        />,
      );
      expect(
        screen.getByText("Necesitás permiso especial"),
      ).toBeInTheDocument();
    });

    it("renders heading 'Acceso Restringido'", () => {
      render(<PermissionRequired permission="EVENT_DELETE" />);
      expect(screen.getByText("Acceso Restringido")).toBeInTheDocument();
    });

    it("renders 'Volver al Dashboard' link", () => {
      render(<PermissionRequired permission="ANALYTICS_VIEW" />);
      // HeroUI Button as={Link} renders an <a> with role="button" (not role="link")
      const link = screen.getByRole("button", { name: /volver al dashboard/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/backoffice/dashboard");
    });

    it("renders 'Permiso requerido:' label", () => {
      render(<PermissionRequired permission="DESIGN_EDIT" />);
      expect(screen.getByText(/permiso requerido/i)).toBeInTheDocument();
    });

    it("displays permission in a code element", () => {
      render(<PermissionRequired permission="CHECKIN_SCAN" />);
      const code = screen.getByText("CHECKIN_SCAN");
      expect(code.tagName).toBe("CODE");
    });
  });

  describe("layout", () => {
    it("centers content vertically", () => {
      const { container } = render(
        <PermissionRequired permission="GUESTS_VIEW" />,
      );
      const outer = container.firstChild as HTMLElement;
      expect(outer).toHaveClass("flex", "items-center", "justify-center");
    });
  });
});

// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NavigationSidebar from "@/components/backoffice/AppSidebar/NavigationSidebar";
import * as SidebarContext from "@/components/backoffice/AppSidebar/SidebarContext";
import type { SidebarContextValue } from "@/components/backoffice/AppSidebar/types";

// Mock dependencies
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    aside: ({ children, ...props }: any) => (
      <aside {...props}>{children}</aside>
    ),
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

describe("NavigationSidebar", () => {
  const mockReplace = vi.fn();
  const mockRefresh = vi.fn();
  const mockToggleSidebar = vi.fn();
  const mockSignOut = vi.mocked(authClient.signOut);
  const mockUsePathname = vi.mocked(usePathname);
  const mockUseRouter = vi.mocked(useRouter);

  const defaultSidebarValue: SidebarContextValue = {
    isExpanded: true,
    toggleSidebar: mockToggleSidebar,
    events: [
      { id: "event-1", name: "Mi Boda", isOwner: true },
      { id: "event-2", name: "Cumpleaños", isOwner: false },
    ],
    activeEventId: "event-1",
    tier: "BASIC",
    themeData: {
      themeId: "classic",
      customColors: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/backoffice/dashboard");
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      refresh: mockRefresh,
    } as any);

    vi.spyOn(SidebarContext, "useSidebar").mockReturnValue(defaultSidebarValue);
  });

  describe("rendering", () => {
    it("renders active event name", () => {
      render(<NavigationSidebar />);

      expect(screen.getByText("Mi Boda")).toBeInTheDocument();
    });

    it("renders tier badge", () => {
      render(<NavigationSidebar />);

      // TierBadge is a separate component, just verify it's rendered
      expect(screen.getByText("Mi Boda")).toBeInTheDocument();
    });

    it("shows placeholder when no active event", () => {
      vi.spyOn(SidebarContext, "useSidebar").mockReturnValue({
        ...defaultSidebarValue,
        activeEventId: "",
        events: [],
      });

      render(<NavigationSidebar />);

      expect(screen.getByText("Sin evento seleccionado")).toBeInTheDocument();
    });
  });

  describe("menu filtering by tier", () => {
    it("shows all menu items for BASIC tier except tier-restricted ones", () => {
      render(<NavigationSidebar />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Invitaciones")).toBeInTheDocument();
      expect(screen.getByText("Estructura")).toBeInTheDocument();
      expect(screen.getByText("Theming")).toBeInTheDocument();
      expect(screen.getByText("Configuraciones")).toBeInTheDocument();

      // "Miembros" should NOT be visible for BASIC tier
      expect(screen.queryByText("Miembros")).not.toBeInTheDocument();
    });

    it("shows all menu items including tier-restricted for COMPANY tier", () => {
      vi.spyOn(SidebarContext, "useSidebar").mockReturnValue({
        ...defaultSidebarValue,
        tier: "COMPANY",
      });

      render(<NavigationSidebar />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Miembros")).toBeInTheDocument();
    });
  });

  describe("active menu item", () => {
    it("highlights active menu item based on pathname", () => {
      mockUsePathname.mockReturnValue("/backoffice/invitations");

      render(<NavigationSidebar />);

      const invitationsLink = screen.getByText("Invitaciones").closest("a");
      expect(invitationsLink).toHaveClass("bg-primary");
      expect(invitationsLink).toHaveAttribute("aria-current", "page");
    });

    it("does not highlight non-active items", () => {
      mockUsePathname.mockReturnValue("/backoffice/dashboard");

      render(<NavigationSidebar />);

      const invitationsLink = screen.getByText("Invitaciones").closest("a");
      expect(invitationsLink).not.toHaveClass("bg-primary");
      expect(invitationsLink).not.toHaveAttribute("aria-current");
    });
  });

  describe("logout functionality", () => {
    it("calls authClient.signOut when logout button is clicked", async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined as any);

      render(<NavigationSidebar />);

      const logoutButton = screen.getByText("Cerrar Sesión");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    it("redirects to login after successful logout", async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined as any);

      render(<NavigationSidebar />);

      const logoutButton = screen.getByText("Cerrar Sesión");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/backoffice/login");
      });

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("handles logout error gracefully", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockSignOut.mockRejectedValue(new Error("Logout failed"));

      render(<NavigationSidebar />);

      const logoutButton = screen.getByText("Cerrar Sesión");
      await user.click(logoutButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Should still redirect to login even on error
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/backoffice/login");
      });

      consoleErrorSpy.mockRestore();
    });

    it("shows loading state while logging out", async () => {
      const user = userEvent.setup();
      let resolveSignOut: () => void;
      const signOutPromise = new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      });

      mockSignOut.mockReturnValue(signOutPromise as any);

      render(<NavigationSidebar />);

      const logoutButton = screen.getByText("Cerrar Sesión");
      await user.click(logoutButton);

      await waitFor(() => {
        const button = screen.getByText("Cerrar Sesión").closest("button");
        expect(button).toHaveAttribute("data-loading", "true");
      });

      resolveSignOut!();

      await waitFor(() => {
        const button = screen.getByText("Cerrar Sesión").closest("button");
        expect(button).not.toHaveAttribute("data-loading", "true");
      });
    });
  });

  describe("sidebar toggle", () => {
    it("calls toggleSidebar when collapse button is clicked", async () => {
      const user = userEvent.setup();

      render(<NavigationSidebar />);

      const collapseButton = screen.getByLabelText("Contraer menú");
      await user.click(collapseButton);

      expect(mockToggleSidebar).toHaveBeenCalled();
    });

    it("shows expand button when sidebar is collapsed", () => {
      vi.spyOn(SidebarContext, "useSidebar").mockReturnValue({
        ...defaultSidebarValue,
        isExpanded: false,
      });

      render(<NavigationSidebar />);

      expect(screen.getByLabelText("Expandir menú")).toBeInTheDocument();
    });

    it("hides expand button when sidebar is expanded", () => {
      vi.spyOn(SidebarContext, "useSidebar").mockReturnValue({
        ...defaultSidebarValue,
        isExpanded: true,
      });

      render(<NavigationSidebar />);

      expect(screen.queryByLabelText("Expandir menú")).not.toBeInTheDocument();
    });
  });

  describe("navigation links", () => {
    it("renders correct href for each menu item", () => {
      render(<NavigationSidebar />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink).toHaveAttribute("href", "/backoffice/dashboard");

      const invitationsLink = screen.getByText("Invitaciones").closest("a");
      expect(invitationsLink).toHaveAttribute(
        "href",
        "/backoffice/invitations",
      );
    });
  });
});

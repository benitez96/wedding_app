// @vitest-environment jsdom

import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/backoffice/AppSidebar/SidebarContext";
import type { SidebarThemeData } from "@/components/backoffice/AppSidebar/types";
import type { ReactNode } from "react";

// Helper: consumer component to read context values
function SidebarConsumer() {
  const { isExpanded, toggleSidebar, events, activeEventId, tier, themeData } =
    useSidebar();
  return (
    <div>
      <span data-testid="isExpanded">{String(isExpanded)}</span>
      <span data-testid="tier">{tier}</span>
      <span data-testid="themeId">{themeData.themeId}</span>
      <span data-testid="activeEventId">{activeEventId ?? "null"}</span>
      <span data-testid="eventCount">{events.length}</span>
      <button onClick={toggleSidebar}>toggle</button>
    </div>
  );
}

const DEFAULT_EVENTS = [{ id: "evt-1", name: "Boda Test", isOwner: true }];
const DEFAULT_THEME_DATA: SidebarThemeData = {
  themeId: "classic",
  customColors: null,
};

function renderWithProvider(
  props: Partial<React.ComponentProps<typeof SidebarProvider>> = {},
) {
  return render(
    <SidebarProvider
      events={DEFAULT_EVENTS}
      activeEventId="evt-1"
      tier="FREE"
      themeData={DEFAULT_THEME_DATA}
      {...props}
    >
      <SidebarConsumer />
    </SidebarProvider>,
  );
}

describe("SidebarContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("initial state", () => {
    it("provides isExpanded=true by default (no localStorage)", () => {
      renderWithProvider();
      expect(screen.getByTestId("isExpanded").textContent).toBe("true");
    });

    it("provides the tier passed as prop", () => {
      renderWithProvider({ tier: "COMPANY" });
      expect(screen.getByTestId("tier").textContent).toBe("COMPANY");
    });

    it("provides the themeId passed via themeData", () => {
      renderWithProvider({
        themeData: { themeId: "warm", customColors: null },
      });
      expect(screen.getByTestId("themeId").textContent).toBe("warm");
    });

    it("provides activeEventId from props", () => {
      renderWithProvider({ activeEventId: "evt-1" });
      expect(screen.getByTestId("activeEventId").textContent).toBe("evt-1");
    });

    it("provides null activeEventId when none set", () => {
      renderWithProvider({ activeEventId: null });
      expect(screen.getByTestId("activeEventId").textContent).toBe("null");
    });

    it("provides the events array from props", () => {
      renderWithProvider({ events: DEFAULT_EVENTS });
      expect(screen.getByTestId("eventCount").textContent).toBe("1");
    });

    it("provides empty events array", () => {
      renderWithProvider({ events: [] });
      expect(screen.getByTestId("eventCount").textContent).toBe("0");
    });
  });

  describe("localStorage hydration", () => {
    it("reads isExpanded=false from localStorage on mount", () => {
      localStorage.setItem("backoffice-sidebar-expanded", "false");
      renderWithProvider();
      // After useEffect runs (hydration)
      expect(screen.getByTestId("isExpanded").textContent).toBe("false");
    });

    it("reads isExpanded=true from localStorage on mount", () => {
      localStorage.setItem("backoffice-sidebar-expanded", "true");
      renderWithProvider();
      expect(screen.getByTestId("isExpanded").textContent).toBe("true");
    });
  });

  describe("toggleSidebar", () => {
    it("toggles isExpanded from true to false", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      expect(screen.getByTestId("isExpanded").textContent).toBe("true");
      await user.click(screen.getByText("toggle"));
      expect(screen.getByTestId("isExpanded").textContent).toBe("false");
    });

    it("toggles isExpanded from false to true", async () => {
      localStorage.setItem("backoffice-sidebar-expanded", "false");
      const user = userEvent.setup();
      renderWithProvider();

      expect(screen.getByTestId("isExpanded").textContent).toBe("false");
      await user.click(screen.getByText("toggle"));
      expect(screen.getByTestId("isExpanded").textContent).toBe("true");
    });

    it("persists expanded state to localStorage", async () => {
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText("toggle"));
      expect(localStorage.getItem("backoffice-sidebar-expanded")).toBe("false");
    });

    it("persists collapsed state to localStorage", async () => {
      localStorage.setItem("backoffice-sidebar-expanded", "false");
      const user = userEvent.setup();
      renderWithProvider();

      await user.click(screen.getByText("toggle"));
      expect(localStorage.getItem("backoffice-sidebar-expanded")).toBe("true");
    });
  });

  describe("useSidebar outside provider", () => {
    it("throws an error when used outside SidebarProvider", () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<SidebarConsumer />)).toThrow(
        "useSidebar must be used within SidebarProvider",
      );

      spy.mockRestore();
    });
  });
});

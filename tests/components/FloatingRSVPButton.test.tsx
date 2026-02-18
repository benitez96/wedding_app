// @vitest-environment jsdom

import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FloatingRSVPButton from "@/components/FloatingRSVPButton";

describe("FloatingRSVPButton", () => {
  describe("rendering", () => {
    it("renders a button with aria-label", () => {
      render(<FloatingRSVPButton />);
      expect(
        screen.getByRole("button", { name: "Ir a confirmar asistencia" }),
      ).toBeInTheDocument();
    });

    it("renders a Calendar SVG icon", () => {
      const { container } = render(<FloatingRSVPButton />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("has fixed positioning classes", () => {
      render(<FloatingRSVPButton />);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("fixed");
      expect(btn).toHaveClass("bottom-6");
      expect(btn).toHaveClass("right-6");
    });
  });

  describe("scroll behavior", () => {
    beforeEach(() => {
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb(0);
        return 0;
      });
      vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    });

    it("scrolls to #rsvp-section when clicked and element exists", () => {
      // Create a fake rsvp-section element in the DOM
      const rsvpEl = document.createElement("div");
      rsvpEl.id = "rsvp-section";
      vi.spyOn(rsvpEl, "getBoundingClientRect").mockReturnValue({
        top: 500,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });
      vi.spyOn(document, "getElementById").mockReturnValue(rsvpEl);
      vi.spyOn(window, "pageYOffset", "get").mockReturnValue(100);

      render(<FloatingRSVPButton />);
      fireEvent.click(screen.getByRole("button"));

      expect(window.scrollTo).toHaveBeenCalledWith({
        top: 580, // 500 (getBCR.top) + 100 (pageYOffset) - 20 (offset)
        behavior: "smooth",
      });
    });

    it("does not throw when #rsvp-section does not exist", () => {
      vi.spyOn(document, "getElementById").mockReturnValue(null);

      render(<FloatingRSVPButton />);
      expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
      expect(window.scrollTo).not.toHaveBeenCalled();
    });
  });
});

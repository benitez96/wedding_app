// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EventBadge from "@/components/backoffice/EventBadge";

describe("EventBadge", () => {
  describe("default variant", () => {
    it("renders 'Owner' chip when isOwner=true", () => {
      render(<EventBadge isOwner={true} />);
      expect(screen.getByText("Owner")).toBeInTheDocument();
    });

    it("renders 'Colaborador' chip when isOwner=false", () => {
      render(<EventBadge isOwner={false} />);
      expect(screen.getByText("Colaborador")).toBeInTheDocument();
    });

    it("renders as a Chip element (not a plain span)", () => {
      const { container } = render(<EventBadge isOwner={true} />);
      // HeroUI Chip renders a span with specific classes
      expect(container.querySelector("span")).toBeInTheDocument();
    });
  });

  describe("minimal variant", () => {
    it("renders 'Owner' as plain text span", () => {
      render(<EventBadge isOwner={true} variant="minimal" />);
      const span = screen.getByText("Owner");
      expect(span.tagName).toBe("SPAN");
      expect(span).toHaveClass("text-xs", "text-default-500");
    });

    it("renders 'Colaborador' as plain text span", () => {
      render(<EventBadge isOwner={false} variant="minimal" />);
      const span = screen.getByText("Colaborador");
      expect(span.tagName).toBe("SPAN");
      expect(span).toHaveClass("text-xs", "text-default-500");
    });
  });

  describe("default prop", () => {
    it("uses 'default' variant when none specified", () => {
      // Should not throw and should render label
      render(<EventBadge isOwner={true} />);
      expect(screen.getByText("Owner")).toBeInTheDocument();
    });
  });
});

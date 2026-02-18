// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EventAvatar from "@/components/backoffice/AppSidebar/EventAvatar";

// framer-motion needs this in jsdom
vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      onClick,
      className,
      "aria-label": ariaLabel,
      "aria-current": ariaCurrent,
      ...rest
    }: any) => (
      <button
        onClick={onClick}
        className={className}
        aria-label={ariaLabel}
        aria-current={ariaCurrent}
      >
        {children}
      </button>
    ),
    div: ({ children, className }: any) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// next/image — simplified mock
vi.mock("next/image", () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

describe("EventAvatar", () => {
  const defaultProps = {
    eventId: "abc123",
    eventName: "Mi Boda 2026",
    isActive: false,
    onClick: vi.fn(),
  };

  describe("rendering", () => {
    it("renders a button with the correct aria-label", () => {
      render(<EventAvatar {...defaultProps} />);
      expect(
        screen.getByRole("button", {
          name: /seleccionar evento: mi boda 2026/i,
        }),
      ).toBeInTheDocument();
    });

    it("renders initials for multi-word event name", () => {
      render(<EventAvatar {...defaultProps} eventName="Mi Boda" />);
      // HeroUI Avatar renders initials in aria-label of an img span, not as visible text
      expect(screen.getByRole("img", { name: "MB" })).toBeInTheDocument();
    });

    it("renders first 2 letters for single-word event name", () => {
      render(<EventAvatar {...defaultProps} eventName="Fiesta" />);
      expect(screen.getByRole("img", { name: "FI" })).toBeInTheDocument();
    });

    it("renders initials in uppercase", () => {
      render(<EventAvatar {...defaultProps} eventName="boda test" />);
      expect(screen.getByRole("img", { name: "BT" })).toBeInTheDocument();
    });
  });

  describe("active state", () => {
    it("sets aria-current='page' when active", () => {
      render(<EventAvatar {...defaultProps} isActive={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-current", "page");
    });

    it("does not set aria-current when not active", () => {
      render(<EventAvatar {...defaultProps} isActive={false} />);
      const button = screen.getByRole("button");
      expect(button).not.toHaveAttribute("aria-current");
    });
  });

  describe("click interaction", () => {
    it("calls onClick when button is clicked", async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<EventAvatar {...defaultProps} onClick={onClick} />);
      await user.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});

// ─── Pure function tests for getInitials and getEventColor ───────────────────
// These functions are not exported, so we test them through the component output.

describe("EventAvatar initials logic", () => {
  const baseProps = { eventId: "x", isActive: false, onClick: vi.fn() };

  const cases: [string, string][] = [
    ["Boda 2026", "B2"], // first letter of each of the first 2 words ("B" + "2")
    ["Mi Gran Boda", "MG"], // only first 2 words
    ["Evento", "EV"], // single word → first 2 chars
    ["A B", "AB"], // very short words
    ["fiesta de 15", "FD"], // lowercase → uppercase
  ];

  cases.forEach(([name, expected]) => {
    it(`"${name}" → "${expected}"`, () => {
      render(<EventAvatar {...baseProps} eventName={name} />);
      // HeroUI Avatar renders initials in aria-label of a role="img" span
      expect(screen.getByRole("img", { name: expected })).toBeInTheDocument();
    });
  });
});

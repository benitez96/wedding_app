// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import AttentionButton from "@/components/AttentionButton";

describe("AttentionButton", () => {
  describe("rendering", () => {
    it("renders children text", () => {
      render(<AttentionButton>Confirmar asistencia</AttentionButton>);
      expect(screen.getByText("Confirmar asistencia")).toBeInTheDocument();
    });

    it("renders a button element", () => {
      render(<AttentionButton>Click me</AttentionButton>);
      expect(
        screen.getByRole("button", { name: "Click me" }),
      ).toBeInTheDocument();
    });

    it("wraps button in a relative inline-block div", () => {
      const { container } = render(<AttentionButton>Test</AttentionButton>);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("relative");
      expect(wrapper).toHaveClass("inline-block");
    });
  });

  describe("className", () => {
    it("includes 'attention-button' class on the button", () => {
      render(<AttentionButton>Test</AttentionButton>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("attention-button");
    });

    it("merges custom className with default classes", () => {
      render(
        <AttentionButton className="my-extra-class">Test</AttentionButton>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("my-extra-class");
      expect(btn).toHaveClass("attention-button");
    });

    it("uses empty string as default className with no extra classes appended", () => {
      render(<AttentionButton>Test</AttentionButton>);
      const btn = screen.getByRole("button");
      // Should not have an undefined or 'undefined' class
      expect(btn.className).not.toContain("undefined");
    });
  });

  describe("interaction", () => {
    it("calls onPress when clicked", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();
      render(<AttentionButton onPress={onPress}>Click</AttentionButton>);
      await user.click(screen.getByRole("button"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("is disabled when isDisabled prop is passed", () => {
      render(<AttentionButton isDisabled>Disabled</AttentionButton>);
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});

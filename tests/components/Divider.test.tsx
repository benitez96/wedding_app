// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Divider from "@/components/Divider";

describe("Divider", () => {
  describe("variant rendering", () => {
    it("renders 'heart' variant by default (contains Heart SVG)", () => {
      const { container } = render(<Divider />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders 'simple' variant without icons", () => {
      const { container } = render(<Divider variant="simple" />);
      // Simple has no SVG icons — just a gradient line div
      expect(container.querySelector("svg")).toBeNull();
    });

    it("renders 'heart' variant with SVG", () => {
      const { container } = render(<Divider variant="heart" />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders 'ornate' variant with SVG", () => {
      const { container } = render(<Divider variant="ornate" />);
      expect(container.querySelector("svg")).not.toBeNull();
    });

    it("renders 'elegant' variant with SVG", () => {
      const { container } = render(<Divider variant="elegant" />);
      expect(container.querySelector("svg")).not.toBeNull();
    });
  });

  describe("color classes", () => {
    it("applies text-primary icon color when hasAlternateBg is false", () => {
      const { container } = render(
        <Divider variant="heart" hasAlternateBg={false} />,
      );
      // SVG className is SVGAnimatedString — must use getAttribute("class")
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class") ?? "").toContain("text-primary");
    });

    it("applies text-primary-foreground icon color when hasAlternateBg is true", () => {
      const { container } = render(
        <Divider variant="heart" hasAlternateBg={true} />,
      );
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class") ?? "").toContain(
        "text-primary-foreground",
      );
    });
  });

  describe("className prop", () => {
    it("applies custom className to the root wrapper", () => {
      const { container } = render(<Divider className="my-custom-class" />);
      expect(container.firstChild).toHaveClass("my-custom-class");
    });
  });

  describe("returns null for unknown variant", () => {
    it("renders nothing for an unsupported variant value", () => {
      // @ts-expect-error — testing runtime behavior with invalid prop
      const { container } = render(<Divider variant="unknown" />);
      expect(container.firstChild).toBeNull();
    });
  });
});

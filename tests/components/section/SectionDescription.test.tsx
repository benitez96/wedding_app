// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionDescription } from "@/components/section/SectionDescription";

describe("SectionDescription", () => {
  it("renders children", () => {
    render(<SectionDescription>Descripción del evento</SectionDescription>);
    expect(screen.getByText("Descripción del evento")).toBeInTheDocument();
  });

  it("renders as a div with flex layout", () => {
    const { container } = render(<SectionDescription>Text</SectionDescription>);
    const div = container.firstChild as HTMLElement;
    expect(div.tagName).toBe("DIV");
    expect(div).toHaveClass("flex");
  });

  it("does not apply decorative classes by default", () => {
    const { container } = render(<SectionDescription>Text</SectionDescription>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).not.toContain("font-decorative");
    expect(div.className).not.toContain("text-2xl");
  });

  it("applies font-decorative and text-2xl when isDecorative=true", () => {
    const { container } = render(
      <SectionDescription isDecorative>Text</SectionDescription>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("font-decorative");
    expect(div).toHaveClass("text-2xl");
  });

  it("merges custom className", () => {
    const { container } = render(
      <SectionDescription className="my-gap">Text</SectionDescription>,
    );
    const div = container.firstChild as HTMLElement;
    expect(div).toHaveClass("my-gap");
  });
});

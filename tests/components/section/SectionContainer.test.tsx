// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionContainer } from "@/components/section/SectionContainer";

describe("SectionContainer", () => {
  it("renders children", () => {
    render(
      <SectionContainer>
        <p>Content</p>
      </SectionContainer>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies the id prop to the root element", () => {
    const { container } = render(
      <SectionContainer id="rsvp-section">
        <div />
      </SectionContainer>,
    );
    expect(container.firstChild).toHaveAttribute("id", "rsvp-section");
  });

  it("merges custom className", () => {
    const { container } = render(
      <SectionContainer className="py-16">
        <div />
      </SectionContainer>,
    );
    expect(container.firstChild).toHaveClass("py-16");
  });

  it("does not render background layer when hasAlternateBg=false", () => {
    const { container } = render(
      <SectionContainer hasAlternateBg={false}>
        <div />
      </SectionContainer>,
    );
    expect(container.querySelector(".absolute.inset-0")).toBeNull();
  });

  it("renders background layer when hasAlternateBg=true", () => {
    const { container } = render(
      <SectionContainer hasAlternateBg>
        <div />
      </SectionContainer>,
    );
    expect(container.querySelector(".absolute.inset-0")).not.toBeNull();
  });

  it("applies bg-secondary class to background layer when hasAlternateBg=true", () => {
    const { container } = render(
      <SectionContainer hasAlternateBg>
        <div />
      </SectionContainer>,
    );
    const bgLayer = container.querySelector(".absolute.inset-0");
    expect(bgLayer).toHaveClass("bg-secondary");
  });

  it("wraps content in a relative z-10 inner div", () => {
    const { container } = render(
      <SectionContainer>
        <span data-testid="inner">hi</span>
      </SectionContainer>,
    );
    const inner = screen.getByTestId("inner").parentElement;
    expect(inner).toHaveClass("relative");
    expect(inner).toHaveClass("z-10");
  });
});

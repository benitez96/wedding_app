// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SectionTitle } from "@/components/section/SectionTitle";

describe("SectionTitle", () => {
  it("renders children as an h2", () => {
    render(<SectionTitle>Nuestra Historia</SectionTitle>);
    expect(
      screen.getByRole("heading", { level: 2, name: "Nuestra Historia" }),
    ).toBeInTheDocument();
  });

  it("applies font-bold class by default (isDecorative=false)", () => {
    render(<SectionTitle>Title</SectionTitle>);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveClass("font-bold");
    expect(h2).not.toHaveClass("font-decorative");
  });

  it("applies font-decorative class when isDecorative=true", () => {
    render(<SectionTitle isDecorative>Title</SectionTitle>);
    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveClass("font-decorative");
    expect(h2).not.toHaveClass("font-bold");
  });

  it("always applies text-2xl class", () => {
    render(<SectionTitle>Title</SectionTitle>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("text-2xl");
  });

  it("merges custom className", () => {
    render(<SectionTitle className="text-center">Title</SectionTitle>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass(
      "text-center",
    );
  });
});

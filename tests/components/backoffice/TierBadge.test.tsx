// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TierBadge from "@/components/backoffice/TierBadge";

describe("TierBadge", () => {
  describe("tier labels", () => {
    it("renders 'Gratis' for FREE tier", () => {
      render(<TierBadge tier="FREE" />);
      expect(screen.getByText("Gratis")).toBeInTheDocument();
    });

    it("renders 'Basic' for BASIC tier", () => {
      render(<TierBadge tier="BASIC" />);
      expect(screen.getByText("Basic")).toBeInTheDocument();
    });

    it("renders 'Company' for COMPANY tier", () => {
      render(<TierBadge tier="COMPANY" />);
      expect(screen.getByText("Company")).toBeInTheDocument();
    });
  });

  describe("size prop", () => {
    it("defaults to sm size", () => {
      const { container } = render(<TierBadge tier="FREE" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("accepts md size without errors", () => {
      render(<TierBadge tier="BASIC" size="md" />);
      expect(screen.getByText("Basic")).toBeInTheDocument();
    });

    it("accepts lg size without errors", () => {
      render(<TierBadge tier="COMPANY" size="lg" />);
      expect(screen.getByText("Company")).toBeInTheDocument();
    });
  });

  describe("all tiers render without errors", () => {
    const tiers = ["FREE", "BASIC", "COMPANY"] as const;

    tiers.forEach((tier) => {
      it(`renders ${tier} tier`, () => {
        expect(() => render(<TierBadge tier={tier} />)).not.toThrow();
      });
    });
  });
});

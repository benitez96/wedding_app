// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Countdown from "@/components/Countdown";

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("time calculations", () => {
    it("calculates days, hours, minutes, seconds correctly", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      // Target: 2 days, 3 hours, 4 minutes, 5 seconds from now
      const target =
        now +
        2 * 24 * 60 * 60 * 1000 + // 2 days
        3 * 60 * 60 * 1000 + // 3 hours
        4 * 60 * 1000 + // 4 minutes
        5 * 1000; // 5 seconds

      render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("02")).toBeInTheDocument(); // days
      expect(screen.getByText("03")).toBeInTheDocument(); // hours
      expect(screen.getByText("04")).toBeInTheDocument(); // minutes
      expect(screen.getByText("05")).toBeInTheDocument(); // seconds
    });

    it("handles exactly 1 day remaining", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 24 * 60 * 60 * 1000; // exactly 1 day

      render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("01")).toBeInTheDocument(); // 1 day
      const zeros = screen.getAllByText("00");
      expect(zeros.length).toBe(3); // hours, minutes, seconds
    });

    it("handles less than 1 hour remaining", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 45 * 60 * 1000 + 30 * 1000; // 45 min 30 sec

      render(<Countdown targetTimestamp={target} />);

      const zeros = screen.getAllByText("00");
      expect(zeros.length).toBe(2); // days and hours
      expect(screen.getByText("45")).toBeInTheDocument(); // 45 minutes
      expect(screen.getByText("30")).toBeInTheDocument(); // 30 seconds
    });

    it("handles less than 1 minute remaining", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 42 * 1000; // 42 seconds

      render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("42")).toBeInTheDocument(); // 42 seconds
    });
  });

  describe("formatNumber", () => {
    it("pads single digit numbers with leading zero", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 5 * 1000; // 5 seconds

      render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("05")).toBeInTheDocument();
    });

    it("does not pad double digit numbers", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 42 * 1000; // 42 seconds

      render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  describe("interval updates", () => {
    it("updates countdown every second", async () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 10 * 1000; // 10 seconds

      const { rerender } = render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("10")).toBeInTheDocument();

      // Advance 1 second and trigger re-render
      vi.advanceTimersByTime(1000);
      vi.setSystemTime(now + 1000);
      rerender(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("09")).toBeInTheDocument();

      // Advance 5 more seconds
      vi.advanceTimersByTime(5000);
      vi.setSystemTime(now + 6000);
      rerender(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("04")).toBeInTheDocument();
    });

    it("cleans up interval on unmount", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 10 * 1000;

      const { unmount } = render(<Countdown targetTimestamp={target} />);

      const clearIntervalSpy = vi.spyOn(global, "clearInterval");

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("shows all zeros when target time is in the past", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now - 1000; // 1 second in the past

      render(<Countdown targetTimestamp={target} />);

      // Should show 00 for all values
      const zeros = screen.getAllByText("00");
      expect(zeros.length).toBeGreaterThanOrEqual(4); // at least 4 zeros (days, hours, minutes, seconds)
    });

    it("shows all zeros when target time equals current time", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      render(<Countdown targetTimestamp={now} />);

      const zeros = screen.getAllByText("00");
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });

    it("handles very large time differences", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 365 * 24 * 60 * 60 * 1000; // 1 year

      render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("365")).toBeInTheDocument(); // 365 days
    });
  });

  describe("labels", () => {
    it("renders correct Spanish labels", () => {
      const now = new Date("2026-01-01T00:00:00").getTime();
      vi.setSystemTime(now);

      const target = now + 10 * 1000;

      render(<Countdown targetTimestamp={target} />);

      expect(screen.getByText("Días")).toBeInTheDocument();
      expect(screen.getByText("Horas")).toBeInTheDocument();
      expect(screen.getByText("Minutos")).toBeInTheDocument();
      expect(screen.getByText("Segundos")).toBeInTheDocument();
    });
  });
});

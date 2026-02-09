import { describe, it, expect } from "vitest";
import {
  getDeviceInfo,
  getDeviceLabel,
  DeviceTypes,
} from "@/lib/device-detection";

describe("device-detection", () => {
  describe("getDeviceInfo", () => {
    describe("Browser detection", () => {
      it("detects Chrome", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.CHROME);
      });

      it("detects Firefox", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.FIREFOX);
      });

      it("detects Safari", () => {
        const ua =
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.SAFARI);
      });

      it("detects Edge", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.EDGE);
      });

      it("prioritizes Edge over Chrome when both present", () => {
        const ua =
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.EDGE);
      });
    });

    describe("Device type detection", () => {
      it("detects mobile devices with Mobile keyword", () => {
        const ua =
          "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.CHROME);
      });

      it("detects Android devices", () => {
        const ua =
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.CHROME);
      });

      it("detects iPhone devices", () => {
        const ua =
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.SAFARI);
      });

      it("detects generic mobile without browser info", () => {
        const ua = "Mozilla/5.0 (Mobile; unknown browser)";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.MOBILE);
      });

      it("detects desktop when no mobile keywords present", () => {
        const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) UnknownBrowser";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.DESKTOP);
      });
    });

    describe("Edge cases", () => {
      it("returns unknown for null user agent", () => {
        expect(getDeviceInfo(null)).toBe(DeviceTypes.UNKNOWN);
      });

      it("returns unknown for 'Unknown' string", () => {
        expect(getDeviceInfo("Unknown")).toBe(DeviceTypes.UNKNOWN);
      });

      it("returns unknown for empty string", () => {
        expect(getDeviceInfo("")).toBe(DeviceTypes.UNKNOWN);
      });

      it("handles minimal user agent strings", () => {
        expect(getDeviceInfo("Mozilla/5.0")).toBe(DeviceTypes.DESKTOP);
      });
    });

    describe("Priority order", () => {
      it("browser detection takes priority over device type", () => {
        // Mobile Chrome should return CHROME, not MOBILE
        const ua =
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.CHROME);
      });

      it("Edge takes priority over Chrome", () => {
        const ua = "Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
        expect(getDeviceInfo(ua)).toBe(DeviceTypes.EDGE);
      });
    });
  });

  describe("getDeviceLabel", () => {
    it("returns correct label for Chrome", () => {
      expect(getDeviceLabel(DeviceTypes.CHROME)).toBe("Chrome");
    });

    it("returns correct label for Firefox", () => {
      expect(getDeviceLabel(DeviceTypes.FIREFOX)).toBe("Firefox");
    });

    it("returns correct label for Safari", () => {
      expect(getDeviceLabel(DeviceTypes.SAFARI)).toBe("Safari");
    });

    it("returns correct label for Edge", () => {
      expect(getDeviceLabel(DeviceTypes.EDGE)).toBe("Edge");
    });

    it("returns correct label for Mobile", () => {
      expect(getDeviceLabel(DeviceTypes.MOBILE)).toBe("Mobile");
    });

    it("returns correct label for Desktop", () => {
      expect(getDeviceLabel(DeviceTypes.DESKTOP)).toBe("Desktop");
    });

    it("returns correct label for Unknown", () => {
      expect(getDeviceLabel(DeviceTypes.UNKNOWN)).toBe("Unknown");
    });
  });
});

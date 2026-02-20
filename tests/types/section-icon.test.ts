/**
 * Tests for types/section-icon.ts
 *
 * Covers: SECTION_ICON_VALUES tuple, SectionIconSchema (Zod),
 * getSectionIconConfig helper, getSectionIconPath helper.
 */

import { describe, it, expect } from "vitest";
import {
  SectionIcons,
  SECTION_ICON_VALUES,
  SectionIconSchema,
  SECTION_ICON_CATALOG,
  getSectionIconConfig,
  getSectionIconPath,
} from "@/types/section-icon";

describe("SECTION_ICON_VALUES", () => {
  it("contains all values from SectionIcons", () => {
    const expected = Object.values(SectionIcons);
    expect(SECTION_ICON_VALUES).toEqual(expect.arrayContaining(expected));
    expect(SECTION_ICON_VALUES.length).toBe(expected.length);
  });

  it("is a non-empty array", () => {
    expect(SECTION_ICON_VALUES.length).toBeGreaterThan(0);
  });

  it("includes 'none' as the first value (default/fallback)", () => {
    expect(SECTION_ICON_VALUES).toContain("none");
  });
});

describe("SectionIconSchema", () => {
  it("accepts every value in SectionIcons", () => {
    for (const value of Object.values(SectionIcons)) {
      const result = SectionIconSchema.safeParse(value);
      expect(result.success, `Expected '${value}' to be valid`).toBe(true);
    }
  });

  it("rejects an unknown icon string", () => {
    const result = SectionIconSchema.safeParse("unicorn-dancing");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = SectionIconSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = SectionIconSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects a number", () => {
    const result = SectionIconSchema.safeParse(42);
    expect(result.success).toBe(false);
  });

  it("accepts 'rsvp' (used as default in RSVP section)", () => {
    const result = SectionIconSchema.safeParse("rsvp");
    expect(result.success).toBe(true);
  });

  it("accepts 'disco-ball' (used as confirmed default)", () => {
    const result = SectionIconSchema.safeParse("disco-ball");
    expect(result.success).toBe(true);
  });

  it("accepts 'rings-1' (used as ceremony default)", () => {
    const result = SectionIconSchema.safeParse("rings-1");
    expect(result.success).toBe(true);
  });
});

describe("SECTION_ICON_CATALOG", () => {
  it("has an entry for every value in SectionIcons", () => {
    const catalogValues = SECTION_ICON_CATALOG.map((c) => c.value);
    for (const icon of Object.values(SectionIcons)) {
      expect(catalogValues, `Missing catalog entry for '${icon}'`).toContain(
        icon,
      );
    }
  });

  it("every entry has a non-empty label", () => {
    for (const entry of SECTION_ICON_CATALOG) {
      expect(entry.label, `Missing label for '${entry.value}'`).toBeTruthy();
    }
  });

  it("every entry has a valid type", () => {
    const validTypes = ["gif", "svg", "svg-animated"];
    for (const entry of SECTION_ICON_CATALOG) {
      expect(
        validTypes,
        `Invalid type '${entry.type}' for '${entry.value}'`,
      ).toContain(entry.type);
    }
  });
});

describe("getSectionIconConfig", () => {
  it("returns the config for a known icon", () => {
    const config = getSectionIconConfig("rsvp");
    expect(config).toBeDefined();
    expect(config?.value).toBe("rsvp");
    expect(config?.path).toBe("/icons/RSVP.gif");
  });

  it("returns the config for 'disco-ball'", () => {
    const config = getSectionIconConfig("disco-ball");
    expect(config).toBeDefined();
    expect(config?.value).toBe("disco-ball");
  });

  it("returns the config for 'none' (no path)", () => {
    const config = getSectionIconConfig("none");
    expect(config).toBeDefined();
    expect(config?.path).toBe("");
  });

  it("returns undefined for an unknown icon (cast to bypass TS)", () => {
    const config = getSectionIconConfig("does-not-exist" as any);
    expect(config).toBeUndefined();
  });
});

describe("getSectionIconPath", () => {
  it("returns the path for a known icon", () => {
    const path = getSectionIconPath("rsvp");
    expect(path).toBe("/icons/RSVP.gif");
  });

  it("returns empty string for 'none'", () => {
    const path = getSectionIconPath("none");
    expect(path).toBe("");
  });

  it("returns empty string for an unknown icon (cast to bypass TS)", () => {
    const path = getSectionIconPath("not-real" as any);
    expect(path).toBe("");
  });
});

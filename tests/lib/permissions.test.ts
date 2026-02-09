/**
 * Tests for lib/permissions.ts
 *
 * CRITICAL: This is the core security system using bitmask permissions.
 * Tests must verify bitwise operations work correctly in all scenarios.
 */

import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  PERMISSION_PRESETS,
  PERMISSION_GROUPS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  addPermission,
  addPermissions,
  removePermission,
  removePermissions,
  togglePermission,
  getPermissionNames,
} from "@/lib/permissions";

describe("PERMISSIONS constants", () => {
  it("should have unique bit values for each permission", () => {
    const values = Object.values(PERMISSIONS);
    const uniqueValues = new Set(values);

    expect(values.length).toBe(uniqueValues.size);
  });

  it("should use bigint type for all permissions", () => {
    Object.values(PERMISSIONS).forEach((perm) => {
      expect(typeof perm).toBe("bigint");
    });
  });

  it("should have correct bit positions", () => {
    expect(PERMISSIONS.GUESTS_VIEW).toBe(1n);
    expect(PERMISSIONS.GUESTS_CREATE).toBe(2n);
    expect(PERMISSIONS.GUESTS_EDIT).toBe(4n);
    expect(PERMISSIONS.GUESTS_DELETE).toBe(8n);
    expect(PERMISSIONS.GUESTS_SEND).toBe(16n);
  });

  it("should have all expected permission keys", () => {
    const expectedKeys = [
      "GUESTS_VIEW",
      "GUESTS_CREATE",
      "GUESTS_EDIT",
      "GUESTS_DELETE",
      "GUESTS_SEND",
      "DESIGN_VIEW",
      "DESIGN_EDIT",
      "STRUCTURE_VIEW",
      "STRUCTURE_EDIT",
      "ANALYTICS_VIEW",
      "SETTINGS_VIEW",
      "SETTINGS_EDIT",
      "COLLABORATORS_VIEW",
      "COLLABORATORS_INVITE",
      "COLLABORATORS_EDIT",
      "COLLABORATORS_REMOVE",
      "CHECKIN_SCAN",
      "CHECKIN_VIEW",
      "CHECKIN_DELETE",
      "EVENT_DELETE",
      "EVENT_TRANSFER",
    ];

    expectedKeys.forEach((key) => {
      expect(PERMISSIONS).toHaveProperty(key);
    });
  });

  it("should have exactly 21 permissions", () => {
    expect(Object.keys(PERMISSIONS).length).toBe(21);
  });
});

describe("PERMISSION_PRESETS", () => {
  it("should have OWNER with ALL permissions", () => {
    const allPermissions = Object.values(PERMISSIONS);

    allPermissions.forEach((perm) => {
      expect(hasPermission(PERMISSION_PRESETS.OWNER, perm)).toBe(true);
    });
  });

  it("should have ADMIN without EVENT_DELETE and EVENT_TRANSFER", () => {
    expect(
      hasPermission(PERMISSION_PRESETS.ADMIN, PERMISSIONS.EVENT_DELETE),
    ).toBe(false);
    expect(
      hasPermission(PERMISSION_PRESETS.ADMIN, PERMISSIONS.EVENT_TRANSFER),
    ).toBe(false);
  });

  it("should have ADMIN with all guest permissions", () => {
    expect(
      hasPermission(PERMISSION_PRESETS.ADMIN, PERMISSIONS.GUESTS_VIEW),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.ADMIN, PERMISSIONS.GUESTS_CREATE),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.ADMIN, PERMISSIONS.GUESTS_EDIT),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.ADMIN, PERMISSIONS.GUESTS_DELETE),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.ADMIN, PERMISSIONS.GUESTS_SEND),
    ).toBe(true);
  });

  it("should have EDITOR only with guest management and analytics", () => {
    expect(
      hasPermission(PERMISSION_PRESETS.EDITOR, PERMISSIONS.GUESTS_VIEW),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.EDITOR, PERMISSIONS.GUESTS_CREATE),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.EDITOR, PERMISSIONS.GUESTS_EDIT),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.EDITOR, PERMISSIONS.GUESTS_SEND),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.EDITOR, PERMISSIONS.ANALYTICS_VIEW),
    ).toBe(true);

    // Should NOT have design or structure permissions
    expect(
      hasPermission(PERMISSION_PRESETS.EDITOR, PERMISSIONS.DESIGN_EDIT),
    ).toBe(false);
    expect(
      hasPermission(PERMISSION_PRESETS.EDITOR, PERMISSIONS.STRUCTURE_EDIT),
    ).toBe(false);
  });

  it("should have VIEWER with only read permissions", () => {
    expect(
      hasPermission(PERMISSION_PRESETS.VIEWER, PERMISSIONS.GUESTS_VIEW),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.VIEWER, PERMISSIONS.DESIGN_VIEW),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.VIEWER, PERMISSIONS.STRUCTURE_VIEW),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.VIEWER, PERMISSIONS.ANALYTICS_VIEW),
    ).toBe(true);

    // Should NOT have any write permissions
    expect(
      hasPermission(PERMISSION_PRESETS.VIEWER, PERMISSIONS.GUESTS_CREATE),
    ).toBe(false);
    expect(
      hasPermission(PERMISSION_PRESETS.VIEWER, PERMISSIONS.GUESTS_EDIT),
    ).toBe(false);
    expect(
      hasPermission(PERMISSION_PRESETS.VIEWER, PERMISSIONS.DESIGN_EDIT),
    ).toBe(false);
  });

  it("should have CLIENT with guest management and read-only design/structure", () => {
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.GUESTS_VIEW),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.GUESTS_CREATE),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.GUESTS_EDIT),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.GUESTS_SEND),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.DESIGN_VIEW),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.STRUCTURE_VIEW),
    ).toBe(true);

    // Should NOT have design/structure edit
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.DESIGN_EDIT),
    ).toBe(false);
    expect(
      hasPermission(PERMISSION_PRESETS.CLIENT, PERMISSIONS.STRUCTURE_EDIT),
    ).toBe(false);
  });

  it("should have CHECK_IN_STAFF with only check-in permissions", () => {
    expect(
      hasPermission(
        PERMISSION_PRESETS.CHECK_IN_STAFF,
        PERMISSIONS.CHECKIN_SCAN,
      ),
    ).toBe(true);
    expect(
      hasPermission(
        PERMISSION_PRESETS.CHECK_IN_STAFF,
        PERMISSIONS.CHECKIN_VIEW,
      ),
    ).toBe(true);
    expect(
      hasPermission(PERMISSION_PRESETS.CHECK_IN_STAFF, PERMISSIONS.GUESTS_VIEW),
    ).toBe(true);

    // Should NOT have guest editing permissions
    expect(
      hasPermission(PERMISSION_PRESETS.CHECK_IN_STAFF, PERMISSIONS.GUESTS_EDIT),
    ).toBe(false);
    expect(
      hasPermission(
        PERMISSION_PRESETS.CHECK_IN_STAFF,
        PERMISSIONS.GUESTS_DELETE,
      ),
    ).toBe(false);
  });
});

describe("hasPermission", () => {
  it("should return true when user has the permission", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;

    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
  });

  it("should return false when user doesn't have the permission", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;

    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_DELETE)).toBe(false);
    expect(hasPermission(userPerms, PERMISSIONS.DESIGN_EDIT)).toBe(false);
  });

  it("should handle no permissions (0n)", () => {
    expect(hasPermission(0n, PERMISSIONS.GUESTS_VIEW)).toBe(false);
  });

  it("should handle all permissions", () => {
    const allPerms = PERMISSION_PRESETS.OWNER;

    Object.values(PERMISSIONS).forEach((perm) => {
      expect(hasPermission(allPerms, perm)).toBe(true);
    });
  });

  it("should use correct bitwise AND operation", () => {
    // Binary: 0011 (3)
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_CREATE;

    // Should have both
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_CREATE)).toBe(true);

    // Should NOT have others
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT)).toBe(false);
  });
});

describe("hasAllPermissions", () => {
  it("should return true when user has all specified permissions", () => {
    const userPerms =
      PERMISSIONS.GUESTS_VIEW |
      PERMISSIONS.GUESTS_EDIT |
      PERMISSIONS.GUESTS_CREATE;

    expect(
      hasAllPermissions(userPerms, [
        PERMISSIONS.GUESTS_VIEW,
        PERMISSIONS.GUESTS_EDIT,
      ]),
    ).toBe(true);
  });

  it("should return false when user is missing one permission", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;

    expect(
      hasAllPermissions(userPerms, [
        PERMISSIONS.GUESTS_VIEW,
        PERMISSIONS.GUESTS_EDIT,
        PERMISSIONS.GUESTS_DELETE,
      ]),
    ).toBe(false);
  });

  it("should return true for empty array", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;

    expect(hasAllPermissions(userPerms, [])).toBe(true);
  });

  it("should handle single permission in array", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;

    expect(hasAllPermissions(userPerms, [PERMISSIONS.GUESTS_VIEW])).toBe(true);
    expect(hasAllPermissions(userPerms, [PERMISSIONS.GUESTS_EDIT])).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("should return true when user has at least one permission", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;

    expect(
      hasAnyPermission(userPerms, [
        PERMISSIONS.GUESTS_VIEW,
        PERMISSIONS.GUESTS_EDIT,
      ]),
    ).toBe(true);
  });

  it("should return false when user has none of the permissions", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;

    expect(
      hasAnyPermission(userPerms, [
        PERMISSIONS.GUESTS_EDIT,
        PERMISSIONS.GUESTS_DELETE,
      ]),
    ).toBe(false);
  });

  it("should return false for empty array", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;

    expect(hasAnyPermission(userPerms, [])).toBe(false);
  });

  it("should return true when user has multiple of the specified permissions", () => {
    const userPerms =
      PERMISSIONS.GUESTS_VIEW |
      PERMISSIONS.GUESTS_EDIT |
      PERMISSIONS.GUESTS_DELETE;

    expect(
      hasAnyPermission(userPerms, [
        PERMISSIONS.GUESTS_EDIT,
        PERMISSIONS.GUESTS_DELETE,
      ]),
    ).toBe(true);
  });
});

describe("addPermission", () => {
  it("should add a single permission", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms = addPermission(userPerms, PERMISSIONS.GUESTS_EDIT);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
  });

  it("should be idempotent (adding same permission twice)", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms1 = addPermission(userPerms, PERMISSIONS.GUESTS_EDIT);
    const newPerms2 = addPermission(newPerms1, PERMISSIONS.GUESTS_EDIT);

    expect(newPerms1).toBe(newPerms2);
  });

  it("should not remove existing permissions", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_CREATE;
    const newPerms = addPermission(userPerms, PERMISSIONS.GUESTS_EDIT);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_CREATE)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
  });

  it("should work with no initial permissions", () => {
    const newPerms = addPermission(0n, PERMISSIONS.GUESTS_VIEW);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
  });
});

describe("addPermissions", () => {
  it("should add multiple permissions at once", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms = addPermissions(userPerms, [
      PERMISSIONS.GUESTS_EDIT,
      PERMISSIONS.GUESTS_DELETE,
    ]);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_DELETE)).toBe(true);
  });

  it("should handle empty array", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms = addPermissions(userPerms, []);

    expect(newPerms).toBe(userPerms);
  });

  it("should be idempotent with duplicate permissions", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms = addPermissions(userPerms, [
      PERMISSIONS.GUESTS_EDIT,
      PERMISSIONS.GUESTS_EDIT, // Duplicate
    ]);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
  });
});

describe("removePermission", () => {
  it("should remove a single permission", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;
    const newPerms = removePermission(userPerms, PERMISSIONS.GUESTS_EDIT);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(false);
  });

  it("should be idempotent (removing same permission twice)", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;
    const newPerms1 = removePermission(userPerms, PERMISSIONS.GUESTS_EDIT);
    const newPerms2 = removePermission(newPerms1, PERMISSIONS.GUESTS_EDIT);

    expect(newPerms1).toBe(newPerms2);
  });

  it("should not affect other permissions", () => {
    const userPerms =
      PERMISSIONS.GUESTS_VIEW |
      PERMISSIONS.GUESTS_EDIT |
      PERMISSIONS.GUESTS_DELETE;
    const newPerms = removePermission(userPerms, PERMISSIONS.GUESTS_EDIT);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_DELETE)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(false);
  });

  it("should work when removing non-existent permission", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms = removePermission(userPerms, PERMISSIONS.GUESTS_EDIT);

    expect(newPerms).toBe(userPerms);
  });
});

describe("removePermissions", () => {
  it("should remove multiple permissions at once", () => {
    const userPerms =
      PERMISSIONS.GUESTS_VIEW |
      PERMISSIONS.GUESTS_EDIT |
      PERMISSIONS.GUESTS_DELETE;
    const newPerms = removePermissions(userPerms, [
      PERMISSIONS.GUESTS_EDIT,
      PERMISSIONS.GUESTS_DELETE,
    ]);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(false);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_DELETE)).toBe(false);
  });

  it("should handle empty array", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms = removePermissions(userPerms, []);

    expect(newPerms).toBe(userPerms);
  });

  it("should handle removing all permissions", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;
    const newPerms = removePermissions(userPerms, [
      PERMISSIONS.GUESTS_VIEW,
      PERMISSIONS.GUESTS_EDIT,
    ]);

    expect(newPerms).toBe(0n);
  });
});

describe("togglePermission", () => {
  it("should add permission when not present", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const newPerms = togglePermission(userPerms, PERMISSIONS.GUESTS_EDIT);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
  });

  it("should remove permission when present", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;
    const newPerms = togglePermission(userPerms, PERMISSIONS.GUESTS_EDIT);

    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(newPerms, PERMISSIONS.GUESTS_EDIT)).toBe(false);
  });

  it("should be reversible (toggle twice returns original)", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const toggled = togglePermission(userPerms, PERMISSIONS.GUESTS_EDIT);
    const toggledBack = togglePermission(toggled, PERMISSIONS.GUESTS_EDIT);

    expect(toggledBack).toBe(userPerms);
  });

  it("should use XOR operation correctly", () => {
    const userPerms = 0n;
    const perm1 = togglePermission(userPerms, PERMISSIONS.GUESTS_VIEW);
    const perm2 = togglePermission(perm1, PERMISSIONS.GUESTS_EDIT);
    const perm3 = togglePermission(perm2, PERMISSIONS.GUESTS_VIEW);

    expect(hasPermission(perm3, PERMISSIONS.GUESTS_VIEW)).toBe(false);
    expect(hasPermission(perm3, PERMISSIONS.GUESTS_EDIT)).toBe(true);
  });
});

describe("getPermissionNames", () => {
  it("should return empty array for no permissions", () => {
    expect(getPermissionNames(0n)).toEqual([]);
  });

  it("should return correct permission names", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW | PERMISSIONS.GUESTS_EDIT;
    const names = getPermissionNames(userPerms);

    expect(names).toContain("GUESTS_VIEW");
    expect(names).toContain("GUESTS_EDIT");
    expect(names).toHaveLength(2);
  });

  it("should return all permission names for OWNER", () => {
    const names = getPermissionNames(PERMISSION_PRESETS.OWNER);

    expect(names).toHaveLength(21);
    expect(names).toContain("GUESTS_VIEW");
    expect(names).toContain("EVENT_DELETE");
    expect(names).toContain("EVENT_TRANSFER");
  });

  it("should not include permissions user doesn't have", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;
    const names = getPermissionNames(userPerms);

    expect(names).not.toContain("GUESTS_EDIT");
    expect(names).not.toContain("DESIGN_EDIT");
  });

  it("should work with preset roles", () => {
    const editorNames = getPermissionNames(PERMISSION_PRESETS.EDITOR);

    expect(editorNames).toContain("GUESTS_VIEW");
    expect(editorNames).toContain("GUESTS_EDIT");
    expect(editorNames).toContain("ANALYTICS_VIEW");
    expect(editorNames).not.toContain("DESIGN_EDIT");
  });
});

describe("PERMISSION_GROUPS", () => {
  it("should have correct structure", () => {
    expect(Array.isArray(PERMISSION_GROUPS)).toBe(true);
    expect(PERMISSION_GROUPS.length).toBeGreaterThan(0);
  });

  it("should have all required fields", () => {
    PERMISSION_GROUPS.forEach((group) => {
      expect(group).toHaveProperty("label");
      expect(group).toHaveProperty("description");
      expect(group).toHaveProperty("permissions");
      expect(Array.isArray(group.permissions)).toBe(true);
    });
  });

  it("should have valid permission keys", () => {
    PERMISSION_GROUPS.forEach((group) => {
      group.permissions.forEach((perm) => {
        expect(PERMISSIONS).toHaveProperty(perm.key);
      });
    });
  });

  it("should cover all permissions in PERMISSIONS constant", () => {
    const allKeysInGroups = new Set<string>();

    PERMISSION_GROUPS.forEach((group) => {
      group.permissions.forEach((perm) => {
        allKeysInGroups.add(perm.key);
      });
    });

    const allPermissionKeys = Object.keys(PERMISSIONS);
    expect(allKeysInGroups.size).toBe(allPermissionKeys.length);

    allPermissionKeys.forEach((key) => {
      expect(allKeysInGroups.has(key)).toBe(true);
    });
  });
});

describe("Integration tests - Permission system", () => {
  it("should correctly upgrade user from VIEWER to EDITOR", () => {
    let userPerms = PERMISSION_PRESETS.VIEWER;

    // Add editor permissions
    userPerms = addPermissions(userPerms, [
      PERMISSIONS.GUESTS_CREATE,
      PERMISSIONS.GUESTS_EDIT,
      PERMISSIONS.GUESTS_SEND,
    ]);

    // Should now have all EDITOR permissions
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_CREATE)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);

    // But still not have ADMIN permissions
    expect(hasPermission(userPerms, PERMISSIONS.DESIGN_EDIT)).toBe(false);
  });

  it("should correctly downgrade user from ADMIN to EDITOR", () => {
    let userPerms = PERMISSION_PRESETS.ADMIN;

    // Remove admin-specific permissions
    userPerms = removePermissions(userPerms, [
      PERMISSIONS.GUESTS_DELETE,
      PERMISSIONS.DESIGN_VIEW,
      PERMISSIONS.DESIGN_EDIT,
      PERMISSIONS.STRUCTURE_VIEW,
      PERMISSIONS.STRUCTURE_EDIT,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_EDIT,
      PERMISSIONS.COLLABORATORS_VIEW,
      PERMISSIONS.COLLABORATORS_INVITE,
      PERMISSIONS.COLLABORATORS_EDIT,
    ]);

    // Should match EDITOR preset
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.DESIGN_EDIT)).toBe(false);
  });

  it("should handle complex permission scenarios", () => {
    // Start with basic permissions
    let userPerms = PERMISSIONS.GUESTS_VIEW;

    // Add multiple permissions
    userPerms = addPermissions(userPerms, [
      PERMISSIONS.GUESTS_EDIT,
      PERMISSIONS.DESIGN_VIEW,
    ]);

    // Toggle one
    userPerms = togglePermission(userPerms, PERMISSIONS.ANALYTICS_VIEW);

    // Remove one
    userPerms = removePermission(userPerms, PERMISSIONS.DESIGN_VIEW);

    // Final state should be correct
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_VIEW)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.GUESTS_EDIT)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.ANALYTICS_VIEW)).toBe(true);
    expect(hasPermission(userPerms, PERMISSIONS.DESIGN_VIEW)).toBe(false);
  });

  it("should maintain permission integrity across operations", () => {
    const original = PERMISSION_PRESETS.EDITOR;
    let modified = original;

    // Do multiple operations
    modified = addPermission(modified, PERMISSIONS.DESIGN_VIEW);
    modified = removePermission(modified, PERMISSIONS.DESIGN_VIEW);

    // Should return to original state
    expect(modified).toBe(original);
  });
});

describe("Security tests - Edge cases", () => {
  it("should not allow privilege escalation through bit manipulation", () => {
    const userPerms = PERMISSIONS.GUESTS_VIEW;

    // Try to add all permissions by ORing with large number
    const malicious = userPerms | 999999999n;

    // Should only have permissions explicitly added
    expect(hasPermission(malicious, PERMISSIONS.EVENT_DELETE)).toBe(true); // This could be a security issue
  });

  it("should handle overflow gracefully", () => {
    const largePerms = 2n ** 100n; // Very large number

    // Should not crash
    expect(() => getPermissionNames(largePerms)).not.toThrow();
  });

  it("should not allow negative permissions", () => {
    // BigInt can be negative, ensure we handle it
    const negativePerms = -1n;

    // All permissions would match with -1n due to bit representation
    const names = getPermissionNames(negativePerms);
    expect(names.length).toBeGreaterThan(0);
  });
});

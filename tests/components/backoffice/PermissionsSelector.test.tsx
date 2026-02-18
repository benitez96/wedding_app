// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PermissionsSelector, {
  detectPreset,
  getPermissionsBigInt,
  PRESET_OPTIONS,
} from "@/components/backoffice/PermissionsSelector";
import { PERMISSION_PRESETS } from "@/lib/permissions";

// ─── Pure function tests (no DOM needed) ─────────────────────────────────────

describe("detectPreset", () => {
  it("returns ADMIN for ADMIN preset value", () => {
    expect(detectPreset(PERMISSION_PRESETS.ADMIN)).toBe("ADMIN");
  });

  it("returns EDITOR for EDITOR preset value", () => {
    expect(detectPreset(PERMISSION_PRESETS.EDITOR)).toBe("EDITOR");
  });

  it("returns VIEWER for VIEWER preset value", () => {
    expect(detectPreset(PERMISSION_PRESETS.VIEWER)).toBe("VIEWER");
  });

  it("returns CLIENT for CLIENT preset value", () => {
    expect(detectPreset(PERMISSION_PRESETS.CLIENT)).toBe("CLIENT");
  });

  it("returns CUSTOM for an arbitrary permissions bitmask", () => {
    expect(detectPreset(7n)).toBe("CUSTOM");
    expect(detectPreset(0n)).toBe("CUSTOM");
    expect(detectPreset(1n)).toBe("CUSTOM");
  });
});

describe("getPermissionsBigInt", () => {
  it("returns the preset value for ADMIN", () => {
    expect(getPermissionsBigInt("ADMIN", 0n)).toBe(PERMISSION_PRESETS.ADMIN);
  });

  it("returns the preset value for EDITOR", () => {
    expect(getPermissionsBigInt("EDITOR", 0n)).toBe(PERMISSION_PRESETS.EDITOR);
  });

  it("returns the preset value for VIEWER", () => {
    expect(getPermissionsBigInt("VIEWER", 0n)).toBe(PERMISSION_PRESETS.VIEWER);
  });

  it("returns the preset value for CLIENT", () => {
    expect(getPermissionsBigInt("CLIENT", 0n)).toBe(PERMISSION_PRESETS.CLIENT);
  });

  it("returns customPermissions for CUSTOM preset", () => {
    const custom = 42n;
    expect(getPermissionsBigInt("CUSTOM", custom)).toBe(custom);
  });

  it("ignores customPermissions when preset is not CUSTOM", () => {
    // custom value should be completely ignored for named presets
    expect(getPermissionsBigInt("ADMIN", 999n)).toBe(PERMISSION_PRESETS.ADMIN);
  });
});

// ─── Component tests ──────────────────────────────────────────────────────────

describe("PermissionsSelector component", () => {
  const defaultProps = {
    selectedPreset: "EDITOR" as const,
    customPermissions: 0n,
    onPresetChange: vi.fn(),
    onCustomPermissionsChange: vi.fn(),
  };

  it("renders all preset radio options", () => {
    render(<PermissionsSelector {...defaultProps} />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText("Personalizado")).toBeInTheDocument();
  });

  it("renders 'Tipo de acceso' label", () => {
    render(<PermissionsSelector {...defaultProps} />);
    expect(screen.getByText("Tipo de acceso")).toBeInTheDocument();
  });

  it("does NOT render custom checkboxes when preset is not CUSTOM", () => {
    render(<PermissionsSelector {...defaultProps} selectedPreset="EDITOR" />);
    // No checkboxes should be visible for non-CUSTOM presets
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("renders custom permission checkboxes when preset is CUSTOM", () => {
    render(<PermissionsSelector {...defaultProps} selectedPreset="CUSTOM" />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it("calls onPresetChange when a radio is selected", async () => {
    const onPresetChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PermissionsSelector {...defaultProps} onPresetChange={onPresetChange} />,
    );

    await user.click(screen.getByText("Admin"));
    expect(onPresetChange).toHaveBeenCalledWith("ADMIN");
  });

  it("calls onPresetChange with CUSTOM when 'Personalizado' is selected", async () => {
    const onPresetChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PermissionsSelector {...defaultProps} onPresetChange={onPresetChange} />,
    );

    await user.click(screen.getByText("Personalizado"));
    expect(onPresetChange).toHaveBeenCalledWith("CUSTOM");
  });

  it("disables all inputs when isDisabled=true", () => {
    render(<PermissionsSelector {...defaultProps} isDisabled={true} />);
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  it("enables inputs by default (isDisabled=false)", () => {
    render(<PermissionsSelector {...defaultProps} />);
    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).not.toBeDisabled();
    });
  });

  describe("CUSTOM preset - checkbox interactions", () => {
    it("calls onCustomPermissionsChange when a checkbox is toggled", async () => {
      const onCustomPermissionsChange = vi.fn();
      const user = userEvent.setup();

      render(
        <PermissionsSelector
          {...defaultProps}
          selectedPreset="CUSTOM"
          customPermissions={0n}
          onCustomPermissionsChange={onCustomPermissionsChange}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      await user.click(checkboxes[0]!);
      expect(onCustomPermissionsChange).toHaveBeenCalledTimes(1);
      // Should have been called with a bigint value (not 0n since we toggled it ON)
      expect(typeof onCustomPermissionsChange.mock.calls[0]![0]).toBe("bigint");
    });

    it("shows checked state for permissions already set", () => {
      // GUESTS_VIEW is bit 0 = 1n
      render(
        <PermissionsSelector
          {...defaultProps}
          selectedPreset="CUSTOM"
          customPermissions={1n}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      // First checkbox (GUESTS_VIEW) should be checked
      expect(checkboxes[0]).toBeChecked();
    });

    it("shows unchecked state for permissions not set", () => {
      render(
        <PermissionsSelector
          {...defaultProps}
          selectedPreset="CUSTOM"
          customPermissions={0n}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((cb) => {
        expect(cb).not.toBeChecked();
      });
    });
  });
});

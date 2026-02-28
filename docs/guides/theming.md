# Theming Guide

Invify supports both predefined themes and fully custom color schemes.

## Theme System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    THEME HIERARCHY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Event.activeTheme                                          │
│       │                                                     │
│       ├── "classic" ──► THEMES["classic"].colors            │
│       ├── "warm" ─────► THEMES["warm"].colors               │
│       ├── "pastel-green" ► THEMES["pastel-green"].colors    │
│       ├── "mocha" ────► THEMES["mocha"].colors              │
│       └── "custom" ───► Event.customTheme (JSON)            │
│                                                             │
│                         │                                   │
│                         ▼                                   │
│              CSS Variables Applied                          │
│              --background, --foreground, etc.               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Predefined Themes

### Available Themes

| ID             | Name         | Description                      |
| -------------- | ------------ | -------------------------------- |
| `classic`      | Clásico      | Black, white, elegant grays      |
| `warm`         | Cálido       | Golden brown, elegant warmth     |
| `pastel-green` | Verde Pastel | Soft mint green, fresh           |
| `mocha`        | Mocha        | Dark, cozy (Catppuccin-inspired) |

### Theme Definition

```typescript
// types/theme.ts
export const THEMES = {
  classic: {
    id: "classic",
    name: "Clásico",
    description: "Blanco, negro y grises elegantes",
    colors: {
      background: "#ffffff",
      foreground: "#111111",
      primary: "#000000",
      secondary: "#2C2C2C",
      accent: "#4A4A4A",
    },
  },
  warm: {
    id: "warm",
    name: "Cálido",
    description: "Marrón dorado elegante",
    colors: {
      background: "#fffff0",
      foreground: "#2C1A0E",
      primary: "#8B5A3C",
      secondary: "#B89A7A",
      accent: "#D4AF37",
    },
  },
  // ...
};
```

---

## Color System

### The 5 Core Colors

Each theme defines exactly 5 colors:

| Color        | Purpose                       | CSS Variable   |
| ------------ | ----------------------------- | -------------- |
| `background` | Page background               | `--background` |
| `foreground` | Main text color               | `--foreground` |
| `primary`    | CTAs, links, active states    | `--primary`    |
| `secondary`  | Alternate section backgrounds | `--secondary`  |
| `accent`     | Decorative elements, dividers | `--accent`     |

### Auto-calculated Colors

For accessibility, these are calculated automatically:

- `--primary-foreground`: Text color on primary backgrounds (WCAG contrast)
- `--secondary-foreground`: Text color on secondary backgrounds

```typescript
// lib/theme-utils.ts
export function calculateContrastColor(background: string): string {
  const rgb = hexToRgb(background);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#111111" : "#ffffff";
}
```

---

## Custom Themes

### Enabling Custom Theme

When a user selects "Custom" in the theme picker:

1. `Event.activeTheme` is set to `"custom"`
2. `Event.customTheme` stores the JSON color values

```typescript
// Database
{
  activeTheme: "custom",
  customTheme: {
    background: "#1a1a2e",
    foreground: "#eaeaea",
    primary: "#e94560",
    secondary: "#16213e",
    accent: "#0f3460"
  }
}
```

### Default Custom Theme

When switching to custom for the first time:

```typescript
export const DEFAULT_CUSTOM_THEME_COLORS: CustomThemeColors = {
  background: "#ffffff",
  foreground: "#111111",
  primary: "#6366f1",
  secondary: "#a5b4fc",
  accent: "#818cf8",
};
```

---

## Applying Themes

### ThemeProvider Component

```typescript
// components/providers/ThemeProvider.tsx
"use client";

import { useEffect } from "react";

interface ThemeProviderProps {
  activeTheme: ThemeId;
  customTheme?: CustomThemeColors | null;
  children: React.ReactNode;
}

export function ThemeProvider({ activeTheme, customTheme, children }: ThemeProviderProps) {
  useEffect(() => {
    const colors = activeTheme === "custom"
      ? customTheme ?? DEFAULT_CUSTOM_THEME_COLORS
      : THEMES[activeTheme].colors;

    // Apply CSS variables to :root
    const root = document.documentElement;
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--accent", colors.accent);

    // Calculate contrast colors
    root.style.setProperty(
      "--primary-foreground",
      calculateContrastColor(colors.primary)
    );
    root.style.setProperty(
      "--secondary-foreground",
      calculateContrastColor(colors.secondary)
    );
  }, [activeTheme, customTheme]);

  return <>{children}</>;
}
```

### Using Theme Colors in Components

```typescript
// With Tailwind
<button className="bg-primary text-primary-foreground">
  Confirm
</button>

<section className="bg-secondary text-secondary-foreground">
  Content
</section>

<div className="text-accent">
  Decorative text
</div>
```

---

## Server Actions

### Update Theme

```typescript
// app/actions/theme.ts
export const updateEventTheme = withEventAuth(async (ctx, themeId: ThemeId) => {
  await prisma.event.update({
    where: { id: ctx.event.eventId },
    data: {
      activeTheme: themeId,
      // Clear custom theme if switching to predefined
      customTheme: themeId === "custom" ? undefined : null,
    },
  });

  revalidatePath("/backoffice/design");
  revalidatePath(`/r/[token]`); // Refresh invitation pages
}, PERMISSIONS.DESIGN_EDIT);
```

### Update Custom Colors

```typescript
export const updateCustomTheme = withEventAuth(
  async (ctx, colors: CustomThemeColors) => {
    // Validate colors
    const validated = CustomThemeSchema.parse(colors);

    await prisma.event.update({
      where: { id: ctx.event.eventId },
      data: {
        activeTheme: "custom",
        customTheme: validated,
      },
    });

    revalidatePath("/backoffice/design");
    revalidatePath(`/r/[token]`);
  },
  PERMISSIONS.DESIGN_EDIT,
);
```

---

## Theme Picker UI

### Backoffice Implementation

```typescript
// components/backoffice/ThemePicker.tsx
"use client";

export function ThemePicker({ currentTheme, customColors, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {THEME_LIST.map(theme => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          isSelected={currentTheme === theme.id}
          onSelect={() => onSelect(theme.id)}
        />
      ))}

      <CustomThemeCard
        isSelected={currentTheme === "custom"}
        colors={customColors}
        onSelect={() => onSelect("custom")}
        onCustomize={openColorPicker}
      />
    </div>
  );
}
```

### Color Preview

```typescript
function ThemeCard({ theme, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "p-4 rounded-lg border-2 transition-all",
        isSelected ? "border-primary" : "border-transparent"
      )}
    >
      <div className="flex gap-2 mb-2">
        {Object.entries(theme.colors).map(([name, color]) => (
          <div
            key={name}
            className="w-6 h-6 rounded-full border"
            style={{ backgroundColor: color }}
            title={name}
          />
        ))}
      </div>
      <p className="font-medium">{theme.name}</p>
      <p className="text-sm text-muted">{theme.description}</p>
    </button>
  );
}
```

---

## Best Practices

### 1. Always Use CSS Variables

```typescript
// ✅ Good - respects theme
<div className="bg-primary text-primary-foreground" />

// ❌ Bad - hardcoded colors
<div className="bg-blue-500 text-white" />
```

### 2. Never Use `var()` in className

```typescript
// ✅ Good - use style prop for dynamic values
<div style={{ backgroundColor: customColor }} />

// ❌ Bad - Tailwind can't process var() in className
<div className={`bg-[var(--custom-color)]`} />
```

### 3. Test with All Themes

Before shipping a component, verify it looks good with:

- Classic (light, high contrast)
- Mocha (dark theme)
- Custom with extreme colors

### 4. Respect Alternate Backgrounds

Some sections use `hasAlternateBg` to swap between `--background` and `--secondary`:

```typescript
function Section({ hasAlternateBg, children }) {
  return (
    <section className={cn(
      hasAlternateBg
        ? "bg-secondary text-secondary-foreground"
        : "bg-background text-foreground"
    )}>
      {children}
    </section>
  );
}
```

---

## Debugging Themes

### Check Applied Variables

```javascript
// In browser console
getComputedStyle(document.documentElement).getPropertyValue("--primary");
```

### Force Theme for Testing

```typescript
// In development
<ThemeProvider
  activeTheme="mocha"
  customTheme={null}
>
```

### Common Issues

| Problem                | Cause                | Fix                                      |
| ---------------------- | -------------------- | ---------------------------------------- |
| Colors not updating    | CSS cache            | Hard refresh (Cmd+Shift+R)               |
| White text on white bg | Missing foreground   | Check `--primary-foreground` calculation |
| Theme not persisting   | Server action failed | Check network tab for errors             |

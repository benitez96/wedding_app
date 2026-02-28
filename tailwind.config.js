import { heroui } from "@heroui/theme";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        decorative: ["var(--font-decorative)"],
      },
      animation: {
        "fade-in": "fadeIn 1s ease-in-out",
        "fade-in-delayed": "fadeIn 1s ease-in-out 0.5s both",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      colors: {
        accent: "var(--color-accent)",
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        // ═══════════════════════════════════════════════════════════════════
        // LIGHT THEMES
        // ═══════════════════════════════════════════════════════════════════

        // ── CLASSIC ────────────────────────────────────────────────────────
        classic: {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#000000",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#2C2C2C",
              foreground: "#FFFFFF",
            },
            background: "#FFFFFF",
            foreground: "#000000",
          },
        },

        // ── WARM ───────────────────────────────────────────────────────────
        warm: {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#8B5A3C",
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#B89A7A",
              foreground: "#3D2B1F",
            },
            background: "#FFFFF0",
            foreground: "#1A1A1A",
          },
        },

        // ── ROSÉ PINE DAWN ─────────────────────────────────────────────────
        "rose-pine-dawn": {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#d7827e", // Rose
              foreground: "#faf4ed",
            },
            secondary: {
              DEFAULT: "#f2e9e1", // Surface
              foreground: "#575279",
            },
            background: "#faf4ed", // Base
            foreground: "#575279", // Text
          },
        },

        // ── SAGE ───────────────────────────────────────────────────────────
        sage: {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#6b8e6b",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#e8f0e8",
              foreground: "#2d3a2d",
            },
            background: "#f8faf8",
            foreground: "#2d3a2d",
          },
        },

        // ═══════════════════════════════════════════════════════════════════
        // DARK THEMES
        // ═══════════════════════════════════════════════════════════════════

        // ── MOCHA (Catppuccin) ─────────────────────────────────────────────
        mocha: {
          extend: "dark",
          colors: {
            primary: {
              DEFAULT: "#cba6f7", // Mauve
              foreground: "#1e1e2e",
            },
            secondary: {
              DEFAULT: "#313244", // Surface0
              foreground: "#cdd6f4",
            },
            background: "#1e1e2e", // Base
            foreground: "#cdd6f4", // Text
          },
        },

        // ── MIDNIGHT GOLD ──────────────────────────────────────────────────
        "midnight-gold": {
          extend: "dark",
          colors: {
            primary: {
              DEFAULT: "#d4af37", // Gold
              foreground: "#0a0a0f",
            },
            secondary: {
              DEFAULT: "#1a1a24",
              foreground: "#e8e6e3",
            },
            background: "#0a0a0f",
            foreground: "#e8e6e3",
          },
        },
      },
    }),
  ],
};

export default config;

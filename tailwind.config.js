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
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        warm: {
          DEFAULT: "var(--color-warm)",
          foreground: "var(--color-warm-foreground)",
        },
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};

export default config;

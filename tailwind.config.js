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
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        classic: {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#000000",
              foreground: "#FFFFFF",
              50: "#f7f7f7",
              100: "#e3e3e3",
              200: "#c8c8c8",
              300: "#a4a4a4",
              400: "#818181",
              500: "#666666",
              600: "#515151",
              700: "#434343",
              800: "#383838",
              900: "#000000",
            },
            secondary: {
              DEFAULT: "#2C2C2C",
              foreground: "#FFFFFF",
            },
            background: "#FFFFFF",
            foreground: "#000000",
          },
        },
        warm: {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#8B5A3C",
              foreground: "#FFFFFF",
              50: "#faf6f3",
              100: "#f4ede6",
              200: "#e8d4c4",
              300: "#d9b599",
              400: "#c88f6d",
              500: "#b8744f",
              600: "#8B5A3C",
              700: "#6f4830",
              800: "#5d3d2a",
              900: "#4e3425",
            },
            secondary: {
              DEFAULT: "#B89A7A",
              foreground: "#FFFFFF",
            },
            background: "#FFFFFF",
            foreground: "#1A1A1A",
          },
        },
        "pastel-green": {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#7FB069",
              foreground: "#FFFFFF",
              50: "#f4f9f2",
              100: "#e6f2e1",
              200: "#d4e8cc",
              300: "#b0d6a1",
              400: "#9dc389",
              500: "#7FB069",
              600: "#5d8c4d",
              700: "#4a703e",
              800: "#3e5a34",
              900: "#354b2d",
            },
            secondary: {
              DEFAULT: "#A8DADC",
              foreground: "#1D3557",
            },
            background: "#F1FAEE",
            foreground: "#1D3557",
          },
        },
      },
    }),
  ],
};

export default config;

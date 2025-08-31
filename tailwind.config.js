import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        decorative: ["var(--font-decorative)"],
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'fade-in-delayed': 'fadeIn 1s ease-in-out 0.5s both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      colors: {
        primary: {
          DEFAULT: "#8B5A3C", // Marrón dorado elegante
          50: "#FDF8F3",
          100: "#F9EDE1",
          200: "#F3D7C3",
          300: "#E9B995",
          400: "#D99A6B",
          500: "#8B5A3C", // Color principal
          600: "#7A4F35",
          700: "#66422D",
          800: "#523524",
          900: "#3D281B",
        },
        secondary: "#b89a7a",
        secondaryForeground: "#ffffff",
        accent: {
          DEFAULT: "#D4AF37", // Dorado elegante
          50: "#FEFCF5",
          100: "#FDF7E6",
          200: "#FAEBB8",
          300: "#F6D98A",
          400: "#F2C75C",
          500: "#D4AF37", // Dorado principal
          600: "#B8942E",
          700: "#9A7A25",
          800: "#7C601C",
          900: "#5E4613",
        },
        warm: {
          DEFAULT: "#E8B4A0", // Rosa cálido
          50: "#FDF8F6",
          100: "#FAF0ED",
          200: "#F4DCD4",
          300: "#EEC8BB",
          400: "#E8B4A0",
          500: "#E8B4A0",
          600: "#D19A86",
          700: "#BA806C",
          800: "#A36652",
          900: "#8C4C38",
        }
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

export default config;
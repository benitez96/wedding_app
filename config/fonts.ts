import { Oooh_Baby, Montserrat } from "next/font/google";

export const fontDecorative = Oooh_Baby({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-decorative",
  display: "swap",
  preload: true,
});

export const fontSans = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const fontMono = Montserrat({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
  display: "swap",
});

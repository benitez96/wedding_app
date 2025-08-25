import { Oooh_Baby, Montserrat } from "next/font/google";

export const fontDecorative = Oooh_Baby({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-decorative",
});

export const fontSans = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const fontMono = Montserrat({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

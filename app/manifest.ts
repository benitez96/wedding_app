import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wedding App - Backoffice",
    short_name: "Wedding BO",
    description: "Sistema de gestión de eventos y check-in con QR",
    start_url: "/backoffice",
    scope: "/backoffice",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}

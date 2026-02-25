import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Invify - Backoffice",
    short_name: "Invify BO",
    description: "Sistema de gestión de invitaciones y eventos digitales",
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

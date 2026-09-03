import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Badd Boys",
    short_name: "Badd Boys",
    description: "Badmintonkvöldin, leikirnir og tölfræðin.",
    lang: "is",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0f1e",
    theme_color: "#0a0f1e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

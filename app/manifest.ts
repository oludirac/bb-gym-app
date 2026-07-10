import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BB Gym Tracker",
    short_name: "BB Gym",
    description: "Mobile-first workout logging, programs, goals, and progress.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0b0b0a",
    theme_color: "#0b0b0a",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}

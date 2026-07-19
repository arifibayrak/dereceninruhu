import type { MetadataRoute } from "next";

import { DEFAULT_DESCRIPTION } from "@/lib/seo";

/** PWA/GEO web manifest — ikonlar dosya-kurallarından (icon.svg, apple-icon). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Derecenin Ruhu — Mentorluk",
    short_name: "Derecenin Ruhu",
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    lang: "tr-TR",
    dir: "ltr",
    background_color: "#110f1f",
    theme_color: "#5b33c5",
    categories: ["education"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}

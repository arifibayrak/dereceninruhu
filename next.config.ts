import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Home-dizinindeki package-lock.json'ın workspace-root sanılmasını engelle
  // (aksi halde Turbopack yanlış kökü izleyip sürekli yeniden derliyor).
  turbopack: { root: import.meta.dirname },
  images: {
    // Marketing/blog may reference remote covers; keep tight and explicit.
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  experimental: {
    // Ses transkript hattı: ~45 sn'lik WAV parçaları (base64) Server Action ile
    // yüklenir; varsayılan 1MB sınırı yetmez.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;

// Enables getCloudflareContext() (D1/R2/env bindings) during `next dev` only.
// Guarded so `next build` doesn't start the Miniflare binding proxy.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

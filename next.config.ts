import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  images: {
    // Marketing/blog may reference remote covers; keep tight and explicit.
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;

// Enables getCloudflareContext() (D1/R2/env bindings) during `next dev` only.
// Guarded so `next build` doesn't start the Miniflare binding proxy.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

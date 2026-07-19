import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt — arama motorlarını ve YAPAY ZEKÂ tarama botlarını açıkça
 * karşılar (GEO: ChatGPT/Claude/Gemini/Perplexity içerik ve profili
 * çekebilsin). Özel uygulama rotalarını dışarıda bırakır.
 *
 * ⚠️ Cloudflare zone düzeyinde "yönetilen robots.txt / Content Signals"
 * özelliği /robots.txt'i EDGE'te ele geçirir (canlıda text/html dönüyor).
 * Bu dosya (text/plain) yalnızca o özellik panelden kapatıldığında/uyumlu
 * hale getirildiğinde sunulur. Bkz. DEPLOY notları.
 */

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
];

const PRIVATE_PATHS = [
  "/koc",
  "/ogrenci",
  "/api",
  "/giris",
  "/kurulum",
  "/davet",
  "/marka",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      // Arama + YZ botlarını açıkça karşıla: pozitif sinyal + "*" ileride
      // daraltılırsa güvence.
      {
        userAgent: ["Googlebot", "Bingbot", ...AI_CRAWLERS],
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

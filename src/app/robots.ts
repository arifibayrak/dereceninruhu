import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo";

/**
 * robots.txt — arama motorlarını ve YAPAY ZEKÂ tarama botlarını açıkça
 * karşılar (GEO: ChatGPT/Claude/Gemini/Perplexity içerik ve profili
 * çekebilsin). Özel uygulama rotalarını dışarıda bırakır.
 *
 * Not: Cloudflare zone düzeyindeki "yönetilen robots.txt / Content Signals"
 * özelliği bir dönem /robots.txt'i edge'te ele geçirip text/html döndürüyordu.
 * 2026-08-24 itibarıyla ÇÖZÜLDÜ — canlıda bu dosya text/plain olarak
 * sunuluyor. Şüphelenirsen tek komutla bak:
 *   curl -sSI https://dereceninruhu.com/robots.txt | grep -i content-type
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

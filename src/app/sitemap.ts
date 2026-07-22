import type { MetadataRoute } from "next";

import { listOtherPublicCoaches, getPublishedPosts } from "@/db/queries/cms";
import { coachContent } from "@/db/seed/cms-content";
import { absoluteUrl } from "@/lib/seo";

/**
 * XML sitemap. D1'den blog + koç slug'larını okur; D1 `next build` sırasında
 * BAĞLI DEĞİLDİR, bu yüzden build'de prerender edilmemeli — istek başına
 * üretilir (her D1 pazarlama sayfasıyla aynı desen).
 */
export const dynamic = "force-dynamic";

type Freq = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: { path: string; changeFrequency: Freq; priority: number }[] =
  [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/yks-koclugu", changeFrequency: "weekly", priority: 0.9 },
    { path: "/lgs-koclugu", changeFrequency: "weekly", priority: 0.9 },
    { path: "/kpss-koclugu", changeFrequency: "weekly", priority: 0.9 },
    { path: "/fiyatlar", changeFrequency: "weekly", priority: 0.9 },
    { path: "/koclar", changeFrequency: "monthly", priority: 0.8 },
    { path: "/hakkinda", changeFrequency: "monthly", priority: 0.8 },
    { path: "/nasil-calisir", changeFrequency: "monthly", priority: 0.8 },
    { path: "/iletisim", changeFrequency: "yearly", priority: 0.7 },
    { path: "/kaynaklar", changeFrequency: "weekly", priority: 0.7 },
    { path: "/araclar/net-hesaplama", changeFrequency: "monthly", priority: 0.7 },
    { path: "/sss", changeFrequency: "monthly", priority: 0.6 },
    { path: "/basarilar", changeFrequency: "weekly", priority: 0.6 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.6 },
    { path: "/sayac", changeFrequency: "monthly", priority: 0.4 },
    { path: "/bekleme-listesi", changeFrequency: "monthly", priority: 0.3 },
    { path: "/koc-basvuru", changeFrequency: "yearly", priority: 0.3 },
  ];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Dinamik slug'lar. Soğuk/boş D1 sitemap'i 500'lemesin diye try/catch.
  try {
    const posts = await getPublishedPosts();
    for (const post of posts) {
      entries.push({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.publishedAt ?? now,
        changeFrequency: "yearly",
        priority: 0.7,
      });
    }

    const others = await listOtherPublicCoaches();
    // Öne çıkan koç `getPublicCoach()` ile slug:null döner; canonical slug'ı
    // sabitten ekle.
    const slugs = new Set<string>([
      coachContent.slug,
      ...others.map((c) => c.slug),
    ]);
    for (const slug of slugs) {
      entries.push({
        url: absoluteUrl(`/koclar/${slug}`),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // D1 erişilemezse yalnız statik rotalarla dön.
  }

  return entries;
}

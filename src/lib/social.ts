import type { SocialUrls } from "@/components/brand/social-icons";
import { getSiteSettings } from "@/db/queries/cms";
import { SOCIAL_LINKS } from "@/lib/seo";

// ⚠️ Bu modül `@/db` import ediyor → SUNUCU-ONLY. Client bileşenleri buradan
// hiçbir şey almamalı; `SOCIAL_FALLBACK` bu yüzden `@/lib/seo` içinde durur.

/**
 * Sosyal bağlantıların çözümü — DB (yöneticinin `/koc/site` panelinden
 * düzenlediği `site_settings`) öncelikli, boşsa `@/lib/seo` sabitine düşer.
 *
 * Kendi modülünde duruyor çünkü `(pazarlama)/layout.tsx` bunu artık AWAIT
 * ETMİYOR: layout gövdesinde beklenen her `await`, React'in `children`'a
 * (yani sayfanın 5 paralel D1 sorgusuna) geçmesini engelliyordu — kabuk
 * sorgusu + sayfa sorguları iki SERİ dalgaya bölünüyordu. Şimdi promise
 * `<Suspense>` sınırlarına geçiriliyor, iki dalga tek dalgaya iniyor.
 */
export async function getSocialUrls(): Promise<SocialUrls> {
  const site = await getSiteSettings();
  return {
    instagram: site.instagramUrl || SOCIAL_LINKS.instagram,
    tiktok: site.tiktokUrl || SOCIAL_LINKS.tiktok,
    youtube: site.youtubeUrl || SOCIAL_LINKS.youtube,
  };
}

import type { Metadata } from "next";

/**
 * Merkezi SEO/GEO sabitleri ve yardımcıları.
 *
 * İstemci-güvenli: burada `@/db` veya server-only modül import EDİLMEZ; hem
 * Server hem Client bileşenlerden, sitemap/robots route handler'larından ve
 * JSON-LD katmanından güvenle kullanılır.
 *
 * `SITE_URL` sabit prod alan adına gömülüdür — `BETTER_AUTH_URL` yalnız
 * sunucuda (`getCloudflareContext().env`) okunabildiği için modül düzeyinde
 * kullanılamaz. Prod alan adı sabit olduğundan gömmek deterministiktir.
 */

export const SITE_URL = "https://dereceninruhu.com";
export const SITE_NAME = "Derecenin Ruhu";
export const SITE_LOCALE = "tr_TR";
export const DEFAULT_DESCRIPTION =
  "LGS, YKS ve KPSS için birebir online sınav koçluğu: haftalık program, soru takibi ve deneme analiziyle netlerini artır, hedefine ulaş.";

/**
 * Marka + koç için `sameAs` bağlantıları — arama motorları ve LLM'ler markayı
 * ve koçu tek bir varlık (entity) olarak çözebilsin diye JSON-LD'de kullanılır.
 *
 * TODO(Arif): Instagram / YouTube / TikTok profillerinin GERÇEK URL'lerini gir.
 * Boş bırakılan alanlar `sameAsLinks()` tarafından otomatik elenir, bu yüzden
 * doldurulana kadar şema geçerli kalır.
 */
export const SOCIAL_LINKS = {
  gigbi: "https://www.gigbi.com/p/ahmet-hakan-almak1723581674",
  instagram: "https://www.instagram.com/derecenin_ruhu/",
  youtube: "https://www.youtube.com/@Dereceninruhu",
  tiktok: "https://www.tiktok.com/@dereceninruhu",
} as const;

/** Boş olmayan sosyal/kanıt bağlantılarını `sameAs` dizisi olarak döndürür. */
export function sameAsLinks(extra: string[] = []): string[] {
  return [...Object.values(SOCIAL_LINKS), ...extra]
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Göreli bir yolu mutlak (canonical/OG için) URL'ye çevirir. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Varsayılan OG/Twitter kapak görseli (public/og.png, 1200×630).
 * Dosya-kuralı yerine AÇIK referans: her sayfa kendi `openGraph`'ını verdiği
 * için dosya-kuralı görseli düşüyordu — bu yüzden metadata'da açıkça set edilir.
 */
export const OG_IMAGE = {
  url: absoluteUrl("/og.png"),
  width: 1200,
  height: 630,
  alt: "Derecenin Ruhu — LGS, YKS ve KPSS birebir online sınav koçluğu",
} as const;

type BuildMetadataInput = {
  /** "%s | Derecenin Ruhu" şablonundan geçen sayfa başlığı. */
  title?: string;
  /** Şablonu atla (ana sayfa bunu kullanır). */
  titleAbsolute?: string;
  description?: string;
  /** Canonical yol, örn. "/fiyatlar" veya "/blog/deneme-analizi". */
  path: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  /** Segment için özel OG görseli (yoksa kök opengraph-image kullanılır). */
  images?: string[];
  noIndex?: boolean;
};

/**
 * Sayfalar arası tutarlı `openGraph` / `twitter` / `alternates.canonical`
 * üretir. Görsel verilmezse kökteki `opengraph-image` dosya-kuralı
 * (metadataBase üzerinden) her rota için varsayılan görseli sağlar.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const description = input.description ?? DEFAULT_DESCRIPTION;
  const url = input.path; // göreli — kök layout'taki metadataBase çözer
  const ogTitle = input.titleAbsolute ?? input.title ?? SITE_NAME;
  const ogType = input.type === "profile" ? "profile" : input.type ?? "website";
  const images = input.images ?? [OG_IMAGE];

  return {
    title: input.titleAbsolute
      ? { absolute: input.titleAbsolute }
      : input.title,
    description,
    alternates: { canonical: url },
    ...(input.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: ogType,
      url,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      title: ogTitle,
      description,
      images,
      ...(input.type === "article" && input.publishedTime
        ? {
            publishedTime: input.publishedTime,
            ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images,
    },
  };
}

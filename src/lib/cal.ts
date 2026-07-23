/**
 * Cal.com randevu linki yardımcıları.
 *
 * Koçun kaydettiği tam URL'den (ör. `https://cal.com/ahmet/haftalik`) inline
 * embed için gereken `calLink` slug'ını (`ahmet/haftalik`) çıkarır. cal.com dışı
 * geçerli bir URL de saklanabilir; bu durumda gömülü takvim yerine yalnız
 * yeni-sekme bağlantısı gösterilir (embed yalnız cal.com/app.cal.com için çalışır).
 */

export type ParsedCalLink = {
  /** Inline embed için slug (ör. "ahmet/haftalik"); cal.com dışıysa null. */
  calLink: string | null;
  /** Normalleştirilmiş tam URL — yeni sekmede açılan yedek bağlantı. */
  url: string;
};

const CAL_HOSTS = new Set(["cal.com", "www.cal.com", "app.cal.com"]);

/**
 * Ham girdiyi ayrıştırır. Geçersiz/boş URL → null. Geçerli cal.com URL →
 * `{ calLink, url }`; başka geçerli http(s) URL → `{ calLink: null, url }`.
 */
export function parseCalLink(
  raw: string | null | undefined,
): ParsedCalLink | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase();
  if (CAL_HOSTS.has(host)) {
    // /ahmet/haftalik → "ahmet/haftalik" (baş/son eğik çizgi temizlenir).
    const slug = parsed.pathname.replace(/^\/+|\/+$/g, "");
    return { calLink: slug.length > 0 ? slug : null, url: parsed.toString() };
  }
  return { calLink: null, url: parsed.toString() };
}

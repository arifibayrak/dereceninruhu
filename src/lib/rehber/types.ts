/**
 * Rehber (uygulama içi kullanım kılavuzu) veri tipleri.
 *
 * İçerik bilinçli olarak **saf veri** — JSX değil. Böylece aynı kaynak hem
 * sunucuda HTML'e basılabiliyor hem de `search.ts` içinde düz metne indirgenip
 * istemciye hafif bir arama indeksi olarak gönderilebiliyor.
 */

/** Bir bölümün gövdesini oluşturan içerik blokları. */
export type Block =
  /** Düz paragraf. */
  | { kind: "para"; text: string }
  /** Numaralı adım listesi. */
  | { kind: "steps"; title?: string; items: string[] }
  /**
   * Buton referansı — rehberin çekirdeği. Her satır uygulamadaki gerçek bir
   * kontrolü anlatır: etiketi, nerede durduğu, bastığında ne olduğu.
   */
  | {
      kind: "buttons";
      title?: string;
      rows: { label: string; where: string; does: string }[];
    }
  /** Serbest tablo (ör. rozet anlamları, durum akışı). */
  | { kind: "table"; title?: string; head: string[]; rows: string[][] }
  /** Vurgu kutuları. */
  | { kind: "tip" | "warning" | "note"; text: string }
  /** Bölüm sonu sık sorulanlar — native <details> ile açılır. */
  | { kind: "faq"; items: { q: string; a: string }[] }
  /** Uygulama içi ya da dış bağlantı. */
  | { kind: "link"; href: string; label: string; external?: boolean };

export type Section = {
  /** Kalıcı çapa: `#bolum-<id>`. Değiştirme — derin bağlantılar kırılır. */
  id: string;
  /** Görüntülenen sıra numarası (01, 02, …). */
  no: number;
  /** Üst grup başlığı — TOC bunlara göre kümelenir. */
  chapter: string;
  title: string;
  /** 1–2 cümlelik özet; TOC önizlemesinde ve aramada kullanılır. */
  lead: string;
  /** Anlatılan ekranın rotası — "Ekrana git" düğmesini üretir. */
  where?: string;
  /** Aramayı güçlendiren ek terimler (ör. "D/Y/B", "net", "kuruş"). */
  keywords?: string[];
  blocks: Block[];
};

/** Bir rehberin tamamı. */
export type Guide = {
  /** Rehberin kendi rotası — çapa bağlantıları buna göre kurulur. */
  basePath: string;
  title: string;
  description: string;
  sections: Section[];
};

/** İstemciye giden hafif indeks — gövde metni içermez. */
export type SectionIndexEntry = {
  id: string;
  no: number;
  chapter: string;
  title: string;
  lead: string;
  /** Aranabilir düz metin (küçük harfe indirgenmiş). */
  haystack: string;
};

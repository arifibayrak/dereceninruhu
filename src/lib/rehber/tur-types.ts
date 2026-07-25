/**
 * Tur (ürün turu) veri tipleri.
 *
 * Rehber "ekranı ara, oku"; akış "sıra nasıl işler"; tur ise **sunum**:
 * paneli ekran ekran, gezinme sırasıyla baştan sona gezdirir. Bir SaaS
 * ürün turu gibi tek seferde izlenir — her adım bir ekran.
 */

export type TourStep = {
  id: string;
  /** Gezinmedeki adı, ör. "Öğrenciler" — adım başlığının üstünde rozet olur. */
  nav: string;
  /** Adımın manşeti. */
  title: string;
  /** Ekranın rotası — "Ekranı aç" düğmesini üretir. */
  route?: string;
  /** Bu ekran ne işe yarar (1-2 cümle). */
  purpose: string;
  /** Ekrandaki önemli alanlar — turun asıl içeriği. */
  highlights: { label: string; text: string }[];
  /** Ekranda en sık kullanılan butonlar. */
  buttons?: { label: string; does: string }[];
  /** Kısa vurgu — bilinmezse zaman kaybettiren şey. */
  tip?: string;
  /** İlgili rehber bölümü (`#bolum-<id>`). */
  section?: string;
  /** Yalnız yöneticiye görünen adım. */
  adminOnly?: boolean;
};

export type Tour = {
  id: string;
  title: string;
  subtitle: string;
  /** Rehberin kökü — "Rehberde oku" bağlantıları buna göre kurulur. */
  guideBase: string;
  steps: TourStep[];
};

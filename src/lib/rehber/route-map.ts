/**
 * Rota → rehber bölümü eşlemesi.
 *
 * Header'daki rehber düğmesi bulunduğun ekranın bölümüne doğrudan atlasın diye
 * var. Her sayfaya tek tek bağlantı gömmek yerine tek yerden yönetilir:
 * yeni bir ekran eklendiğinde buraya bir satır yazmak yeter.
 *
 * ⚠️ BU DOSYA `ogrenci.ts` / `koc.ts` / `yonetici.ts` DOSYALARINI **İMPORT ETMEZ**.
 * `<RehberLink/>` her /ogrenci/* ve /koc/* sayfasının paylaşılan yerleşim
 * parçasında yer alıyor; buradan içeriğe bir referans verilirse Turbopack
 * ~230 KB'lık rehber metnini tüm uygulama paketine sokar. Bölüm id'lerinin
 * gerçekten var olduğu `route-map.test.ts` ile doğrulanır.
 */

export type RehberGuide = "ogrenci" | "koc" | "yonetici";

const BASE_PATH: Record<RehberGuide, string> = {
  ogrenci: "/ogrenci/rehber",
  koc: "/koc/rehber",
  yonetici: "/koc/rehber/yonetici",
};

type Entry = { test: RegExp; guide: RehberGuide; section: string };

/**
 * Sıra önemli: en özgül desen en üstte. İlk eşleşen kazanır.
 * `$` ile biten desenler tam eşleşme, bitmeyenler önek eşleşmesidir.
 */
const ENTRIES: Entry[] = [
  // ——— Öğrenci ———
  { test: /^\/ogrenci$/, guide: "ogrenci", section: "bugun" },
  { test: /^\/ogrenci\/program/, guide: "ogrenci", section: "gorev-isaretleme" },
  { test: /^\/ogrenci\/soru-takibi/, guide: "ogrenci", section: "soru-takibi" },
  { test: /^\/ogrenci\/kronometre/, guide: "ogrenci", section: "kronometre" },
  {
    test: /^\/ogrenci\/denemeler\/[^/]+\/analiz/,
    guide: "ogrenci",
    section: "deneme-analizi",
  },
  {
    test: /^\/ogrenci\/denemeler\/yeni/,
    guide: "ogrenci",
    section: "deneme-ekleme",
  },
  { test: /^\/ogrenci\/denemeler/, guide: "ogrenci", section: "deneme-ekleme" },
  { test: /^\/ogrenci\/analiz/, guide: "ogrenci", section: "analiz-ekrani" },
  { test: /^\/ogrenci\/gelisim/, guide: "ogrenci", section: "gelisim" },
  {
    test: /^\/ogrenci\/kaynaklar/,
    guide: "ogrenci",
    section: "kaynak-yonetimi",
  },
  { test: /^\/ogrenci\/icerik/, guide: "ogrenci", section: "icerik" },
  { test: /^\/ogrenci\/gorusmeler/, guide: "ogrenci", section: "gorusmeler" },
  { test: /^\/ogrenci\/odemeler/, guide: "ogrenci", section: "odemeler" },
  { test: /^\/ogrenci\/asistan/, guide: "ogrenci", section: "asistan" },
  {
    test: /^\/ogrenci\/profil/,
    guide: "ogrenci",
    section: "profil-ve-hesap",
  },

  // ——— Koç · öğrenci kokpiti (özgül sekmeler önce) ———
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/soru-takibi/,
    guide: "koc",
    section: "soru-takibi",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/deneme\/[^/]+\/analiz/,
    guide: "koc",
    section: "deneme-analizi",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/denemeler/,
    guide: "koc",
    section: "denemeler",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/program/,
    guide: "koc",
    section: "program-olustur",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/gorusmeler/,
    guide: "koc",
    section: "gorusme-planlama",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/transkript\/[^/]+/,
    guide: "koc",
    section: "transkript-cikarim",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/transkript/,
    guide: "koc",
    section: "canli-transkript",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/(konular|kaynaklar)/,
    guide: "koc",
    section: "konular-kaynaklar",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/icerik/,
    guide: "koc",
    section: "icerik-kutuphanesi",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/muhasebe/,
    guide: "koc",
    section: "muhasebe",
  },
  {
    test: /^\/koc\/ogrenciler\/[^/]+\/profil/,
    guide: "koc",
    section: "kokpit",
  },
  { test: /^\/koc\/ogrenciler\/yeni/, guide: "koc", section: "yeni-ogrenci" },
  {
    test: /^\/koc\/ogrenciler\/[^/]+$/,
    guide: "koc",
    section: "genel-bakis",
  },
  { test: /^\/koc\/ogrenciler/, guide: "koc", section: "ogrenciler" },

  // ——— Koç · yönetici ekranları (koça kapalı; rehberde de yönetici tarafına gider) ———
  {
    test: /^\/koc\/muhasebe\/mutabakat/,
    guide: "yonetici",
    section: "mutabakat",
  },
  { test: /^\/koc\/basvurular/, guide: "yonetici", section: "basvurular" },
  { test: /^\/koc\/ice-aktar/, guide: "yonetici", section: "ice-aktarma" },
  { test: /^\/koc\/site/, guide: "yonetici", section: "donem" },
  { test: /^\/koc\/yonetim/, guide: "yonetici", section: "ekip-yonetimi" },

  // ——— Koç · üst gezinme ———
  {
    test: /^\/koc\/muhasebe\/odemeler/,
    guide: "koc",
    section: "odeme-bildirimleri",
  },
  { test: /^\/koc\/muhasebe/, guide: "koc", section: "muhasebe" },
  { test: /^\/koc\/denemeler/, guide: "koc", section: "deneme-panosu" },
  { test: /^\/koc\/duyuru/, guide: "koc", section: "duyuru" },
  { test: /^\/koc\/asistan/, guide: "koc", section: "asistan" },
  {
    test: /^\/koc\/gorusmeler/,
    guide: "koc",
    section: "gorusme-planlama",
  },
  {
    test: /^\/koc\/canli-transkript/,
    guide: "koc",
    section: "canli-transkript",
  },
  { test: /^\/koc\/(leadler|bekleme)/, guide: "koc", section: "leadler-bekleme" },
  { test: /^\/koc\/icerik/, guide: "koc", section: "icerik-kutuphanesi" },
  { test: /^\/koc\/blog/, guide: "koc", section: "blog" },
  { test: /^\/koc\/profil/, guide: "koc", section: "cal-takvimi" },
  { test: /^\/koc\/eklenti/, guide: "koc", section: "canli-transkript" },
  {
    test: /^\/koc\/ayarlar/,
    guide: "koc",
    section: "profil-ayarlar-eklenti",
  },
  { test: /^\/koc$/, guide: "koc", section: "panel" },
];

/**
 * Bulunulan rotaya karşılık gelen rehber bağlantısını çözer.
 * Rehberin kendi sayfalarında `null` döner (kendine bağlantı vermez).
 */
export function resolveRehberHref(pathname: string): string | null {
  // Rehber ve tur yüzeylerinde kendine bağlantı verme.
  if (pathname.startsWith("/ogrenci/rehber")) return null;
  if (pathname.startsWith("/koc/rehber")) return null;
  if (pathname.startsWith("/ogrenci/tur")) return null;
  if (pathname.startsWith("/koc/tur")) return null;

  const hit = ENTRIES.find((e) => e.test.test(pathname));
  if (hit) return `${BASE_PATH[hit.guide]}#bolum-${hit.section}`;

  // Eşleşme yoksa alanın rehber ana sayfasına düş.
  if (pathname.startsWith("/ogrenci")) return BASE_PATH.ogrenci;
  if (pathname.startsWith("/koc")) return BASE_PATH.koc;
  return null;
}

export { BASE_PATH as REHBER_BASE_PATH };

/** Yalnız testler için — çalışma zamanında kullanılmaz. */
export const __ENTRIES = ENTRIES;

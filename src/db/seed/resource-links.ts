/**
 * Ücretsiz kaynak merkezi tohumları — /kaynaklar sayfasının fallback'i.
 *
 * Saf veri modülü (server + client + seed script güvenle import eder).
 * D1'de satır varsa o kullanılır; yoksa buraya düşülür — tıpkı `cms-content`
 * deseni gibi, site seed çalıştırılmadan da eksiksiz görünür.
 *
 * KURAL: burada yalnız RESMÎ / kurumsal kaynaklara link verilir (MEB, ÖSYM,
 * YÖK). İçerik barındırmayız, kopyalamayız — dizin olmak telif açısından
 * güvenli ve bakımı ucuz.
 *
 * BAKIM: bağlantılar kurumların site yapısı değiştikçe kırılabilir. Yönetici
 * `/koc/site` → Kaynaklar sekmesinden düzeltir; kod deploy'u gerekmez.
 */

export const RESOURCE_CATEGORIES = [
  "cikmis-sorular",
  "ogm-mebi",
  "ders-notlari",
  "tercih-atlas",
  "arac",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export const CATEGORY_META: Record<
  ResourceCategory,
  { label: string; description: string }
> = {
  "cikmis-sorular": {
    label: "Çıkmış sorular",
    description:
      "ÖSYM ve MEB'in yayımladığı gerçek sınav soruları ve cevap anahtarları.",
  },
  "ogm-mebi": {
    label: "OGM Materyal & MEBİ",
    description:
      "MEB'in ücretsiz soru bankası, etkileşimli kitaplar ve online denemeleri.",
  },
  "ders-notlari": {
    label: "Ders notları ve konu anlatımı",
    description: "Konu özetleri, video anlatımlar ve çalışma kağıtları.",
  },
  "tercih-atlas": {
    label: "Tercih, atlas ve puan",
    description:
      "Bölüm taban puanları, kontenjanlar ve tercih dönemi resmî araçları.",
  },
  arac: {
    label: "Derecenin Ruhu araçları",
    description: "Kendi hazırladığımız ücretsiz hesaplama araçları.",
  },
};

export type ResourceLinkSeed = {
  category: ResourceCategory;
  title: string;
  description: string;
  url: string;
  examCode: "YKS" | "LGS" | "KPSS" | null;
  provider: string;
  sortOrder: number;
  isFeatured: boolean;
};

export const resourceLinkSeeds: ResourceLinkSeed[] = [
  /* ----------------------------- Çıkmış sorular ---------------------------- */
  {
    category: "cikmis-sorular",
    title: "ÖSYM Çıkmış Sorular Arşivi",
    description:
      "YKS, KPSS ve diğer sınavların geçmiş yıl soru kitapçıkları ile cevap anahtarları — doğrudan ÖSYM kaynağından.",
    url: "https://www.osym.gov.tr/TR,8797/cikmis-sorular.html",
    examCode: null,
    provider: "ÖSYM",
    sortOrder: 0,
    isFeatured: true,
  },
  {
    category: "cikmis-sorular",
    title: "YKS Çıkmış Sorular — Son 8 Yıl (TYT/AYT/YDT)",
    description:
      "TYT, AYT (SAY/EA/SÖZ) ve YDT için yıllara göre ayrılmış çıkmış soru kitapları; konularına göre gruplanmış ve video çözümlü.",
    url: "https://ogmmateryal.eba.gov.tr/panel/etkilesimli-kitap",
    examCode: "YKS",
    provider: "OGM Materyal",
    sortOrder: 1,
    isFeatured: true,
  },
  {
    category: "cikmis-sorular",
    title: "LGS Örnek Sorular ve Geçmiş Sınavlar",
    description:
      "MEB Ölçme ve Değerlendirme Genel Müdürlüğü'nün yayımladığı LGS örnek soruları ve geçmiş yıl sınavları.",
    url: "https://odsgm.meb.gov.tr/www/ornek-sorular/kategori/23",
    examCode: "LGS",
    provider: "MEB ÖDSGM",
    sortOrder: 2,
    isFeatured: false,
  },

  /* ------------------------------ OGM & MEBİ ------------------------------- */
  {
    category: "ogm-mebi",
    title: "OGM Materyal",
    description:
      "MEB Ortaöğretim Genel Müdürlüğü'nün ücretsiz platformu: soru bankası, etkileşimli kitaplar, ders anlatımları ve online denemeler.",
    url: "https://ogmmateryal.eba.gov.tr/",
    examCode: null,
    provider: "MEB OGM",
    sortOrder: 0,
    isFeatured: true,
  },
  {
    category: "ogm-mebi",
    title: "MEBİ — MEB Bilişim Sistemi",
    description:
      "Ders ders konu anlatım videoları, soru çözümleri ve ücretsiz deneme sınavları.",
    url: "https://mebi.meb.gov.tr/",
    examCode: null,
    provider: "MEB",
    sortOrder: 1,
    isFeatured: true,
  },
  {
    category: "ogm-mebi",
    title: "OGM Materyal Online Deneme Sınavları",
    description:
      "TYT ve AYT formatında, güncel müfredata uygun ücretsiz online denemeler; bitince net ve analiz raporu verir.",
    url: "https://ogmmateryal.eba.gov.tr/panel/test",
    examCode: "YKS",
    provider: "OGM Materyal",
    sortOrder: 2,
    isFeatured: false,
  },

  /* ----------------------------- Ders notları ------------------------------ */
  {
    category: "ders-notlari",
    title: "OGM Materyal Ders Anlatım Videoları",
    description:
      "Konu konu ders anlatımları — MEB öğretmenleri tarafından hazırlanmış, tamamen ücretsiz.",
    url: "https://ogmmateryal.eba.gov.tr/panel/video",
    examCode: null,
    provider: "MEB OGM",
    sortOrder: 0,
    isFeatured: false,
  },
  {
    category: "ders-notlari",
    title: "EBA — Ders İçerikleri",
    description:
      "Sınıf ve ders bazında konu anlatımı, alıştırma ve çalışma kağıtları.",
    url: "https://www.eba.gov.tr/",
    examCode: null,
    provider: "MEB EBA",
    sortOrder: 1,
    isFeatured: false,
  },

  /* --------------------------- Tercih & atlas ------------------------------ */
  {
    category: "tercih-atlas",
    title: "YÖK Atlas",
    description:
      "Üniversite ve bölüm bazında taban puanlar, başarı sıralamaları, kontenjanlar ve yerleşen profili. Tercih döneminin en güvenilir kaynağı.",
    url: "https://yokatlas.yok.gov.tr/",
    examCode: "YKS",
    provider: "YÖK",
    sortOrder: 0,
    isFeatured: true,
  },
  {
    category: "tercih-atlas",
    title: "ÖSYM Tercih Robotu ve Kılavuzlar",
    description:
      "Resmî tercih kılavuzları, kontenjan tabloları ve tercih işlemleri.",
    url: "https://www.osym.gov.tr/",
    examCode: null,
    provider: "ÖSYM",
    sortOrder: 1,
    isFeatured: false,
  },
  {
    category: "tercih-atlas",
    title: "YÖK Lisans Atlası — Bölüm Rehberleri",
    description:
      "Hangi bölüm ne iş yapar, mezunlar nerede çalışıyor, doluluk oranları nedir?",
    url: "https://yokatlas.yok.gov.tr/lisans-bolum.php",
    examCode: "YKS",
    provider: "YÖK",
    sortOrder: 2,
    isFeatured: false,
  },

  /* ------------------------------- Araçlar --------------------------------- */
  {
    category: "arac",
    title: "Net Hesaplama",
    description:
      "Doğru ve yanlış sayılarını gir, ders ders ve toplam netini anında gör. LGS, YKS ve KPSS için resmî yanlış katsayılarıyla hesaplar.",
    url: "/araclar/net-hesaplama",
    examCode: null,
    provider: "Derecenin Ruhu",
    sortOrder: 0,
    isFeatured: true,
  },
  {
    category: "arac",
    title: "Sınav Geri Sayımı",
    description: "LGS, YKS ve KPSS'ye kaç gün kaldığını gün gün takip et.",
    url: "/sayac",
    examCode: null,
    provider: "Derecenin Ruhu",
    sortOrder: 1,
    isFeatured: false,
  },
];

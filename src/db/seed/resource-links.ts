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
    title: "YKS Çıkmış Soru Kitapları (TYT/AYT/YDT)",
    description:
      "Yıllara göre ayrılmış çıkmış soru kitapları — TYT, AYT (SAY/EA/SÖZ) ve YDT; PDF olarak indirilebilir, çözümlü. MEB OGM Materyal'den ücretsiz.",
    url: "https://ogmmateryal.eba.gov.tr/yks-cikmis-soru-kitaplari",
    examCode: "YKS",
    provider: "OGM Materyal",
    sortOrder: 0,
    isFeatured: true,
  },
  {
    category: "cikmis-sorular",
    title: "ÖSYM Çıkmış Sınav Soruları (KPSS/DGS/ALES)",
    description:
      "KPSS, DGS, ALES ve diğer ÖSYM sınavlarının Temel Soru Kitapçıkları ve cevap anahtarlarına ÖSYM duyurularından ulaş.",
    url: "https://www.osym.gov.tr/",
    examCode: null,
    provider: "ÖSYM",
    sortOrder: 1,
    isFeatured: true,
  },
  {
    category: "cikmis-sorular",
    title: "LGS Örnek Soru Kitapçıkları",
    description:
      "MEB Ölçme, Değerlendirme ve Sınav Hizmetleri Genel Müdürlüğü'nün yayımladığı LGS merkezî sınav örnek soru kitapçıkları.",
    url: "https://odsgm.meb.gov.tr/www/ornek-soru-kitapciklari/kategori/151",
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
    title: "MEBİ YKS Denemeleri",
    description:
      "MEB'in ücretsiz YKS deneme sınavları — TYT, AYT (SAY/EA/SÖZ) ve YDT; çözümleriyle birlikte. Eski MEBİ platformu OGM Materyal'e taşındı.",
    url: "https://ogmmateryal.eba.gov.tr/mebi-yks-denemeleri",
    examCode: "YKS",
    provider: "MEB OGM Materyal",
    sortOrder: 1,
    isFeatured: true,
  },
  {
    category: "ogm-mebi",
    title: "OGM Materyal Soru Bankası",
    description:
      "Ders ve konu bazında binlerce çözümlü soru; istersen kendi testini oluştur. Güncel müfredata uygun, ücretsiz.",
    url: "https://ogmmateryal.eba.gov.tr/soru-bankasi",
    examCode: null,
    provider: "OGM Materyal",
    sortOrder: 2,
    isFeatured: false,
  },

  /* ----------------------------- Ders notları ------------------------------ */
  {
    category: "ders-notlari",
    title: "OGM Materyal YKS Konu Anlatımları",
    description:
      "TYT ve AYT için konu konu video anlatımlar — MEB öğretmenleri tarafından hazırlanmış, tamamen ücretsiz.",
    url: "https://ogmmateryal.eba.gov.tr/yks-konu-anlatim",
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
    title: "ÖSYM Tercih Kılavuzları ve İşlemleri",
    description:
      "Resmî tercih kılavuzları, kontenjan tabloları ve tercih işlemleri — ÖSYM ana sayfasındaki güncel duyurulardan.",
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

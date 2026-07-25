/**
 * Tur için örnek öğrenci.
 *
 * Kokpit adımları gerçek bir kayıt ister; tur hangi öğrenciyi açacağını
 * seçemez ve gerçek bir öğrencinin verisini tanıtım amacıyla gezdirmek de
 * doğru olmaz. Bu yüzden kokpit, tamamen kurgusal tek bir kayıt üstünde
 * gösteriliyor. Veritabanına dokunmaz — hepsi bu dosyadaki sabitler.
 */

export const ORNEK_BASE = "/koc/tur/ornek";

export const ornekOgrenci = {
  fullName: "Zeynep Kaya",
  examCode: "YKS",
  trackName: "Sayısal",
  target: "İTÜ Bilgisayar Mühendisliği",
  grade: "12. sınıf",
  school: "Kadıköy Anadolu Lisesi",
  city: "İstanbul",
  coachName: "Sen",
  startedAt: "12 Eyl 2025",
};

export const ornekOzet = {
  totalQuestions: 14_820,
  weekQuestions: 612,
  studyMinutes: 1_140,
  lastNet: 78.25,
  netDelta: 3.5,
  streak: 12,
};

/** Genel Bakış — son denemelerin net seyri. */
export const ornekNetSerisi: { label: string; net: number }[] = [
  { label: "3 May", net: 61.5 },
  { label: "10 May", net: 64.25 },
  { label: "17 May", net: 63.0 },
  { label: "24 May", net: 69.75 },
  { label: "31 May", net: 72.5 },
  { label: "7 Haz", net: 74.75 },
  { label: "14 Haz", net: 78.25 },
];

export const ornekIcgoruler = [
  "Matematik neti 6 haftada +9,5 arttı — ivme burada.",
  "Paragrafta doğruluk %68; hacim yeterli ama isabet düşük.",
  "Son 3 denemede Geometri boş sayısı artıyor.",
  "Bu hafta çalışma süresi geçen haftanın %20 üstünde.",
];

/** Soru Takibi — hafta × ders ızgarası (Pzt→Paz). */
export const ornekSoruIzgarasi: {
  ders: string;
  gunler: number[];
  dogru: number;
  yanlis: number;
}[] = [
  {
    ders: "Matematik",
    gunler: [120, 90, 140, 0, 110, 160, 60],
    dogru: 545,
    yanlis: 132,
  },
  {
    ders: "Geometri",
    gunler: [40, 0, 35, 50, 0, 45, 20],
    dogru: 142,
    yanlis: 48,
  },
  {
    ders: "Fizik",
    gunler: [60, 45, 0, 55, 40, 70, 30],
    dogru: 231,
    yanlis: 69,
  },
  {
    ders: "Kimya",
    gunler: [30, 40, 25, 0, 35, 50, 20],
    dogru: 165,
    yanlis: 35,
  },
  {
    ders: "Biyoloji",
    gunler: [25, 30, 20, 35, 0, 40, 15],
    dogru: 138,
    yanlis: 27,
  },
  {
    ders: "Türkçe",
    gunler: [50, 40, 45, 40, 50, 60, 30],
    dogru: 262,
    yanlis: 53,
  },
];

export const GUNLER = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

/** Program — ders × konu, gün atamalı. */
export const ornekProgram = {
  motto: "Bu hafta geometriye borcumuzu ödüyoruz",
  kocNotu:
    "Geometri son üç denemede net kaybettiriyor. Hafta içi her gün 30 soru, cumartesi genel tekrar.",
  durum: "Yayınlandı",
  tamamlanan: 11,
  toplam: 16,
  gorevler: [
    {
      ders: "Matematik",
      konu: "Türev — uygulama soruları",
      gun: "Pzt",
      hedef: 40,
      bitti: true,
    },
    {
      ders: "Matematik",
      konu: "İntegral — alan hesabı",
      gun: "Çar",
      hedef: 40,
      bitti: true,
    },
    {
      ders: "Geometri",
      konu: "Çemberde açı",
      gun: "Sal",
      hedef: 30,
      bitti: true,
    },
    {
      ders: "Geometri",
      konu: "Katı cisimler",
      gun: "Per",
      hedef: 30,
      bitti: false,
    },
    {
      ders: "Fizik",
      konu: "Elektrik alan",
      gun: "Sal",
      hedef: 25,
      bitti: true,
    },
    {
      ders: "Fizik",
      konu: "Manyetizma tekrar",
      gun: "Cum",
      hedef: 25,
      bitti: false,
    },
    {
      ders: "Kimya",
      konu: "Kimyasal denge",
      gun: "Çar",
      hedef: 30,
      bitti: true,
    },
    {
      ders: "Türkçe",
      konu: "Paragraf — ana düşünce",
      gun: "Her gün",
      hedef: 20,
      bitti: false,
    },
  ],
};

/** Denemeler — tam ve branş denemeleri. */
export const ornekDenemeler: {
  tarih: string;
  ad: string;
  bolum: string;
  kapsam: string;
  net: number;
  analiz: boolean;
}[] = [
  {
    tarih: "14 Haz",
    ad: "3D TYT Deneme 18",
    bolum: "TYT",
    kapsam: "Tam",
    net: 78.25,
    analiz: true,
  },
  {
    tarih: "12 Haz",
    ad: "Limit Matematik Branş 7",
    bolum: "AYT",
    kapsam: "Branş",
    net: 28.5,
    analiz: true,
  },
  {
    tarih: "7 Haz",
    ad: "3D TYT Deneme 17",
    bolum: "TYT",
    kapsam: "Tam",
    net: 74.75,
    analiz: true,
  },
  {
    tarih: "31 May",
    ad: "Bilgi Sarmal TYT 12",
    bolum: "TYT",
    kapsam: "Tam",
    net: 72.5,
    analiz: false,
  },
];

/** Deneme analizi — konu bazlı eksikler (yanlış + boş). */
export const ornekEksikler: { konu: string; ders: string; eksik: number }[] = [
  { konu: "Katı cisimler", ders: "Geometri", eksik: 9 },
  { konu: "Paragraf — anlam", ders: "Türkçe", eksik: 7 },
  { konu: "Çemberde açı", ders: "Geometri", eksik: 6 },
  { konu: "Olasılık", ders: "Matematik", eksik: 5 },
  { konu: "Manyetizma", ders: "Fizik", eksik: 4 },
  { konu: "Kimyasal denge", ders: "Kimya", eksik: 3 },
];

/** Konular — ders bazlı ilerleme. */
export const ornekKonuIlerleme: {
  ders: string;
  biten: number;
  toplam: number;
}[] = [
  { ders: "Matematik", biten: 38, toplam: 46 },
  { ders: "Geometri", biten: 14, toplam: 28 },
  { ders: "Fizik", biten: 22, toplam: 31 },
  { ders: "Kimya", biten: 19, toplam: 27 },
  { ders: "Biyoloji", biten: 17, toplam: 24 },
  { ders: "Türkçe", biten: 25, toplam: 30 },
];

/** Kaynaklar — kaynak başına soru ve biten konu. */
export const ornekKaynaklar: {
  ad: string;
  ders: string;
  soru: number;
  buHafta: number;
  bitenKonu: number;
}[] = [
  {
    ad: "3D Matematik Soru Bankası",
    ders: "Matematik",
    soru: 3_240,
    buHafta: 210,
    bitenKonu: 31,
  },
  {
    ad: "Limit Geometri",
    ders: "Geometri",
    soru: 980,
    buHafta: 145,
    bitenKonu: 12,
  },
  {
    ad: "Palme Fizik",
    ders: "Fizik",
    soru: 1_420,
    buHafta: 130,
    bitenKonu: 20,
  },
  {
    ad: "Bilgi Sarmal Türkçe",
    ders: "Türkçe",
    soru: 2_110,
    buHafta: 175,
    bitenKonu: 24,
  },
];

/**
 * Faz 3 CMS içerik modülü — Ahmet Hakan Almak'ın Gigbi profilinden
 * (gigbi.com/p/ahmet-hakan-almak1723581674 — 5.0★, 77 yorum) türetilen gerçek
 * içerik + koçluk sitesi için yazılmış SSS / paket / blog tohumları.
 *
 * Saf veri modülü — server, client ve seed script'ten güvenle import edilir.
 * `src/db/seed/cms.ts` bu veriyi D1'e yazar; public sayfalar DB boşsa buraya
 * geri düşer (fallback), böylece site seed'siz de eksiksiz görünür.
 *
 * GİZLİLİK: Halka açık her yerde ad + soyadın ilk harfi kullanılır ("Merve K.").
 */

export type SeedExam = "LGS" | "YKS" | "KPSS";

/* ------------------------------- Koç profili ------------------------------ */

export const coachContent = {
  /** Sitede tam ad görünür — koçun kendisi, öğrenci değil. */
  displayName: "Ahmet Hakan Almak",
  /** /koclar/[slug] için sabit slug (öne çıkan koç). */
  slug: "ahmet-hakan-almak",
  title: "Eğitim Koçu",
  location: "Kartal, İstanbul",
  bio:
    "Merhaba, ben Ahmet Hakan Almak. Marmara Hukuk Fakültesi öğrencisiyim ve aynı zamanda memurum. " +
    "Bu yıl YKS'de derece yaptım ve 876. oldum, KPSS'de ise 93 puan alarak 712. oldum. " +
    "Üç yıldır KPSS ve YKS koçluğu yapmaktayım.",
  credentials: [
    "Marmara Üniversitesi Hukuk Fakültesi",
    "YKS Türkiye 876.",
    "KPSS 93 puan — 712.",
    "3+ yıl KPSS / YKS / LGS koçluğu",
  ],
  subjects: ["KPSS", "YKS", "LGS"] as SeedExam[],
  photoUrl: "/ahmet-hakan.jpg",
} as const;

/** Marka düzeyi sosyal kanıt — Gigbi kaynaklı; tablo değil sabit. */
export const coachStats = {
  ratingAvg: 5.0,
  reviewCount: 77,
  proofUrl: "https://www.gigbi.com/p/ahmet-hakan-almak1723581674",
} as const;

/* -------------------------------- Yorumlar -------------------------------- */

export type TestimonialSeed = {
  /** Sitede görünen isim (ad + soyadın ilk harfi). */
  studentName: string;
  exam: SeedExam;
  quote: string;
  /** Yorumun Gigbi'deki tarihi — testimonials.created_at'e yazılır. */
  date: string;
  /** false → CMS'de bekler, Arif onaylayıp aktifleştirir. */
  isActive: boolean;
};

/** Tam metinli, yayına hazır yorumlar (öne çıkanlar). */
export const testimonialSeeds: TestimonialSeed[] = [
  {
    studentName: "Reyyan Ç.",
    exam: "KPSS",
    date: "2026-07-09",
    quote: "İlgili bir hoca, harika yönlendiriyor. Herkese tavsiye ederim.",
    isActive: true,
  },
  {
    studentName: "Yağmur V.",
    exam: "YKS",
    date: "2026-03-27",
    quote: "Bir koçtan çok daha fazlası; çok ilgili, çok profesyonel.",
    isActive: true,
  },
  {
    studentName: "Nisa B.",
    exam: "KPSS",
    date: "2026-04-18",
    quote: "Hakan Bey KPSS sürecinde planlı ilerlememe çok yardımcı oldu.",
    isActive: true,
  },
  {
    studentName: "Berke",
    exam: "YKS",
    date: "2026-06-14",
    quote: "Mükemmel biri; bir tek ders konusundan değil, her yönden çok iyi.",
    isActive: true,
  },
  {
    studentName: "Didem T.",
    exam: "LGS",
    date: "2025-10-20",
    quote: "Matematiği sevdiren bir hoca.",
    isActive: true,
  },
  {
    studentName: "Azra K.",
    exam: "YKS",
    date: "2025-10-13",
    quote: "Çok iyi, çok verimli ilerliyor. Tavsiye ederim.",
    isActive: true,
  },
  {
    studentName: "Muhammet N.",
    exam: "KPSS",
    date: "2024-08-15",
    quote: "Mükemmel öğrenci koçu 👏",
    isActive: true,
  },
  {
    studentName: "Esma A.",
    exam: "YKS",
    date: "2024-09-09",
    quote: "Mükemmel bir hoca.",
    isActive: true,
  },
  {
    studentName: "Ramazan Ö.",
    exam: "KPSS",
    date: "2026-04-04",
    quote: "10/10",
    isActive: true,
  },
  // -- Kaynakta kırpılmış yorumlar — TODO(Arif): tam metni onaylayıp
  //    /koc/site'ten aktifleştir (isActive=false ile beklerler). -----------
  {
    studentName: "Almina Ç.",
    exam: "KPSS",
    date: "2025-12-31",
    quote: "Koçluk sürecine yeni başladım ama ilk hafta…",
    isActive: false,
  },
  {
    studentName: "İpek G. (veli)",
    exam: "LGS",
    date: "2026-01-19",
    quote: "Oğlum LGS hazırlık döneminde, matematik dersi…",
    isActive: false,
  },
  {
    studentName: "Sibel K.",
    exam: "YKS",
    date: "2024-09-18",
    quote: "Eğitim başlamadan gerçekleştirilen ön görüşme…",
    isActive: false,
  },
  {
    studentName: "Eren A.",
    exam: "KPSS",
    date: "2025-12-31",
    quote: "Özellikle son zamanlarda dolandırıcıların hükmettiği…",
    isActive: false,
  },
  {
    studentName: "Zeynep B.",
    exam: "KPSS",
    date: "2025-11-24",
    quote: "Başarılı bir mentör; gönül rahatlığıyla…",
    isActive: false,
  },
  {
    studentName: "Elif D.",
    exam: "KPSS",
    date: "2026-05-28",
    quote: "Sistematik bir çalışma düzeni kuruyor, tablo takibi…",
    isActive: false,
  },
  {
    studentName: "Merve K.",
    exam: "KPSS",
    date: "2026-07-10",
    quote: "Daha yeni başlamamıza rağmen oldukça faydasını gördüm, hem motive edici…",
    isActive: false,
  },
  {
    studentName: "Şehriban U.",
    exam: "KPSS",
    date: "2025-12-31",
    quote: "Bilgisiyle, ilgisiyle ve enerjisiyle fark yaratan…",
    isActive: false,
  },
];

/* ---------------------------------- SSS ----------------------------------- */

export const faqSeeds: { question: string; answer: string }[] = [
  {
    question: "Koçluk süreci nasıl işliyor?",
    answer:
      "Önce ücretsiz ön görüşmede hedefini, mevcut seviyeni ve gün düzenini konuşuyoruz. " +
      "Ardından sana özel haftalık program hazırlanıyor; çözdüğün sorular ve denemelerin sistem üzerinden takip ediliyor. " +
      "Her hafta birebir görüşmeyle planı birlikte güncelliyoruz.",
  },
  {
    question: "Ücretsiz ön görüşmede ne oluyor?",
    answer:
      "Yaklaşık 20-30 dakikalık bir tanışma görüşmesi: hedefini, güncel netlerini ve günlük düzenini konuşuruz; " +
      "sana nasıl bir yol haritası çizeceğimizi somut olarak anlatırız. Hiçbir ödeme yükümlülüğü yoktur.",
  },
  {
    question: "Hangi sınavlara koçluk veriyorsunuz?",
    answer:
      "LGS, YKS (TYT-AYT) ve KPSS'ye hazırlanan öğrencilerle çalışıyoruz. " +
      "Program, sınavına ve alanına (sayısal / eşit ağırlık / sözel) göre hazırlanır.",
  },
  {
    question: "Görüşmeler yüz yüze mi, online mı?",
    answer:
      "Görüşmeler online (görüntülü veya sesli) yapılır; İstanbul Kartal ve çevresi için yüz yüze görüşme de mümkündür. " +
      "Hafta içinde WhatsApp üzerinden koçuna her zaman ulaşabilirsin.",
  },
  {
    question: "Haftalık program neye göre hazırlanıyor?",
    answer:
      "Deneme sonuçların, konu eksiklerin ve gün içindeki müsait saatlerin baz alınır. " +
      "Program sabit değildir; her haftaki görüşmede o haftanın verisine bakılarak birlikte revize edilir.",
  },
  {
    question: "Deneme analizleri nasıl yapılıyor?",
    answer:
      "Her denemenin doğru/yanlış/boş dağılımı ve net gelişimi sisteme işlenir; yanlışların konu bazında haritası çıkarılır. " +
      "Görüşmede bu tabloya bakarak bir sonraki haftanın önceliklerini belirleriz. Amaç deneme sayısı değil, her denemeden net kazanmaktır.",
  },
  {
    question: "Velilere bilgi veriliyor mu?",
    answer:
      "Evet. Özellikle LGS ve YKS öğrencilerinde veliyle süreç düzenli olarak paylaşılır; " +
      "gelişim somut verilerle (net grafiği, çalışma takibi) anlatılır. Veli hiçbir zaman karanlıkta kalmaz.",
  },
  {
    question: "Dershaneye gidiyorum / özel ders alıyorum; koçluk yine faydalı olur mu?",
    answer:
      "Evet — koçluk ders anlatımının yerine geçmez, onu düzene sokar. Hangi kaynağa ne zaman çalışacağını, " +
      "denemelerini nasıl analiz edeceğini ve motivasyonunu nasıl koruyacağını birlikte yönetiriz. " +
      "Dershane + koçluk kombinasyonu en verimli çalışan modellerden biridir.",
  },
  {
    question: "Ödeme nasıl yapılıyor? Uzun taahhüt var mı?",
    answer:
      "Aylık veya paket olarak; havale/EFT veya nakit ödeyebilirsin. Uzun taahhüt yoktur — " +
      "ilk ayın sonunda devam edip etmemek tamamen sana bağlıdır.",
  },
  {
    question: "Ne zaman başlamak en doğrusu?",
    answer:
      "En iyi zaman şimdi: koçluğun asıl gücü süreklilikte. Sınava az bir süre kalmış olsa bile " +
      "deneme analizi ve son dönem stratejisiyle ciddi net artışı mümkündür.",
  },
];

/* -------------------------------- Paketler -------------------------------- */

/**
 * DİKKAT — fiyatlar YER TUTUCUDUR (TODO Arif): gerçek fiyatları
 * /koc/site → Paketler sekmesinden ₺ olarak gir (kuruş cinsinden saklanır).
 */
export const packageSeeds: {
  name: string;
  priceKurus: number;
  compareAtKurus?: number | null;
  period: string;
  features: string[];
}[] = [
  {
    name: "Haftalık Koçluk",
    priceKurus: 129_900, // ₺1.299
    compareAtKurus: 149_900, // ₺1.499
    period: "haftalık",
    features: [
      "Haftalık birebir koçluk görüşmesi",
      "Sana özel haftalık çalışma programı",
      "Günlük soru ve deneme takibi (uygulama)",
      "WhatsApp'tan koçuna doğrudan erişim",
    ],
  },
  {
    name: "Aylık Koçluk",
    priceKurus: 399_900, // ₺3.999
    compareAtKurus: 499_900, // ₺4.999
    period: "aylık",
    features: [
      "Haftalık koçluğun tüm içeriği",
      "Aylık hedef yol haritası",
      "Deneme & net analizi + eksik konu haritası",
      "Öncelikli görüşme saatleri",
      "Veli bilgilendirmesi (LGS/YKS)",
    ],
  },
  {
    name: "Deneme Analizi Paketi",
    priceKurus: 49_900, // ₺499
    period: "tek seferlik",
    features: [
      "Denemelerinin detaylı analizi",
      "Konu bazlı eksik haritası",
      "60 dk birebir değerlendirme görüşmesi",
      "Sonraki haftalar için öneri planı",
    ],
  },
];

/* ------------------------------ Blog yazıları ----------------------------- */

export const blogPostSeeds: {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string; // ISO gün
}[] = [
  {
    slug: "deneme-analizi-nasil-yapilir",
    title: "Deneme Analizi Nasıl Yapılır? Net Artıran 5 Adım",
    excerpt:
      "Deneme çözmek tek başına net kazandırmaz; analiz kazandırır. Her denemeden sonra uygulayabileceğin 5 adımlık yöntem.",
    publishedAt: "2026-07-10",
    body: [
      "Her hafta deneme çözüp netleri bir kenara yazmak, ilerlemek anlamına gelmez. Net artışı, denemeden sonra yaptıklarında saklıdır. İşte koçluk görüşmelerimizde uyguladığımız 5 adımlık analiz yöntemi.",
      "",
      "## 1. Yanlışları üç gruba ayır",
      "Her yanlışın nedeni aynı değildir:",
      "- **Bilgi eksiği** — konuyu hiç bilmiyordun ya da eksik biliyordun.",
      "- **Dikkat hatası** — soruyu yanlış okudun, işlem hatası yaptın.",
      "- **Süre baskısı** — bilsen de yetiştiremedin ya da panikledin.",
      "Üçünün de çözümü farklıdır: bilgi eksiği konu tekrarı ister, dikkat hatası soru çözüm rutini ister, süre baskısı strateji ister.",
      "",
      "## 2. Boşları görmezden gelme",
      "Boş bıraktığın sorular çoğu zaman en değerli sinyaldir. \"Zaten bilmiyordum\" deyip geçme: o soru hangi konudandı, o konudan kaç deneme üst üste boş bırakıyorsun? Üç denemedir boş kalan konu, o haftanın programına girer.",
      "",
      "## 3. Konu bazlı eksik haritası çıkar",
      "Yanlış ve boşları konu konu işle. 4-5 deneme birikince tablo netleşir: hangi üç konu netlerini aşağı çekiyor? Genelde toplam kaybın yarısından fazlası 3-4 konudan gelir — çalışmanı oraya yığ.",
      "",
      "## 4. Süre ve sıra stratejini gözden geçir",
      "Hangi bölümde süre yetmedi? Hangi soru tipinde gereğinden uzun takıldın? Deneme analizinin yarısı içerik, yarısı stratejidir. Turlama tekniği, soru atlama disiplini ve bölüm sırası da analiz konusudur.",
      "",
      "## 5. Bir sonraki haftaya tek cümlelik hedef koy",
      "Analiz, eyleme dönüşmezse rapor olarak kalır. Her denemeden tek cümlelik somut hedef çıkar: \"Bu hafta problemlerden 60 soru + gelecek denemede boş sayısını 8'in altına indir\" gibi. Ölçülebilir olsun ki bir sonraki denemede kontrol edebilelim.",
      "",
      "> Denemeyi çözmek 3 saat, doğru analiz etmek 40 dakika sürer. Netleri artıran o 40 dakikadır.",
      "",
      "Deneme analizini birlikte yapmak istersen [ücretsiz ön görüşme](/iletisim) için yazabilirsin.",
    ].join("\n"),
  },
  {
    slug: "haftalik-calisma-programi-nasil-olmali",
    title: "Haftalık Çalışma Programı Nasıl Olmalı?",
    excerpt:
      "Sabah 6'da kalkma hayalleri üzerine kurulan programlar çarşambayı göremez. Sürdürülebilir bir haftalık programın 4 kuralı.",
    publishedAt: "2026-07-03",
    body: [
      "Öğrencilerin çoğu programsız değil; **gerçekçi olmayan programla** çalışıyor. Kağıt üzerinde kusursuz görünen ama ilk aksamada çöken planlar, motivasyonu da beraberinde götürür. Sürdürülebilir bir haftalık programın dört kuralı var.",
      "",
      "## 1. Mevcut haftanı ölçmeden program yazma",
      "Önce bir hafta boyunca gerçekte kaç saat çalıştığını, kaç soru çözdüğünü dürüstçe kaydet. Program, hayalindeki öğrenciye değil bugünkü sana yazılır; oradan yukarı doğru kademeli artırılır.",
      "",
      "## 2. Konu değil, çıktı planla",
      "\"Salı: Matematik\" zayıf bir plandır. \"Salı: problemlerden 40 soru + 10 yanlış analizi\" güçlü bir plandır. Her günün sonunda \"yaptım / yapmadım\" diye işaretleyebileceğin somut çıktılar koy: soru sayısı, konu bitirme, deneme, tekrar.",
      "",
      "## 3. Haftaya bir deneme ve bir analiz bloğu koy",
      "Deneme, haftanın notu değil pusulasıdır. Haftada en az bir deneme (branş veya genel) ve hemen ertesi gün 40 dakikalık analiz bloğu programda sabit durmalı. Analizden çıkan eksikler, bir sonraki haftanın programını belirler — döngü böyle kapanır.",
      "",
      "## 4. Boşluk bırak — program nefes almalı",
      "Haftanın her saatini doldurursan ilk aksayan gün tüm plan çöker. Haftada yarım gün telafi boşluğu bırak: aksayan görevler oraya kayar, program ayakta kalır. Dinlenme ve sosyal zaman da programın parçasıdır, düşmanı değil.",
      "",
      "> Programın amacı seni sıkıştırmak değil; her akşam \"bugün ne yapacağım belliydi ve yaptım\" duygusunu vermek.",
      "",
      "Kendi haftalık programını birlikte kurmak istersen [ücretsiz ön görüşmeye](/iletisim) bekleriz.",
    ].join("\n"),
  },
];

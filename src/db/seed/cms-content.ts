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

/* ---------------------------------- Ekip --------------------------------- */

export type TeamCoachSeed = {
  slug: string;
  displayName: string;
  title: string;
  location: string;
  /** Kartta ve profil üstünde görünen kısa, vurucu tanıtım. */
  headline: string;
  bio: string;
  /** İlk madde üniversite; sonrakiler derece/deneyim (ana sayfa slice(1,4)). */
  credentials: string[];
  subjects: string[];
  photoUrl: string;
  /**
   * Vitrindeki sıra. Ahmet Hakan kurucu koçtur ve sortOrder 0'dadır —
   * `getPublicCoach()` en düşük sort_order'ı kahraman kabul eder, bu yüzden
   * ekip 1'den başlar ve kurucuyu asla geçemez.
   */
  sortOrder: number;
};

/**
 * Kurucu koç dışındaki koçlar — /koclar "Ekip" şeridi + /koclar/[slug].
 *
 * Yalnız DOĞRULANABİLİR bilgi yazılır (üniversite, sınıf, derece). Hesabı
 * açıldığında her koç kendi metnini /koc/profil'den günceller ve bu tohum
 * yalnız ilk kurulum/yedek olarak kalır.
 */
export const teamCoachSeeds: TeamCoachSeed[] = [
  {
    slug: "muhammet-salih-ozdemir",
    displayName: "Muhammet Salih Özdemir",
    title: "Eğitim Koçu",
    location: "İstanbul",
    headline: "DGS'de Türkiye 4.'sü. İstanbul Hukuk'ta okuyor.",
    bio:
      "Ben Muhammet Salih Özdemir. İstanbul Üniversitesi Hukuk Fakültesi 3. sınıf öğrencisiyim; " +
      "buraya DGS'de Türkiye 4.'sü olarak geldim. Bir yerden yeniden başlamanın, planı " +
      "sıfırdan kurmanın ne demek olduğunu bizzat yaşadım. Çalıştığım öğrencilerde de aynı " +
      "şeye bakıyorum: kaç saat oturduğuna değil, oturduğun saatin neye dönüştüğüne.",
    credentials: [
      "İstanbul Üniversitesi Hukuk Fakültesi — 3. sınıf",
      "DGS Türkiye 4.'sü",
      "DGS · KPSS · YKS koçluğu",
    ],
    subjects: ["DGS", "KPSS", "YKS"],
    photoUrl: "/muhammet-salih-ozdemir.jpg",
    sortOrder: 1,
  },
  {
    slug: "omer-burkay-kaplica",
    displayName: "Ömer Burkay Kaplıca",
    title: "Eğitim Koçu",
    location: "İstanbul",
    headline: "Sözelde Türkiye 83.'sü. Boğaziçi Hukuk'ta okuyor.",
    bio:
      "Ben Ömer Burkay Kaplıca. Boğaziçi Üniversitesi Hukuk Fakültesi 2. sınıf öğrencisiyim. " +
      "YKS Sözel'de Türkiye 83.'sü oldum. Sözel derslerin ezberle değil, doğru okuma ve " +
      "düzenli tekrarla kazanıldığını sınav sürecimde öğrendim. Öğrencilerimle de bu iki " +
      "şeyin üstünde duruyorum: anladığını sanmakla anlamak arasındaki farkı görmek ve " +
      "tekrarı takvime bağlamak.",
    credentials: [
      "Boğaziçi Üniversitesi Hukuk Fakültesi — 2. sınıf",
      "YKS Sözel Türkiye 83.'sü",
      "YKS · KPSS koçluğu",
    ],
    subjects: ["YKS", "KPSS"],
    photoUrl: "/omer-burkay-kaplica.jpg",
    sortOrder: 2,
  },
];

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
  {
    question: "Soru takibinde doğru, yanlış ve boş sayılarını da girebiliyor muyum?",
    answer:
      "Evet. Uygulamadaki soru takibi tablosunda bir hücreye dokunduğunda doğru / yanlış / boş " +
      "alanları açılır; girdiğinde toplam ve net otomatik hesaplanır, ders bazında doğruluk yüzden çıkar. " +
      "Acelen varsa sadece toplam soru sayısı yazman da yeterli — kırılım zorunlu değildir.",
  },
  {
    question: "Hangi dersten kaç soru çözdüğümü görebiliyor muyum?",
    answer:
      "Evet. Gelişim sayfasındaki \"Ders ders soru ve doğruluk\" tablosu, son sekiz haftanın her biri için " +
      "hangi dersten kaç soru çözdüğünü, toplam doğru/yanlış sayını ve doğruluk yüzdeni gösterir. " +
      "Koçun da tam olarak aynı tabloyu görür.",
  },
  {
    question: "Koçuma nasıl ulaşıyorum?",
    answer:
      "Haftalık birebir görüşmelerin dışında WhatsApp'tan doğrudan koçuna yazabilirsin — " +
      "çözemediğin bir soru, programda aksama ya da moral gerektiren bir gün için. " +
      "Sitedeki WhatsApp butonundan da bize her zaman ulaşabilirsin.",
  },
  {
    question: "Öğrenciniz olmasam da ücretsiz kaynaklarınızdan yararlanabilir miyim?",
    answer:
      "Evet. Kaynaklar sayfamızda ÖSYM çıkmış soruları, OGM Materyal ve MEBİ'nin ücretsiz denemeleri, " +
      "ders notları ve YÖK Atlas gibi resmî kaynaklara doğrudan bağlantı bulacaksın. " +
      "Ayrıca net hesaplama aracımızı da ücretsiz kullanabilirsin — kayıt gerekmiyor.",
  },
  {
    question: "Sınav sonucu garantisi veriyor musunuz?",
    answer:
      "Hayır, kimse veremez. Verdiğimiz şey süreç garantisidir: her hafta programın hazır olur, " +
      "her denemen analiz edilir ve ilerlemen ölçülebilir şekilde kayıt altına alınır. " +
      "Sonucu belirleyen, bu düzenin ne kadar sürdürüldüğüdür.",
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
  {
    slug: "yks-net-nasil-artirilir",
    title: "YKS'de Net Nasıl Artırılır? TYT-AYT İçin 7 İlke",
    excerpt:
      "Net artışı tesadüf değildir; ölçülebilir bir sürecin sonucudur. TYT ve AYT netlerini yükseltmek için işe yarayan 7 ilke.",
    publishedAt: "2026-07-17",
    body: [
      "YKS'de \"çok çalışıyorum ama netim artmıyor\" cümlesini çok duyarım. Sorun genelde çalışma miktarında değil, çalışmanın yönünde ve ölçülmesinde olur. İşte TYT-AYT netlerini gerçekten yükselten 7 ilke.",
      "",
      "## 1. Önce ölç, sonra planla",
      "Net artışı ölçmeden başlamaz. Son 3-4 denemenin konu bazlı doğru/yanlış dağılımını çıkar; netini en çok aşağı çeken 3 konuyu bul. Çalışmanın büyük kısmı o üç konuya gitmeli.",
      "",
      "## 2. Konu değil, kazanım takip et",
      "\"Bugün matematik çalıştım\" ölçülemez. \"Problemlerden 40 soru çözdüm, 12 yanlışın 9'u kurulum hatasıydı\" ölçülebilir. Kazanım odaklı çalışınca zayıf noktan netleşir.",
      "",
      "## 3. Yanlışlarını sınıflandır",
      "Her yanlış bilgi eksiği değildir. Bilgi eksiği konu tekrarı, dikkat hatası soru rutini, süre baskısı strateji ister. Yanlışını doğru sınıflandırmadan doğru çözümü uygulayamazsın.",
      "",
      "## 4. TYT ve AYT dengesini alanına göre kur",
      "Sayısal, eşit ağırlık ve sözelin TYT-AYT ağırlığı farklıdır. Sıralaman büyük ölçüde AYT'de belirlenir ama TYT barajı ve katkısı ihmal edilemez. Alanına göre haftalık dengeyi netleştir.",
      "",
      "## 5. Denemeyi çözmek değil, analiz etmek net kazandırır",
      "Haftada bir genel + branş denemesi yeterli; asıl kazanç ertesi gün yapılan 40 dakikalık analizde. Detaylı yöntem için [Deneme Analizi Nasıl Yapılır](/blog/deneme-analizi-nasil-yapilir) yazısına bak.",
      "",
      "## 6. Tekrarı programa göm",
      "Öğrendiğin konu tekrar edilmezse birkaç haftada silinir. Aralıklı tekrar (1 gün, 1 hafta, 1 ay) ile eski konuları taze tut; yoksa yeni konu öğrenirken eskiyi kaybedersin.",
      "",
      "## 7. Sürekliliği koru",
      "Net grafiği düz bir çizgi değil; iniş çıkışlıdır. Bir kötü deneme her şeyi bozmaz, üç haftalık trend önemlidir. Süreklilik, tek bir kahraman haftadan daha değerlidir.",
      "",
      "> Net artışı, doğru şeyi ölçerek tekrar etmenin doğal sonucudur.",
      "",
      "TYT-AYT sürecini birlikte planlamak istersen [YKS koçluğu](/yks-koclugu) sayfasına göz atabilir ya da doğrudan [ücretsiz ön görüşme](/iletisim) alabilirsin.",
    ].join("\n"),
  },
  {
    slug: "lgs-nasil-calisilir-8-sinif",
    title: "LGS'ye Nasıl Çalışılır? 8. Sınıf İçin Yol Haritası",
    excerpt:
      "8. sınıf yoğun bir yıl; okulu aksatmadan LGS'ye hazırlanmanın dengeli ve sürdürülebilir yolu.",
    publishedAt: "2026-07-14",
    body: [
      "LGS'de en büyük risk, okulu ve sınavı ayrı iki iş gibi görmektir. Oysa 8. sınıfta okul başarısı ile LGS hazırlığı aynı yolun parçasıdır. İşte dengeli bir yol haritası.",
      "",
      "## Okulu aksatmadan çalış",
      "8. sınıfta okul konuları LGS'nin de konusudur. Derste öğrendiğini o hafta pekiştirmek, sonradan sıfırdan çalışmaktan çok daha verimlidir. Okul + LGS'yi tek akışta yürüt.",
      "",
      "## Sayısal ve sözeli dengele",
      "Matematik ve fen çoğu öğrencide öne çıkar ama Türkçe ve inkılap netleri sıralamada belirleyicidir. Sevdiğin derse kaçmak yerine, net kaybının en çok olduğu bölüme zaman ayır.",
      "",
      "## Deneme alışkanlığını erken kur",
      "Deneme, yılın sonunda değil baştan başlamalı. Erken başlayan öğrenci sınav formatına, süre yönetimine ve heyecana çok daha hazır olur. Haftada bir deneme + analiz iyi bir tempodur.",
      "",
      "## Yanlışları defterle takip et",
      "Her denemenin yanlışlarını konu konu bir deftere işle. Birkaç hafta sonra hangi konunun sürekli tekrar ettiğini görürsün; o konu bir sonraki haftanın önceliği olur.",
      "",
      "## Veliyle şeffaf ilerle",
      "LGS sürecinde veli baskı kaynağı değil, destek olmalı. Gelişimi somut verilerle (net grafiği, çalışma takibi) paylaşmak evdeki gerginliği azaltır ve öğrenciyi rahatlatır.",
      "",
      "## Dinlenmeyi programa yaz",
      "8. sınıf uzun bir maraton. Uyku, mola ve sosyal zaman programın düşmanı değil yakıtıdır. Tükenen bir öğrenci son aylarda çöker; dengeli ilerleyen istikrarlı yükselir.",
      "",
      "> LGS başarısı bir haftalık kahramanlık değil, dokuz aylık sürdürülebilir düzendir.",
      "",
      "8. sınıf için sana özel bir program kurmak istersen [LGS koçluğu](/lgs-koclugu) sayfasına bakabilir ya da [ücretsiz ön görüşme](/iletisim) alabilirsin.",
    ].join("\n"),
  },
  {
    slug: "kpss-nasil-calisilir",
    title: "KPSS'ye Nasıl Çalışılır? Çalışırken Sınava Hazırlanmak",
    excerpt:
      "Çoğu KPSS adayı işte ya da okuldayken hazırlanır. Kısıtlı zamanda en yüksek verimi almanın gerçekçi yolu.",
    publishedAt: "2026-07-01",
    body: [
      "KPSS'nin en büyük zorluğu konuların ağırlığı değil, zamanın kıtlığıdır. Çoğu aday çalışırken ya da okurken hazırlanır. Bu yüzden KPSS'de kazanan, en çok çalışan değil, kısıtlı zamanı en doğru yöneten adaydır.",
      "",
      "## Gerçekçi bir tempo belirle",
      "Günde 8 saat hayaliyle kurulan program çarşambayı göremez. Önce gerçekte kaç saat ayırabildiğini dürüstçe ölç; programı oradan, sürdürülebilir şekilde kur.",
      "",
      "## GY-GK ve alanı dengele",
      "Genel Yetenek-Genel Kültür ile alan (Eğitim Bilimleri, ÖABT ya da ilgili alan) farklı çalışma ister. Hangisinde daha çok net kaybediyorsan ağırlığı oraya ver; ikisini de aynı anda ihmal etme.",
      "",
      "## Puanı belirleyen konulara yığıl",
      "KPSS'de her konu eşit değildir. Soru sayısı yüksek ve senin zayıf olduğun konular en yüksek getiriyi verir. Düşük getirili detaylarda boğulmak yerine, atama puanını en çok etkileyen konulara odaklan.",
      "",
      "## Deneme ile sınav ritmini kur",
      "KPSS zamana karşı bir sınavdır. Düzenli deneme, hem net takibi hem de süre yönetimi kazandırır. Denemeden çıkan eksikler doğrudan bir sonraki haftanın planına girer.",
      "",
      "## Atama hedefini netleştir",
      "\"Yüksek puan\" belirsizdir; \"hedeflediğim kadro için gereken puan\" nettir. Hedef puanı bilmek, hangi netlere ihtiyacın olduğunu ve stratejini netleştirir.",
      "",
      "> KPSS'de fark, çok çalışmakta değil; az zamanı doğru önceliğe ayırmakta.",
      "",
      "Çalışma temponu bilen bir programla ilerlemek istersen [KPSS koçluğu](/kpss-koclugu) sayfasına göz atabilir ya da [ücretsiz ön görüşme](/iletisim) alabilirsin.",
    ].join("\n"),
  },
  {
    slug: "tyt-mi-ayt-mi-zaman-yonetimi",
    title: "TYT mi AYT mi? Zamanını Nasıl Bölmelisin",
    excerpt:
      "TYT ve AYT'ye ayıracağın zamanı yanlış bölmek, çalışmanın karşılığını almanı engeller. Alanına göre doğru denge.",
    publishedAt: "2026-06-24",
    body: [
      "\"Önce TYT'yi bitireyim sonra AYT'ye geçerim\" ya da tam tersi — ikisi de sık yapılan hatadır. Doğru cevap, senin alanına ve mevcut seviyene göre değişir. İşte dengeyi kurmanın mantığı.",
      "",
      "## Sıralamanı ne belirliyor?",
      "Sayısal ve eşit ağırlıkta sıralama büyük ölçüde AYT'de belirlenir; ancak TYT barajı ve katkısı görmezden gelinemez. Sözelde denge daha eşittir. Önce hangi sınavın senin için daha belirleyici olduğunu bil.",
      "",
      "## İkisini paralel yürüt",
      "TYT'yi tamamen bitirip AYT'ye geçmek çoğu zaman yanlıştır; ilk konu unutulur. Doğru yaklaşım paralel ilerlemek: haftanın belirli günleri TYT, belirli günleri AYT, düzenli tekrarla.",
      "",
      "## Zayıf sınava daha çok, güçlü sınava koruyucu zaman",
      "Netini en çok aşağı çeken sınava ağırlık ver; güçlü olduğun sınavı ise \"koruma\" modunda düzenli tekrarla. Amaç güçlüyü kaybetmeden zayıfı yukarı çekmek.",
      "",
      "## Denemede iki sınavı da ölç",
      "TYT ve AYT denemelerini ayrı ayrı çöz ve net trendini ayrı takip et. Hangisinde ilerleme durduysa zaman bölüşümünü orada revize et.",
      "",
      "> Doğru soru \"TYT mi AYT mi\" değil; \"bu hafta hangisine ne kadar\" sorusudur.",
      "",
      "Alanına göre doğru dengeyi birlikte kurmak istersen [YKS koçluğu](/yks-koclugu) sayfasına bakabilir ya da [ücretsiz ön görüşme](/iletisim) alabilirsin.",
    ].join("\n"),
  },
  {
    slug: "sinav-kaygisi-ile-basa-cikma",
    title: "Sınav Kaygısıyla Başa Çıkmak: İşe Yarayan Yöntemler",
    excerpt:
      "Biraz heyecan normaldir; kaygı performansı düşürdüğünde sorun olur. Sınav kaygısını yönetmenin somut yolları.",
    publishedAt: "2026-06-17",
    body: [
      "Sınav öncesi biraz heyecan doğaldır, hatta faydalıdır. Sorun, kaygının çalışmayı ve sınav performansını düşürdüğü noktada başlar. İyi haber: kaygı yönetilebilir bir beceridir.",
      "",
      "## Kaygının kaynağını ayır",
      "Kaygı çoğu zaman belirsizlikten beslenir: \"yetişmeyecek\", \"başaramayacağım\". Somut bir plan ve ölçülen ilerleme, belirsizliği azaltarak kaygıyı da azaltır. Net grafiğinde yükselişi görmek en iyi kaygı ilacıdır.",
      "",
      "## Hazırlık, en güçlü panzehir",
      "Denemelerle sınav ortamını ne kadar çok yaşarsan, gerçek sınavda o kadar az yabancılık çekersin. Süreyle deneme çözmek, sınav gününü tanıdık hale getirir.",
      "",
      "## Nefes ve bedenle çalış",
      "Sınav anında kalp hızlanır, dikkat dağılır. Yavaş ve derin nefes (4 saniye al, 6 saniye ver) bedeni sakinleştirir. Bunu sınavdan önce denemelerde de prova et ki refleks olsun.",
      "",
      "## Sonucu değil süreci düşün",
      "\"Ya kazanamazsam\" seni bugünkü sorudan koparır. Odağı geleceğe değil, önündeki soruya ve bu haftanın hedefine getir. Süreç kontrol edilebilir, sonuç değil.",
      "",
      "## Uyku ve molayı ihmal etme",
      "Uykusuz bir beyin hem daha kaygılı hem daha unutkandır. Düzenli uyku ve mola, kaygı yönetiminin görünmeyen ama en güçlü ayağıdır.",
      "",
      "> Kaygıyı yok etmeye değil, onunla çalışabilmeye odaklan; hazırlık arttıkça kaygı küçülür.",
      "",
      "Kaygıyı azaltan en somut şey, ölçülen bir ilerlemedir. Nasıl bir süreç işlediğini [nasıl çalışır](/nasil-calisir) sayfasında görebilir ya da [ücretsiz ön görüşme](/iletisim) alabilirsin.",
    ].join("\n"),
  },
  {
    slug: "verimli-ders-calisma-teknikleri",
    title: "Verimli Ders Çalışma Teknikleri: Süre Değil Verim",
    excerpt:
      "Saatlerce masada oturmak çalışmak değildir. Aynı sürede daha çok öğrenmeni sağlayan kanıtlanmış teknikler.",
    publishedAt: "2026-06-10",
    body: [
      "\"Bugün 8 saat çalıştım\" cümlesi kulağa iyi gelir ama masada geçen süre ile öğrenilen şey aynı değildir. Verim, süreyi uzatmakla değil, doğru tekniklerle artar. İşte işe yarayanlar.",
      "",
      "## Aktif çalış, pasif okuma",
      "Konuyu tekrar tekrar okumak en zayıf yöntemdir; tanıdık gelir ama öğrenilmez. Bunun yerine soru çöz, kendine anlat, boş kağıda yaz. Bilgiyi geri çağırmak (active recall) öğrenmenin en güçlü aracıdır.",
      "",
      "## Aralıklı tekrar yap",
      "Bir konuyu bir kez öğrenip bırakırsan birkaç haftada silinir. Aynı konuyu artan aralıklarla (1 gün, 1 hafta, 1 ay) tekrar et; her tekrar hafızayı biraz daha kalıcı yapar.",
      "",
      "## Odak bloklarıyla çalış (Pomodoro)",
      "25-50 dakikalık kesintisiz odak + kısa mola döngüsü, saatlerce dağınık oturmaktan verimlidir. Molayı telefonla değil, gerçekten dinlenerek geçir.",
      "",
      "## Tek işe odaklan",
      "Aynı anda birden çok işe bölünen dikkat, ikisini de zayıf yapar. Telefonu başka odaya koy, tek konuya kilitlen. Derin çalışma, yüzeysel çok çalışmadan üstündür.",
      "",
      "## Zoru öne al",
      "Zihnin en taze olduğu zamanı en zorlandığın derse ayır. Kolay işi yorgunken yapmak sorun değil; ama zoru yorgunken yapmak verimi düşürür.",
      "",
      "> Ölçüt masada geçen saat değil, o saatte geri çağırabildiğin bilgidir.",
      "",
      "Bu teknikleri kendi programına oturtmak istersen [nasıl çalışır](/nasil-calisir) sayfasına bakabilir ya da [ücretsiz ön görüşme](/iletisim) alabilirsin.",
    ].join("\n"),
  },
  {
    slug: "sinav-koclugu-nedir-kime-gerekir",
    title: "Sınav Koçluğu Nedir, Kime Gerekir?",
    excerpt:
      "Sınav koçluğu ders anlatımı değildir; süreç yönetimidir. Ne olduğu, ne olmadığı ve kimin işine yaradığı.",
    publishedAt: "2026-06-03",
    body: [
      "Sınav koçluğu son yıllarda çok konuşuluyor ama çoğu zaman yanlış anlaşılıyor. Kimileri özel ders sanıyor, kimileri motivasyon konuşması. Oysa koçluk bambaşka bir şey. Kısaca açıklayalım.",
      "",
      "## Sınav koçluğu nedir?",
      "Sınav koçluğu, bir öğrencinin sınav hazırlık sürecini planlayan, ölçen ve yöneten bir çalışmadır. Koç; haftalık programı kurar, soru ve deneme takibini yapar, deneme analiziyle eksikleri belirler ve programı her hafta güncelleyerek öğrencinin ölçülebilir şekilde ilerlemesini sağlar.",
      "",
      "## Ne değildir?",
      "Koçluk ders anlatımı (özel ders) değildir; konuyu öğretmez, o işi öğretmen ve kaynaklar yapar. Sadece motivasyon konuşması da değildir. Koçluk, dağınık çalışmayı ölçülebilir bir sisteme dönüştürmektir.",
      "",
      "## Kime gerekir?",
      "Koçluk özellikle şu durumlarda işe yarar:",
      "- Çok çalışıp da neti artmayan öğrenci",
      "- Nereden başlayacağını, neye öncelik vereceğini bilemeyen öğrenci",
      "- Program kurup sürdüremeyen, disiplinde zorlanan öğrenci",
      "- Denemeleri çözüp analiz etmeyen, aynı hataları tekrarlayan öğrenci",
      "- İş/okul temposunda zamanı doğru yönetmesi gereken aday",
      "",
      "## Nasıl işler?",
      "Süreç genelde şu döngüyle yürür: ücretsiz ön görüşme, seviye tespiti, sana özel program, soru/deneme takibi, haftalık birebir görüşme ve deneme analizi. Detaylar için [nasıl çalışır](/nasil-calisir) sayfasına bakabilirsin.",
      "",
      "> İyi bir koçluk, öğrenciye balık vermez; her hafta daha iyi balık tutmayı öğretir.",
      "",
      "Koçluğun sana uygun olup olmadığını konuşmak istersen [ücretsiz ön görüşme](/iletisim) alabilirsin — hiçbir ödeme yükümlülüğü yok.",
    ].join("\n"),
  },
  {
    slug: "son-3-ay-net-yukseltme-stratejisi",
    title: "Son 3 Ayda Net Yükseltme Stratejisi",
    excerpt:
      "Sınava az kaldıysa panik değil, doğru öncelik gerekir. Son dönemde net yükseltmenin sakin ve etkili planı.",
    publishedAt: "2026-05-27",
    body: [
      "Sınava son üç ay kala herkeste bir telaş başlar: \"her şeyi baştan çalışmam lazım\". Oysa son dönemde başarı, yeni konu yığmaktan değil, doğru önceliklendirmeden gelir. İşte sakin ve etkili bir plan.",
      "",
      "## Yeni konuya değil, kazanan konulara odaklan",
      "Son 3 ay, hiç bilmediğin bir konuyu sıfırdan öğrenmenin değil, bildiğin konularda net garantilemenin zamanıdır. En çok soru gelen ve senin oturmaya yakın olduğun konular en yüksek getiriyi verir.",
      "",
      "## Deneme sıklığını artır",
      "Bu dönemde deneme, çalışmanın merkezine geçer. Düzenli deneme; süre yönetimi, dikkat ve sınav ritmi kazandırır. Ama her denemeyi analiz etmeyi unutma — analiz olmadan deneme sadece yorar.",
      "",
      "## Tekrarı sıkılaştır",
      "Öğrendiklerini kaybetmemek için tekrar aralıklarını daralt. Son dönemde amaç yeni bilgi değil, mevcut bilgiyi sınav gününe taze taşımaktır.",
      "",
      "## Zayıf üç konuyu kapat",
      "Son denemelerinde netini en çok düşüren üç konuyu belirle ve onları hedefe al. Her şeyi düzeltmeye çalışmak yerine, en çok kan kaybettiğin yerleri kapatmak tabloyu hızla değiştirir.",
      "",
      "## Bedenini ve moralini koru",
      "Son dönemde uykusuzluk ve tükenmişlik en büyük net düşmanıdır. Düzenli uyku, mola ve sakin bir zihin, ezber kadar önemlidir. Panik iyi karar aldırmaz.",
      "",
      "> Son 3 ayda kazanan, en çok yeni konu ekleyen değil; en az net kaybeden adaydır.",
      "",
      "Son dönem stratejini birlikte çıkarmak istersen [ücretsiz ön görüşme](/iletisim) alabilir ya da hangi sınava hazırlanıyorsan [YKS](/yks-koclugu), [LGS](/lgs-koclugu) veya [KPSS](/kpss-koclugu) koçluğu sayfasına bakabilirsin.",
    ].join("\n"),
  },
];

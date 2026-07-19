/**
 * Sınava özel açılış sayfası içerikleri (YKS / LGS / KPSS koçluğu).
 * Saf veri modülü — hem sayfa `metadata`'sı hem `<ExamLanding>` bileşeni buradan
 * okur. Anahtar kelime hedefli, ama marka sesi: sakin, güven veren, satış-baskısız.
 */

export type ExamCode = "YKS" | "LGS" | "KPSS";

export type ExamLandingConfig = {
  code: ExamCode;
  slug: string; // "/yks-koclugu"
  breadcrumbName: string; // "YKS Koçluğu"
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  /** Başlık: düz kısım + vurgulu (primary) kısım. */
  heroTitleLead: string;
  heroTitleAccent: string;
  heroLead: string;
  introTitle: string;
  introBody: string;
  benefits: string[];
  /** JSON-LD Course açıklaması. */
  courseName: string;
  courseDescription: string;
};

export const EXAM_LANDING: Record<ExamCode, ExamLandingConfig> = {
  YKS: {
    code: "YKS",
    slug: "/yks-koclugu",
    breadcrumbName: "YKS Koçluğu",
    metaTitle: "YKS Koçluğu (TYT-AYT) — Online Birebir",
    metaDescription:
      "YKS koçluğu: TYT ve AYT için birebir online sınav koçluğu. Derece yapmış bir koçla haftalık program, deneme analizi ve net takibiyle sıralamanı yükselt. Ücretsiz ön görüşme.",
    heroEyebrow: "YKS · TYT-AYT birebir koçluk",
    heroTitleLead: "YKS koçluğu: ",
    heroTitleAccent: "sıralamanı yükselt",
    heroLead:
      "TYT ve AYT'yi tek tek planlayan, alanına göre önceliklendiren bir koçla çalış. Motivasyon konuşması değil; her hafta ölçülen, grafikte görünen net artışı.",
    introTitle: "YKS'de fark, düzenli ölçümde",
    introBody:
      "YKS uzun bir maraton; tek başına deneme çözmek yetmez. Derecenin Ruhu'nda TYT-AYT dengeni kurar, her denemeyi konu konu analiz eder ve programı her hafta güncelleriz. Koçun bu yoldan geçmiş biri: YKS'de Türkiye 876. olmuş bir isim.",
    benefits: [
      "TYT ve AYT'yi ayrı ayrı planlayan haftalık program",
      "Alanına göre (sayısal / eşit ağırlık / sözel) konu önceliklendirme",
      "Deneme analizi ve konu bazlı eksik haritası",
      "Net gelişim grafiğiyle ölçülen ilerleme",
      "Sıralama hedefine göre son dönem stratejisi",
      "WhatsApp'tan koçuna doğrudan erişim",
      "Veli bilgilendirmesi (isteğe bağlı)",
    ],
    courseName: "YKS Koçluğu (TYT-AYT)",
    courseDescription:
      "TYT ve AYT için birebir online YKS koçluğu: haftalık program, deneme analizi, konu bazlı eksik haritası ve net takibi.",
  },
  LGS: {
    code: "LGS",
    slug: "/lgs-koclugu",
    breadcrumbName: "LGS Koçluğu",
    metaTitle: "LGS Koçluğu — 8. Sınıf Online Birebir",
    metaDescription:
      "LGS koçluğu: 8. sınıf öğrencileri için birebir online sınav koçluğu. Sürdürülebilir haftalık program, deneme analizi ve veliyle şeffaf takip. Ücretsiz ön görüşme.",
    heroEyebrow: "LGS · 8. sınıf birebir koçluk",
    heroTitleLead: "LGS koçluğu: ",
    heroTitleAccent: "düzenli ve sürdürülebilir",
    heroLead:
      "8. sınıfın temposunu bilen bir koçla çalış. Okulu aksatmadan kurulan gerçekçi bir program, düzenli deneme alışkanlığı ve veliyle şeffaf takip.",
    introTitle: "LGS'de başarı, sürdürülebilir düzende",
    introBody:
      "LGS'de en büyük risk, ilk aksamada çöken hayali programlardır. Derecenin Ruhu'nda 8. sınıf öğrencisinin gününe uyan, okulu aksatmayan bir program kurar; her denemeyi analiz eder ve veliyi somut verilerle düzenli bilgilendiririz.",
    benefits: [
      "8. sınıf temposuna uygun, sürdürülebilir haftalık program",
      "Sayısal ve sözel bölümler için dengeli çalışma",
      "Deneme analizi ve yanlış konu haritası",
      "Okul + LGS dengesini koruyan planlama",
      "Veliyle düzenli, somut bilgilendirme",
      "Motivasyon ve sınav kaygısı yönetimi",
      "WhatsApp'tan koçuna doğrudan erişim",
    ],
    courseName: "LGS Koçluğu",
    courseDescription:
      "8. sınıf öğrencileri için birebir online LGS koçluğu: sürdürülebilir haftalık program, deneme analizi ve veli bilgilendirmesi.",
  },
  KPSS: {
    code: "KPSS",
    slug: "/kpss-koclugu",
    breadcrumbName: "KPSS Koçluğu",
    metaTitle: "KPSS Koçluğu — Online Birebir",
    metaDescription:
      "KPSS koçluğu: çalışan ve öğrenci temposuna uyan birebir online sınav koçluğu. Gerçekçi çalışma programı, deneme analizi ve atama hedefine göre puan stratejisi. Ücretsiz ön görüşme.",
    heroEyebrow: "KPSS birebir koçluk",
    heroTitleLead: "KPSS koçluğu: ",
    heroTitleAccent: "atama hedefine odaklan",
    heroLead:
      "İş ve çalışma dengesini bilen bir koçla çalış. KPSS 93 puanla derece yapmış bir isimle gerçekçi program, düzenli deneme ve atama hedefine giden puan stratejisi.",
    introTitle: "KPSS'de verim, doğru öncelikte",
    introBody:
      "KPSS'de zaman en kıt kaynaktır; çoğu aday çalışırken hazırlanır. Derecenin Ruhu'nda temponu bilen bir program kurar, GY-GK ve alan dengeni gözetir, her denemeyi analiz ederek net kaybının en çok olduğu konulara yükleniriz.",
    benefits: [
      "Çalışan/öğrenci temposuna uyan gerçekçi program",
      "GY-GK ve alan (Eğitim Bilimleri / ÖABT / alan) dengesi",
      "Deneme analizi ve net takibi",
      "Atama hedefine göre puan stratejisi",
      "Kısa sürede verim için öncelik yönetimi",
      "Konu bazlı eksik haritası",
      "WhatsApp'tan koçuna doğrudan erişim",
    ],
    courseName: "KPSS Koçluğu",
    courseDescription:
      "Çalışan ve öğrenci adaylar için birebir online KPSS koçluğu: gerçekçi program, deneme analizi, net takibi ve atama hedefine göre puan stratejisi.",
  },
};

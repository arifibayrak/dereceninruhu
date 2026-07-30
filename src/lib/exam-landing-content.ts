/**
 * Sınava özel açılış sayfası içerikleri (YKS / LGS / KPSS koçluğu).
 * Saf veri modülü — hem sayfa `metadata`'sı hem `<ExamLanding>` bileşeni buradan
 * okur. Anahtar kelime hedefli, ama marka sesi: sakin, güven veren, satış-baskısız.
 *
 * DERİNLİK ≠ ABARTI (geri bildirim, Görsel 13): öğrenciler rakiplerin daha
 * detaylı anlatımlarına daha çok ilgi gösteriyor. Cevabımız sıfat eklemek
 * DEĞİL, somutluk eklemek — "motivasyon desteği" yerine "iki hafta üst üste
 * soru girişi düşerse koçun arar". Premium konumlandırma sakin ve kanıtlı
 * kalmayı gerektirir (bkz. AGENTS.md).
 */

export type ExamCode = "YKS" | "LGS" | "KPSS";

/** Destek sütunu — dört başlıkta "pakette tam olarak ne var" cevabı. */
export type SupportPillar = {
  /** İkon eşlemesi için sabit anahtar (bkz. exam-landing.tsx PILLAR_ICONS). */
  key: "akademik" | "plan" | "gorusme" | "dayaniklilik";
  title: string;
  /** Sütunun tek cümlelik vaadi. */
  description: string;
  /** Somut, ölçülebilir maddeler — sıfat değil, olay. */
  items: string[];
};

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
  /** Dört destek sütunu — "Koçluğun kapsamı" bölümünü besler. */
  pillars: SupportPillar[];
  /**
   * AI sistem bölümünün sınava göre değişen başlığı/gövdesi. Kart metinleri
   * `ai-system-section.tsx`'te sabittir — burada yalnız çerçeve değişir; üç
   * sayfa aynı başlıkla yayınlanmasın diye (duplicate content).
   */
  aiTitle: string;
  aiDescription: string;
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
    pillars: [
      {
        key: "akademik",
        title: "Akademik destek",
        description:
          "Netini neyin düşürdüğünü tahmin etmeyi bırakırsın; veriden görürsün.",
        items: [
          "YKS'de Türkiye 876. olmuş bir koçla birebir çalışma",
          "Her denemenin konu konu analizi: hangi kazanımda kaç net kaybettin",
          "Doğru/yanlış/boş ayrımıyla günlük soru takibi — sadece toplam değil",
          "Ders bazında doğruluk yüzdesi: çok soru mu çözüyorsun, doğru mu",
          "Eksik konu haritası ve o konuya hangi kaynaktan çalışacağın",
        ],
      },
      {
        key: "plan",
        title: "Plan ve strateji",
        description:
          "Her hafta yeniden yazılan, senin gerçek temponu tanıyan bir program.",
        items: [
          "TYT ve AYT'yi ayrı ayrı planlayan, gün gün işaretlenen haftalık program",
          "Alanına göre (sayısal / eşit ağırlık / sözel) konu önceliklendirme",
          "Kaynak seçimi: hangi fasikülü ne zaman bitireceğin",
          "Deneme takvimi — kaç günde bir, hangi formatta",
          "Sıralama hedefine göre son dönem stratejisi ve tekrar planı",
        ],
      },
      {
        key: "gorusme",
        title: "Görüşme ve iletişim",
        description:
          "Ayda bir 'nasıl gidiyor' değil; her hafta aynı saatte, kayıtlı görüşme.",
        items: [
          "Haftalık birebir görüşme — konuşulanlar not edilir, takip edilir",
          "Çözemediğin soru için WhatsApp'tan koçuna doğrudan erişim",
          "Soru girişin düşerse koçun fark eder ve sana yazar",
          "Veli bilgilendirmesi — isteğe bağlı, somut verilerle",
          "Uygulamadaki tüm veriye koçun da senin de aynı anda erişimi",
        ],
      },
      {
        key: "dayaniklilik",
        title: "Zihinsel dayanıklılık",
        description:
          "Uzun maratonun asıl sınavı: kötü bir denemeden sonra devam edebilmek.",
        items: [
          "Kötü deneme sonrası toparlanma: sayıyı okumayı öğrenmek",
          "Sınav kaygısıyla başa çıkma ve deneme günü provası",
          "Gerçekçi hedef belirleme — hayal değil, sıralamaya karşılık gelen net",
          "Odaklanma ve düzenli çalışma alışkanlığının kurulması",
          "Çalışma serisi ve haftalık ilerleme takibiyle görünür motivasyon",
        ],
      },
    ],
    aiTitle: "Koçun TYT-AYT dengesini kurarken yalnız değil",
    aiDescription:
      "Görüşme notu ve haftalık program taslağı sistemden çıkar; koçun bunları alanına ve son denemelerine göre onaylar ya da değiştirir. Böylece görüşme süresi \"ne yaptın\" sorusuna değil, stratejiye harcanır.",
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
    pillars: [
      {
        key: "akademik",
        title: "Akademik destek",
        description:
          "Hangi konuda takıldığı velinin de öğrencinin de gözünden kaçmaz.",
        items: [
          "Sözel ve sayısal bölümler için dengeli, kazanım bazlı çalışma",
          "Her denemenin konu konu analizi ve yanlış haritası",
          "Doğru/yanlış/boş ayrımıyla günlük soru takibi",
          "Ders bazında doğruluk yüzdesi — hız mı, dikkat mi sorun",
          "Eksik konuya hangi kaynaktan çalışılacağının netleştirilmesi",
        ],
      },
      {
        key: "plan",
        title: "Plan ve strateji",
        description:
          "İlk aksamada çöken hayali programlar yerine, gerçekten uygulanabilir olan.",
        items: [
          "8. sınıf temposuna uyan, okulu aksatmayan haftalık program",
          "Okul sınavları ve LGS hazırlığı arasında denge",
          "Gün gün işaretlenen görev listesi — akşam ne yapacağı belli",
          "Düzenli deneme takvimi ve deneme sonrası tekrar planı",
          "Yaz/ara tatili gibi dönemler için ayrı planlama",
        ],
      },
      {
        key: "gorusme",
        title: "Görüşme ve veli iletişimi",
        description:
          "Veli sürecin dışında kalmaz; ama öğrencinin üstünde baskı da kurulmaz.",
        items: [
          "Haftalık birebir görüşme — 8. sınıfın diliyle, sabırla",
          "Veliye düzenli ve somut bilgilendirme (net, soru sayısı, düzen)",
          "WhatsApp'tan koçuna doğrudan erişim",
          "Çalışma düşerse koçun önce öğrenciyle konuşur",
          "Uygulamadaki takip verisine velinin de erişimi (isteğe bağlı)",
        ],
      },
      {
        key: "dayaniklilik",
        title: "Motivasyon ve kaygı",
        description:
          "Bu yaşta en büyük risk tükenmek; tempo sürdürülebilir tutulur.",
        items: [
          "Sınav kaygısıyla başa çıkma ve deneme günü provası",
          "Kötü deneme sonrası toparlanma — tek bir sonuç her şey değil",
          "Gerçekçi hedef belirleme ve hedefi birlikte güncelleme",
          "Ekran/dikkat dağıtıcı yönetimi ve çalışma ortamı düzeni",
          "Çalışma serisi takibiyle görünür ilerleme",
        ],
      },
    ],
    aiTitle: "Ne yapıldığı da neden yapıldığı da görünür",
    aiDescription:
      "Görüşmede konuşulanlar yazıya döner, haftalık program taslağı hazır gelir; koçun 8. sınıfın temposunu bilerek onaylar. Sen de velin de sürecin neresinde olduğunuzu somut olarak görürsünüz.",
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
    pillars: [
      {
        key: "akademik",
        title: "Akademik destek",
        description:
          "Kıt zamanı en çok net getiren konuya harcarsın; gerisi beklemeye alınır.",
        items: [
          "KPSS'de 93 puanla 712. olmuş bir koçla birebir çalışma",
          "Her denemenin konu konu analizi ve net kaybı haritası",
          "Doğru/yanlış/boş ayrımıyla günlük soru takibi",
          "GY-GK ve alan (Eğitim Bilimleri / ÖABT) dengesinin kurulması",
          "Güncel bilgiler ve mevzuat gibi hızlı puan getiren alanlarda öncelik",
        ],
      },
      {
        key: "plan",
        title: "Plan ve strateji",
        description:
          "Çalışırken hazırlananın programı, tam zamanlı çalışanınkine benzemez.",
        items: [
          "Mesai/okul temponu tanıyan, haftalık yeniden kurulan program",
          "Sınırlı saatte en yüksek verim için konu önceliklendirme",
          "Atama hedefine (puan/sıralama) göre geri planlama",
          "Deneme takvimi ve deneme sonrası tekrar döngüsü",
          "Tercih dönemi için puan-kadro eşleştirme desteği",
        ],
      },
      {
        key: "gorusme",
        title: "Görüşme ve iletişim",
        description:
          "Yetişkin bir adaya yetişkin gibi davranan, düzenli ve net bir iletişim.",
        items: [
          "Haftalık birebir görüşme — konuşulanlar not edilir, takip edilir",
          "Çözemediğin soru için WhatsApp'tan koçuna doğrudan erişim",
          "Çalışma düşerse koçun fark eder ve nedenini birlikte çözersiniz",
          "Programın esnetilmesi gereken yoğun haftalarda hızlı revizyon",
          "Uygulamadaki tüm veriye koçun da senin de aynı anda erişimi",
        ],
      },
      {
        key: "dayaniklilik",
        title: "Zihinsel dayanıklılık",
        description:
          "İkinci, üçüncü denemede olanların en çok ihtiyaç duyduğu şey.",
        items: [
          "Uzun süredir hazırlananlar için tükenmişlikle başa çıkma",
          "Sınav kaygısı ve deneme günü provası",
          "Kötü deneme sonrası toparlanma ve stratejiyi soğukkanlı gözden geçirme",
          "İş/okul ile hazırlık arasındaki suçluluk hissini yönetme",
          "Çalışma serisi ve haftalık ilerleme takibiyle görünür motivasyon",
        ],
      },
    ],
    aiTitle: "Kıt zamanın tamamı çalışmaya kalsın",
    aiDescription:
      "Görüşme notu ve program taslağı sistemden çıkar; koçun mesai temponu bilerek onaylar. Not tutma ve hatırlama yükü senden de koçundan da kalkar.",
    courseName: "KPSS Koçluğu",
    courseDescription:
      "Çalışan ve öğrenci adaylar için birebir online KPSS koçluğu: gerçekçi program, deneme analizi, net takibi ve atama hedefine göre puan stratejisi.",
  },
};

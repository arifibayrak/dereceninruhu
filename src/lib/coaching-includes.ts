/**
 * "Her pakette olan" listesi — /fiyatlar sayfasının kapsam bölümü.
 *
 * Saf veri modülü. Neden ayrı bir liste: paket kartlarındaki `features`
 * yöneticinin CMS'ten düzenlediği KISA satış maddeleridir; buradaki liste ise
 * hizmetin değişmeyen çekirdeğidir. Öğrencinin geri bildirimi (Görsel 13)
 * "ne aldığımı tam anlayamıyorum" idi — cevabı sıfat değil, envanter.
 *
 * Marka kuralı: abartı yok. Her madde koçluk sürecinde gerçekten olan,
 * gerekirse hesabı verilebilecek bir şey (bkz. AGENTS.md).
 */

export type IncludeGroup = {
  title: string;
  items: string[];
};

export const COACHING_INCLUDES: IncludeGroup[] = [
  {
    title: "Her hafta tekrarlananlar",
    items: [
      "Birebir koçluk görüşmesi (online, planlı saat)",
      "Sana özel hazırlanan, gün gün işaretlenen haftalık program",
      "Geçen haftanın soru/net verisinin koçunla birlikte gözden geçirilmesi",
      "Programın gerçek temponuza göre revize edilmesi",
    ],
  },
  {
    title: "Takip ve ölçüm",
    items: [
      "Günlük soru takibi — doğru, yanlış ve boş ayrımıyla",
      "Ders bazında doğruluk yüzdesi ve haftalık soru hacmi tablosu",
      "Her denemenin net hesabı ve konu konu analizi",
      "Net gelişim grafiği — ilk günden bugüne",
      "Eksik konu haritası ve kaynak takibi",
      "Çalışma süresi kronometresi",
    ],
  },
  {
    title: "İletişim",
    items: [
      "Çözemediğin soru ve acil durumlar için WhatsApp erişimi",
      "Uzun süre giriş yapmadığında koçunun proaktif takibi",
      "Veli bilgilendirmesi (isteğe bağlı, somut verilerle)",
      "Görüşme notlarının kayıt altına alınması ve takibi",
    ],
  },
  {
    title: "Araçlar ve erişim",
    items: [
      "Derecenin Ruhu uygulamasına sınırsız erişim (telefon ve bilgisayar)",
      "Koçunun sana özel paylaştığı kaynak ve içerik kütüphanesi",
      "Deneme sonuçlarının geçmişe dönük arşivi",
      "Ücretsiz kaynak merkezine ve net hesaplama aracına erişim",
    ],
  },
];

/** Hizmete DAHİL OLMAYANLAR — beklenti yönetimi, güven artırır. */
export const COACHING_EXCLUDES: string[] = [
  "Ders anlatımı / özel ders (koçluk, öğretmenlik değildir)",
  "Kitap ve yayın satışı — kaynak önerilir, satılmaz",
  "Sınav sonucu garantisi",
];

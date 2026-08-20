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
      "Otomatik içgörüler: net trendi, düşen soru hacmi ve eksik konu uyarıları",
    ],
  },
  {
    title: "İletişim",
    items: [
      "Çözemediğin soru ve acil durumlar için WhatsApp erişimi",
      "Uzun süre giriş yapmadığında koçunun proaktif takibi",
      "Veli bilgilendirmesi (isteğe bağlı, somut verilerle)",
      "Görüşme notlarının kayıt altına alınması — konuşulanlar özet ve takip maddelerine dönüşür",
    ],
  },
  {
    title: "Araçlar ve erişim",
    items: [
      "Derecenin Ruhu uygulamasına sınırsız erişim (telefon ve bilgisayar)",
      "Koçunun sana özel paylaştığı kaynak ve içerik kütüphanesi",
      "Deneme sonuçlarının geçmişe dönük arşivi",
      "Görüşme sonrası yazılı özet ve takip önerileri (koç onayından geçer)",
      "Ücretsiz kaynak merkezine erişim — herkese açık",
    ],
  },
];

/**
 * Hizmete DAHİL OLMAYANLAR — beklenti yönetimi, güven artırır.
 *
 * Özel ders artık AYRI bir ürün olarak satılıyor, ama konumlandırma
 * değişmedi: koçluk hâlâ ders anlatımı değildir. Madde "yoktur" demiyor,
 * "bu pakete dahil değil, ayrıca alınır" diyor — abartısız ve doğru.
 */
export const COACHING_EXCLUDES: string[] = [
  "Ders anlatımı (koçluk öğretmenlik değildir) — özel ders ayrı bir hizmet olarak alınabilir",
  "Kitap ve yayın satışı — kaynak önerilir, satılmaz",
  "Sınav sonucu garantisi",
  "Yapay zekânın koç yerine geçmesi — öneriyi AI çıkarır, kararı koçun verir",
];

/**
 * Özel ders paketinin kapsamı. Koçluğun envanterinden AYRI durur: iki farklı
 * ürün, iki farklı söz. Kısa tutuluyor — özel ders zaten tanıdık bir hizmet,
 * anlatılması gereken tek şey uygulamada nasıl takip edildiği.
 */
export const PRIVATE_LESSON_INCLUDES: string[] = [
  "Alanında uzman öğretmenle birebir ders (online)",
  "Konular koçunun tespit ettiği eksiklere göre seçilir",
  "Her ders tarih, ders adı ve süresiyle uygulamaya işlenir",
  "Kalan ders hakkını uygulamadan her an görürsün",
  "Ders sonrası öğretmen notu (paylaşılırsa) öğrenci ekranında görünür",
];

/** Özel derste OLMAYANLAR — koçlukla karışmasın diye. */
export const PRIVATE_LESSON_EXCLUDES: string[] = [
  "Koçluk paketinin yerine geçmesi — program ve takip yine koçtan gelir",
  "Sınırsız ders — paket kaç saatse o kadar",
  "Kullanılmayan saatin iadesi (dönem sonuna kadar kullanılır)",
];

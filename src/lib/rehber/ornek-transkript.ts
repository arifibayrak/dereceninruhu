/**
 * Tur için örnek görüşme transkripti.
 *
 * Canlı transkript mikrofon ister; turda kayıt başlatmak doğru olmaz.
 * Bu yüzden Canlı adımları, tamamlanmış kurgusal bir görüşme üstünde
 * anlatılıyor: konuşma dökümü, AI özeti ve onay bekleyen öneriler.
 * Hiçbir şey kaydedilmez.
 */

export const ORNEK_TRANSKRIPT_BASE = "/koc/tur/ornek-transkript";

export const ornekGorusme = {
  ogrenci: "Zeynep Kaya",
  tarih: "18 Haz Çarşamba, 19:30",
  sure: "22 dk",
  kaynak: "Canlı (mikrofon)",
  durum: "Çıkarıldı",
};

export const ornekOzet =
  "Zeynep geometriye ayırdığı süreyi artırmış ama katı cisimlerde tıkanıyor. " +
  "Hafta içi akşamları verimsiz geçiyor; sabah çalışmayı denemek istiyor. " +
  "Son denemede paragrafta zaman yönetimi sorunu var. Önümüzdeki hafta " +
  "geometri ağırlıklı, sabah bloklu bir program üzerinde anlaşıldı.";

export const ornekKonusma: { kim: "koc" | "ogrenci"; metin: string }[] = [
  { kim: "koc", metin: "Zeynep merhaba, bu hafta nasıl geçti?" },
  {
    kim: "ogrenci",
    metin:
      "İyiydi ama geometride zorlandım. Katı cisimlerde soru çözerken sürekli takılıyorum.",
  },
  {
    kim: "koc",
    metin: "Kaç soru çözdün geometriden? Deneme dışında kastediyorum.",
  },
  {
    kim: "ogrenci",
    metin: "Sanırım 190 civarı. Limit Geometri'den çalışıyorum, konu anlatımı iyi.",
  },
  {
    kim: "koc",
    metin: "Peki akşamları verimin nasıl? Geçen görüşmede yorgunluktan bahsetmiştin.",
  },
  {
    kim: "ogrenci",
    metin:
      "Akşam 9'dan sonra hiç olmuyor. Sabah kalkıp çalışmayı denemek istiyorum aslında.",
  },
  {
    kim: "koc",
    metin:
      "Deneyelim. Önümüzdeki hafta sabah 07:00–09:00 arası geometri bloğu koyalım, günde 30 soru.",
  },
  {
    kim: "ogrenci",
    metin: "Olur. Bir de son denemede paragrafta süre yetmedi, 12 soru boş kaldı.",
  },
  {
    kim: "koc",
    metin:
      "Paragrafta hız çalışması ekleyelim — her gün 20 soru, süre tutarak. Cumartesi genel tekrar.",
  },
];

/** AI çıkarımı — koç onaylayana kadar hiçbiri yazılmaz. */
export const ornekOneriler: {
  tur: string;
  ozet: string;
  guven: number;
  durum: "Öneri" | "Onaylandı";
}[] = [
  {
    tur: "Soru takibi",
    ozet: "Geometri · bu hafta 190 soru (öğrencinin beyanı)",
    guven: 82,
    durum: "Öneri",
  },
  {
    tur: "Program görevi",
    ozet: "Geometri — katı cisimler · Pzt–Cum · günde 30 soru · sabah bloğu",
    guven: 91,
    durum: "Öneri",
  },
  {
    tur: "Program görevi",
    ozet: "Türkçe — paragraf hız çalışması · her gün 20 soru, süre tutarak",
    guven: 88,
    durum: "Öneri",
  },
  {
    tur: "Konu ilerlemesi",
    ozet: "Geometri — çemberde açı: bitti olarak işaretle",
    guven: 64,
    durum: "Öneri",
  },
  {
    tur: "Görüşme notu",
    ozet: "Akşam verimi düşük; sabah çalışma denenecek. Paragrafta süre sorunu.",
    guven: 95,
    durum: "Onaylandı",
  },
];

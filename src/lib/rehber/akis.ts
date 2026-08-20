import type { Flow } from "@/lib/rehber/akis-types";

/**
 * Sistemin uçtan uca akışları.
 *
 * Roller arası devir noktaları `gate` ile işaretli: o adım olmadan sonraki
 * adım gerçekleşmez. Buton etiketleri uygulamadaki dizelerle birebirdir.
 */
export const AKISLAR: Flow[] = [
  /* ————————————————— 1. Talepten kayda ————————————————— */
  {
    id: "talepten-kayda",
    title: "Talepten kayda",
    description:
      "Siteye gelen bir talebin öğrenci kaydına dönüşene kadar izlediği yol.",
    cadence: "Her yeni öğrenci için bir kez",
    steps: [
      {
        id: "talep",
        actor: "sistem",
        title: "Siteden talep gelir",
        where: "/iletisim",
        summary:
          "Ziyaretçi ön görüşme formunu doldurur; dönem doluysa bekleme listesi formu açılır.",
        outcome:
          "Lead havuzuna ya da bekleme listesine yeni bir kayıt düşer; koç panelinde uyarı bandı belirir.",
        section: "leadler-bekleme",
      },
      {
        id: "lead-temas",
        actor: "koc",
        title: "Koç talebe dönüş yapar",
        where: "/koc/leadler",
        summary:
          "Lead kartından WhatsApp'a geçilir, görüşme sonrası durum güncellenir.",
        buttons: [
          {
            label: "WhatsApp",
            does: "Kişiselleştirilmiş ilk temas mesajıyla sohbeti açar.",
          },
          {
            label: "Lead durumu",
            does: "Yeni → Görüşüldü → Kayıt/Kayıp akışını ilerletir.",
          },
        ],
        outcome: "Lead'in durumu güncellenir; havuz gerçeği yansıtır.",
        section: "leadler-bekleme",
      },
      {
        id: "ogrenciye-cevir",
        actor: "koc",
        title: "Kayda çevrilir",
        where: "/koc/ogrenciler/yeni",
        summary:
          "\"Öğrenciye çevir\" formu ad, telefon ve sınav bilgisiyle ön-doldurulmuş açar.",
        buttons: [
          {
            label: "Öğrenciye çevir",
            does: "Yeni öğrenci formuna bilgileri taşıyarak gider.",
          },
          {
            label: "Öğrenciyi oluştur",
            does: "Öğrenci ve kaydı (enrollment) yaratır, davet kodu üretir.",
          },
        ],
        outcome:
          "Öğrenci kadroya girer ve kendisini oluşturan koça atanır. Davet linki hazırdır.",
        section: "yeni-ogrenci",
      },
    ],
  },

  /* ————————————————— 2. Hesabın açılması ————————————————— */
  {
    id: "hesap-acilis",
    title: "Öğrencinin hesabı açılır",
    description:
      "Davet linkinden ilk girişe kadar. Öğrencinin kimliği telefon numarasıdır.",
    cadence: "Her öğrenci için bir kez",
    steps: [
      {
        id: "davet",
        actor: "koc",
        title: "Davet gönderilir",
        where: "/koc/ogrenciler",
        summary: "Davet linki kopyalanır ya da doğrudan WhatsApp'tan iletilir.",
        buttons: [
          { label: "Linki kopyala", does: "Davet adresini panoya alır." },
          {
            label: "WhatsApp'tan gönder",
            does: "Hazır mesajla öğrencinin sohbetini açar.",
          },
        ],
        outcome: "Öğrencide kendi hesabını açabileceği tek kullanımlık link olur.",
        gate: "Davet gönderilmeden öğrenci sisteme giremez.",
        section: "davet-ve-pin",
      },
      {
        id: "pin",
        actor: "ogrenci",
        title: "Öğrenci PIN belirler",
        where: "/katil",
        summary:
          "Telefon numarası yazılır; sistem kaydı tanır ve PIN belirlemeye yönlendirir.",
        buttons: [
          { label: "Devam et", does: "Numarayı kontrol eder ve adımı seçer." },
          {
            label: "Başlayalım",
            does: "PIN'i kaydeder, hesabı açar ve doğrudan giriş yapar.",
          },
        ],
        outcome: "Hesap aktifleşir; öğrenci Bugün ekranına düşer.",
        section: "hesap-ve-giris",
      },
      {
        id: "cal",
        actor: "koc",
        title: "Koç görüşme takvimini bağlar",
        where: "/koc/profil",
        summary:
          "Cal.com bağlantısı profile girilir; öğrenciler randevuyu uygulama içinden alır.",
        buttons: [
          {
            label: "İletişimi kaydet",
            does: "Telefon, Telegram, Instagram, Cal linki ve IBAN'ı kaydeder.",
          },
        ],
        outcome: "Öğrencinin Görüşmeler ekranında takvim görünür hale gelir.",
        gate:
          "Cal linki girilmezse öğrenci uygulamadan randevu alamaz — bu adım atlanırsa akış burada durur.",
        section: "cal-takvimi",
      },
      {
        id: "randevu",
        actor: "ogrenci",
        title: "Öğrenci ilk görüşmeyi alır",
        where: "/ogrenci/gorusmeler",
        summary: "Takvimden uygun saat seçilir ve planlandı olarak işaretlenir.",
        buttons: [
          {
            label: "Görüşmemi planladım",
            does: "Kaydı planlandı olarak imler; koç listesinden düşer.",
          },
        ],
        outcome: "Koçun 'Görüşmesini planlamayanlar' listesinden çıkar.",
        section: "gorusmeler",
      },
    ],
  },

  /* ————————————————— 3. Haftalık döngü ————————————————— */
  {
    id: "haftalik-dongu",
    title: "Haftalık koçluk döngüsü",
    description:
      "Sistemin kalbi. Görüşmeden programa, programdan günlük takibe kadar her hafta tekrar eder.",
    cadence: "Her hafta — Pazartesi başlar, Pazar biter",
    steps: [
      {
        id: "gorusme",
        actor: "koc",
        title: "Görüşme yapılır",
        where: "/koc/gorusmeler",
        summary:
          "Görüşme sonrası sonuç işaretlenir; istenirse o görüşmeden program oluşturulur.",
        buttons: [
          { label: "Yapıldı", does: "Görüşmeyi tamamlandı olarak kapatır." },
          {
            label: "Program oluştur",
            does: "Gelecek hafta için boş bir program taslağı açar.",
          },
        ],
        outcome: "Haftanın taslak programı oluşur.",
        section: "gorusme-planlama",
      },
      {
        id: "program-yaz",
        actor: "koc",
        title: "Program yazılır",
        where: "/koc/ogrenciler",
        summary:
          "Ders × konu ızgarasına görevler eklenir; istenirse AI taslak önerir ya da geçen hafta kopyalanır.",
        buttons: [
          { label: "Görev ekle", does: "Güne ve derse bir konu ekler." },
          {
            label: "Geçen haftadan kopyala",
            does: "Önceki haftanın görevlerini bu haftaya taşır.",
          },
          {
            label: "Taslak öner",
            does: "Öğrencinin verisine göre AI konu önerir; sen onaylamadan yazılmaz.",
          },
        ],
        outcome: "İlk konu eklenir eklenmez program öğrenciye açılır.",
        section: "program-olustur",
      },
      {
        id: "yayinla",
        actor: "koc",
        title: "Program kendiliğinden yayınlanır",
        summary:
          "Ayrı bir yayınlama adımı yoktur: koç ilk konuyu eklediği an program öğrencinin ekranına düşer. Yalnız öğrencinin kendi önerdiği taslak koç onayı bekler.",
        buttons: [
          {
            label: "Onayla",
            does: "Öğrenci önerisini resmileştirir; öğrenci artık konuları işaretleyebilir.",
          },
        ],
        outcome: "Öğrencinin Program sekmesinde haftanın görevleri görünür.",
        gate:
          "Devir noktası artık ilk konudur: hafta boşken öğrenci 'Program henüz hazır değil' görür.",
        section: "program-yayinla",
      },
      {
        id: "gunluk",
        actor: "ogrenci",
        title: "Öğrenci gününü işler",
        where: "/ogrenci",
        summary:
          "Görevler işaretlenir, çözülen sorular girilir, çalışma süresi tutulur.",
        buttons: [
          {
            label: "Tekrar dene",
            does: "Soru girişi kendiliğinden kaydedilir; yalnız bağlantı koptuğunda bu düğme çıkar.",
          },
          { label: "Başla", does: "Kronometreyi çalıştırır." },
          { label: "Bitir", does: "Oturumu bugünün çalışma süresine ekler." },
        ],
        outcome:
          "Soru, süre ve görev verisi birikir; koçun panelinde anında görünür.",
        section: "hizli-soru-girisi",
      },
      {
        id: "izle",
        actor: "koc",
        title: "Koç haftayı izler",
        where: "/koc",
        summary:
          "Panelde giriş yapmayanlar, analiz bekleyen denemeler ve gecikmiş ödemeler tek ekranda toplanır.",
        buttons: [
          {
            label: "WhatsApp",
            does: "3+ gündür giriş yapmayan öğrenciyi hazır mesajla dürter.",
          },
        ],
        outcome: "Sapmalar hafta bitmeden yakalanır; döngü baştan başlar.",
        section: "panel",
      },
    ],
  },

  /* ————————————————— 4. Ölçme döngüsü ————————————————— */
  {
    id: "olcme",
    title: "Deneme ve analiz döngüsü",
    description:
      "Deneme sonucunun bir sonraki haftanın programını nasıl beslediği.",
    cadence: "Her deneme sonrası",
    steps: [
      {
        id: "deneme-gir",
        actor: "ogrenci",
        title: "Deneme girilir",
        where: "/ogrenci/denemeler/yeni",
        summary:
          "Doğru ve yanlış sayıları yazılır; net otomatik hesaplanır ve o anki formülle dondurulur.",
        buttons: [
          {
            label: "Denemeyi kaydet",
            does: "Denemeyi ve ders bazlı sonuçları yazar, netleri hesaplar.",
          },
        ],
        outcome:
          "Net gelişim grafiğine yeni bir nokta düşer; koçun panelinde 'analiz bekliyor' olarak listelenir.",
        section: "deneme-ekleme",
      },
      {
        id: "analiz",
        actor: "ogrenci",
        title: "Konu bazlı analiz yapılır",
        summary:
          "Hangi konudan kaç soru kaçırıldığı girilir — yanlış ve boşların toplamı.",
        buttons: [
          {
            label: "Analizi kaydet",
            does: "Konu eksiklerini yazar ve denemeyi 'analiz yapıldı' işaretler.",
          },
        ],
        outcome: "Eksik konu haritası ve ısı haritası güncellenir.",
        gate:
          "Analiz girilmeden eksik haritası oluşmaz; deneme yalnız bir net sayısı olarak kalır.",
        section: "deneme-analizi",
      },
      {
        id: "zayif",
        actor: "koc",
        title: "Zayıf konular okunur",
        summary:
          "Kokpitteki Konular sekmesinde tekrarlayan eksikler öne çıkar.",
        outcome:
          "Bir sonraki haftanın programı veriye dayanır — döngü programa geri bağlanır.",
        section: "konular-kaynaklar",
      },
    ],
  },

  /* ————————————————— 5. Para akışı ————————————————— */
  {
    id: "para",
    title: "Para akışı",
    description:
      "Ücret planından tahsilata. Tutarlar her yerde kuruş hassasiyetinde saklanır.",
    cadence: "Aylık",
    steps: [
      {
        id: "plan",
        actor: "koc",
        title: "Ücret planı kurulur",
        summary:
          "Tutar, dönem ve vade günü belirlenir; otomatik yenileme açık bırakılabilir.",
        buttons: [
          {
            label: "Kaydet",
            does: "Ücret planını yazar; faturalar bu tutarı öntanımlı alır.",
          },
        ],
        outcome: "Öğrencinin faturalandırma kuralı tanımlanır.",
        section: "muhasebe",
      },
      {
        id: "fatura",
        actor: "koc",
        title: "Fatura kesilir",
        summary:
          "Dönem faturası elle kesilir; yönetici toplu olarak da çalıştırabilir.",
        buttons: [
          { label: "Fatura kes", does: "Dönem için yeni fatura oluşturur." },
        ],
        outcome:
          "Öğrencinin Ödemeler ekranında fatura ve kalan bakiye görünür.",
        section: "muhasebe",
      },
      {
        id: "bildirim",
        actor: "ogrenci",
        title: "Öğrenci ödemeyi bildirir",
        where: "/ogrenci/odemeler",
        summary:
          "Havale yapıldıktan sonra tutar, tarih ve dekont notu bildirilir.",
        buttons: [
          {
            label: "Bildirimi gönder",
            does: "Bekleyen bir ödeme bildirimi oluşturur.",
          },
        ],
        outcome:
          "Bildirim koçun Muhasebe ekranına düşer. Bakiye HENÜZ değişmez.",
        gate:
          "Bildirim bir ödeme kaydı değildir — koç onaylayana kadar bakiyeye yansımaz.",
        section: "odemeler",
      },
      {
        id: "onay",
        actor: "koc",
        title: "Koç bildirimi onaylar",
        where: "/koc/muhasebe",
        summary:
          "Tutar doğruysa onaylanır; yanlışsa reddedilip elle ödeme girilir.",
        buttons: [
          {
            label: "Onayla",
            does: "Bildirimi gerçek ödeme kaydına çevirir ve faturaya işler.",
          },
          {
            label: "Reddet",
            does: "Bildirimi kapatır; tutar düzeltilecekse elle 'Ödeme al' kullanılır.",
          },
        ],
        outcome: "Bakiye güncellenir; gecikme takibinden düşer.",
        section: "odeme-bildirimleri",
      },
    ],
  },
];

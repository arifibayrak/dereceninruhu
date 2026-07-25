import type { Guide } from "@/lib/rehber/types";

export const kocRehberi: Guide = {
  basePath: "/koc/rehber",
  title: "Koç rehberi",
  description:
    "Koç panelindeki her ekranı, her sekmeyi ve her butonu anlatır. Aradığın işlemi arama kutusundan bulabilirsin.",
  sections: [
    /* ------------------------------------------------------------------ */
    /*  Başlangıç                                                          */
    /* ------------------------------------------------------------------ */
    {
      id: "nasil-kullanilir",
      no: 1,
      chapter: "Başlangıç",
      title: "Bu rehber nasıl kullanılır",
      lead: "Rehberde arama, bölüm listesi ve okuma takibi var. Aradığın butonu yazınca ilgili bölüm anında süzülür.",
      where: "/koc/rehber",
      keywords: ["arama", "okudum", "bölümler", "ilerleme", "yönetici"],
      blocks: [
        {
          kind: "para",
          text: "Bu rehber koç panelindeki ekranları iş sırasına göre anlatır: kadro, takip, program, görüşme, iletişim, para. Baştan sona okuman gerekmez — bir butonun ne yaptığını merak ettiğinde arama kutusuna etiketini yaz, eşleşen bölüm listede kalır. Her koç sayfasının sağ üstündeki kitap simgesi de seni o ekranın bölümüne getirir.",
        },
        {
          kind: "steps",
          items: [
            "Arama kutusuna aradığın buton, ekran ya da terimi yaz (örn. \"PIN\", \"Yayınla\", \"net\").",
            "Listeden bölüme tıkla; sayfa o bölüme kayar.",
            "Bölümü bitirince en alttaki \"Okudum\" imine bas — ilerleme çubuğu dolar.",
            "Telefonda bölüm listesi için üst şeritteki \"Bölümler\" düğmesini kullan.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Rehberde ara — buton, ekran, terim…",
              where: "Yan sütunda (geniş ekran) ya da yapışkan üst şeritte",
              does: "Bölüm başlığı, özeti ve gövdesinde arar; kaç bölümün eşleştiğini gösterir.",
            },
            {
              label: "Bölümler",
              where: "Dar ekranda arama kutusunun sağında",
              does: "Bölüm listesini soldan çekmece olarak açar.",
            },
            {
              label: "Okudum",
              where: "Her bölümün sonunda",
              does: "Bölümü okundu işaretler; tekrar basınca geri alır. İlerleme bu cihazda saklanır.",
            },
            {
              label: "İlerlemeyi sıfırla",
              where: "İlerleme çubuğunun sağında",
              does: "Tüm okundu imlerini temizler.",
            },
            {
              label: "Ekrana git",
              where: "Bölüm başlığının altında",
              does: "Anlatılan ekranı yeni gezinmeyle açar (yalnız rotası olan bölümlerde).",
            },
          ],
        },
        {
          kind: "note",
          text: "Bu rehber normal koç hesabı içindir. Başvurular, içe aktarma, site ayarları, ekip yönetimi ve mutabakat gibi yalnız yöneticiye açık ekranlar ayrı bir yönetici rehberinde anlatılır — o ekranlarla ilgili bir ihtiyacın olursa yöneticine söyle.",
        },
      ],
    },
    {
      id: "panel-haritasi",
      no: 2,
      chapter: "Başlangıç",
      title: "Panelin haritası",
      lead: "Üst gezinmede 8 doğrudan bağlantı ve 3 açılır grup var. Sağ altta yüzen Koç Asistanı her sayfada seninle.",
      where: "/koc",
      keywords: ["gezinme", "menü", "kısayol", "g t", "asistan", "navigasyon"],
      blocks: [
        {
          kind: "para",
          text: "Üst şeritte sık kullanılan sayfalar doğrudan durur; ilişkili sayfalar üç açılır grupta toplanır. Dar ekranda şerit yatay kayar. Aktif sayfa koyu zeminle vurgulanır. Koç hesabında yalnız sana açık bağlantılar görünür; yöneticiye özel sayfalar menüde hiç listelenmez.",
        },
        {
          kind: "steps",
          items: [
            "Günlük akış için soldan sağa ilerle: Panel → Öğrenciler → Denemeler.",
            "Lead ve bekleme listesi için \"Talepler\" grubunu aç.",
            "İçerik kütüphanesi ve blog için \"İçerik\" grubunu aç.",
            "Profil ve hesap ayarları için \"Ayarlar\" grubunu aç.",
            "Herhangi bir koç sayfasında önce \"g\" sonra 1 saniye içinde \"t\" tuşuna bas — canlı transkript sayfası açılır.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Panel", where: "Üst gezinme", does: "Günün özeti: hatırlatmalar, bekleyen analizler, taslak programlar, yaklaşan görüşmeler." },
            { label: "Öğrenciler", where: "Üst gezinme", does: "Sana atanan öğrencilerin kadro tablosu." },
            { label: "Denemeler", where: "Üst gezinme", does: "Haftalık deneme panosu — tüm öğrencilerinin netleri tek tabloda." },
            { label: "Duyuru", where: "Üst gezinme", does: "Toplu WhatsApp mesajı hazırlayıp tek tek gönderme ekranı." },
            { label: "Asistan", where: "Üst gezinme", does: "Koç Asistanı sohbeti (tam sayfa)." },
            { label: "Görüşmeler", where: "Üst gezinme", does: "Tüm planlı ve geçmiş koçluk görüşmeleri." },
            { label: "Canlı", where: "Üst gezinme", does: "Canlı (mikrofon) transkript sayfası." },
            { label: "Muhasebe", where: "Üst gezinme", does: "Gelir özeti, faturalar, ödemeler, bekleyen ödeme bildirimleri." },
            { label: "Talepler", where: "Üst gezinme (açılır grup)", does: "Leadler ve Bekleme sayfalarını açar." },
            { label: "İçerik", where: "Üst gezinme (açılır grup)", does: "İçerik kütüphanesi ve Blog sayfalarını açar." },
            { label: "Ayarlar", where: "Üst gezinme (açılır grup)", does: "Profil ve Ayarlar sayfalarını açar." },
            { label: "Koç Asistanı", where: "Sağ alt köşede yüzen düğme", does: "Asistan panelini sayfadan ayrılmadan açar; kapatınca sohbet korunur." },
            { label: "Rehber — bu ekran", where: "Başlıkta, kitap simgesi", does: "Bulunduğun ekranın rehber bölümünü açar." },
          ],
        },
        {
          kind: "tip",
          text: "\"g\" ardından \"t\" kısayolu form alanlarında yazarken çalışmaz — normal yazımını bozmaz. Görüşme başlarken en hızlı transkript yolu budur.",
        },
      ],
    },
    {
      id: "panel",
      no: 3,
      chapter: "Başlangıç",
      title: "Panel: günü nereden başlatırsın",
      lead: "Panel sabah rutininin ekranı: kim geride kaldı, hangi deneme analiz bekliyor, hangi program taslakta, bu hafta kimlerle görüşeceksin.",
      where: "/koc",
      keywords: ["dashboard", "kokpit", "hatırlat", "analiz bekleyen", "taslak program"],
      blocks: [
        {
          kind: "para",
          text: "Panel dört soruyu tek bakışta cevaplar: kim 3+ gündür soru girmedi, hangi denemelerin analizi yapılmadı, hangi haftalık programlar hâlâ taslak, önümüzdeki 7 günde hangi görüşmeler var. Üstteki sayı kartları kadronun haftalık nabzını gösterir; yeni lead ya da bekleme listesi kaydı varsa üstte renkli şerit çıkar.",
        },
        {
          kind: "steps",
          items: [
            "\"Bugün hatırlat\" kartındaki öğrencileri gözden geçir; WhatsApp düğmesiyle hazır mesajla dürt.",
            "\"Analiz bekleyen denemeler\" kartından \"Analiz gir\" ile deneme analizine geç.",
            "\"Yayınlanmayı bekleyen programlar\" kartındaki taslakları incele — öğrenci önerileri üstte durur.",
            "\"Yaklaşan görüşmeler (7 gün)\" kartıyla haftanı planla.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Yeni öğrenci", where: "Sayfa başlığının sağında", does: "Yeni öğrenci formunu açar." },
            { label: "WhatsApp", where: "\"Bugün hatırlat\" kartında, satır sonunda", does: "Öğrenciye hazır soru-girişi hatırlatma mesajıyla WhatsApp sohbeti açar." },
            { label: "Analiz gir", where: "\"Analiz bekleyen denemeler\" kartında, satır sonunda", does: "O denemenin konu-eksik giriş ekranını açar." },
            { label: "Analiz bekliyor", where: "\"Analiz gir\"in yanında", does: "Tek dokunuşla denemeyi \"Analiz yapıldı\" olarak işaretler (analiz girmeden kapatmak için)." },
            { label: "Tüm görüşmeler →", where: "Görüşme kartının altında", does: "Görüşmeler sayfasını açar." },
            { label: "Gecikmiş ödeme", where: "Sayı kartlarının sonuncusu", does: "Tıklanınca Muhasebe sayfasını açar." },
          ],
        },
        {
          kind: "tip",
          text: "Sayı kartlarındaki \"Analiz bekleyen\" sıfırlanana kadar deneme döngün kapanmamış demektir: deneme girildi, ama öğrenciyle analizi yapılmadı.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Kadro                                                              */
    /* ------------------------------------------------------------------ */
    {
      id: "ogrenciler",
      no: 4,
      chapter: "Kadro",
      title: "Öğrenciler listesi",
      lead: "Kadro tablosu: her öğrencinin haftalık sorusu, çalışma süresi, ödeme durumu, son girişi ve davet durumu tek satırda.",
      where: "/koc/ogrenciler",
      keywords: ["kadro", "roster", "filtre", "son giriş", "ödeme rozeti"],
      blocks: [
        {
          kind: "para",
          text: "Bu listede yalnız sana atanan öğrenciler görünür — atama yöneticide. Üstteki çiplerle sınava göre süzersin. Ad sütunundaki isme tıklamak öğrencinin kokpitini açar. Sağdaki Davet sütunu, öğrencinin hesabını açıp açmadığını ve davet/PIN araçlarını taşır.",
        },
        {
          kind: "steps",
          items: [
            "Sınav filtresi seç: Tümü, KPSS, YKS ya da LGS.",
            "\"Son giriş\" sütununda sararmış (3+ gün) öğrencileri tespit et.",
            "\"Ödeme\" sütununda Gecikmiş rozetlerini kontrol et.",
            "İsme tıklayıp kokpite geç.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Yeni öğrenci", where: "Sayfa başlığının sağında", does: "Yeni öğrenci formunu açar." },
            { label: "Tümü / KPSS / YKS / LGS", where: "Tablo üstündeki çipler", does: "Listeyi sınava göre süzer." },
            { label: "Linki kopyala", where: "Davet sütununda (davet bekleyenlerde)", does: "Öğrencinin davet linkini panoya kopyalar." },
            { label: "WhatsApp'tan gönder", where: "Davet sütununda (telefonu varsa)", does: "Davet mesajı + linki hazır hâlde WhatsApp sohbeti açar." },
            { label: "PIN", where: "Davet sütununun sonunda", does: "PIN sıfırlama / davet yenileme penceresini açar." },
          ],
        },
        {
          kind: "table",
          title: "Rozetlerin anlamı",
          head: ["Sütun", "Rozet", "Anlamı"],
          rows: [
            ["Son giriş", "Bugün / Dün / N gün önce", "Öğrencinin son soru girişinden bu yana geçen süre; 3+ gün sarı uyarıdır."],
            ["Son giriş", "Hiç giriş yok", "Öğrenci hiç veri girmemiş — davetini ve alışkanlığını kontrol et."],
            ["Ödeme", "Ödendi / Borç / Gecikmiş / Plan yok", "Açık fatura bakiyesi ve vade durumu; \"Plan yok\" ücret planı tanımlanmamış demektir."],
            ["Davet", "Kabul edildi / Davet yok", "Öğrenci hesabını açtı mı; \"Davet yok\" ise PIN düğmesi yeni link üretir."],
          ],
        },
        {
          kind: "note",
          text: "Listen boşsa ya da bir öğrencin görünmüyorsa atama eksiktir — öğrenci-koç atamasını yalnız yönetici yapar, yöneticine söyle.",
        },
      ],
    },
    {
      id: "yeni-ogrenci",
      no: 5,
      chapter: "Kadro",
      title: "Yeni öğrenci ekleme",
      lead: "Formu doldur, öğrenciyi oluştur; ekranda çıkan davet linkini WhatsApp'tan gönder. Öğrenci linkten PIN belirleyip hesabını açar.",
      where: "/koc/ogrenciler/yeni",
      keywords: ["kayıt", "davet linki", "telefon", "alan", "track"],
      blocks: [
        {
          kind: "para",
          text: "Zorunlu alanlar Ad Soyad ve Sınav; YKS seçersen Alan (Sayısal / Eşit Ağırlık / Sözel) da zorunlu olur. Telefon zorunlu değil ama kritik: WhatsApp daveti ve hatırlatmalar bu numaraya gider ve öğrenci uygulamaya bu numarayla girer. Kalan alanlar (veli telefonu, hedef, okul, şehir…) sonradan kokpitin Profil sekmesinden de doldurulabilir.",
        },
        {
          kind: "steps",
          items: [
            "Ad Soyad, Sınav ve (YKS ise) Alan seç.",
            "Telefonu 5XX ile başlayan biçimde gir.",
            "\"Öğrenciyi oluştur\"a bas.",
            "Başarı ekranındaki davet linkini \"WhatsApp'tan gönder\" ile ilet ya da kopyala.",
            "\"Öğrenci sayfasına git\" ile kokpiti açıp ücret planını ve ilk programı kur.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Öğrenciyi oluştur", where: "Formun altında", does: "Öğrenciyi kadroya ekler ve davet linki üretir." },
            { label: "Linki kopyala", where: "Başarı ekranında", does: "Davet linkini panoya kopyalar." },
            { label: "WhatsApp'tan gönder", where: "Başarı ekranında (telefon girildiyse)", does: "Davet mesajı + linki hazır hâlde WhatsApp açar." },
            { label: "Öğrenci sayfasına git", where: "Başarı ekranında", does: "Yeni öğrencinin kokpitini açar." },
            { label: "Yeni öğrenci ekle", where: "Başarı ekranında", does: "Formu temizleyip bir sonraki öğrenciye geçer." },
          ],
        },
        {
          kind: "warning",
          text: "Telefon numarası giriş kimliğidir ve sistemde tekildir — iki öğrenci (kardeşler dahil) aynı numarayı paylaşamaz. Numara hatalıysa öğrenci hesabını hiç açamaz.",
        },
        {
          kind: "note",
          text: "Leadler ve bekleme listesindeki \"Öğrenciye çevir\" / \"Kayda çevir\" düğmeleri bu formu ad, telefon ve sınav önceden dolu açar.",
        },
      ],
    },
    {
      id: "davet-ve-pin",
      no: 6,
      chapter: "Kadro",
      title: "Davet linki ve PIN sıfırlama",
      lead: "PIN düğmesi iki işi tek yerden çözer: hesabı olan öğrenciye yeni PIN üretir, hesabını hiç açmamış öğrenciye yeni davet linki verir.",
      where: "/koc/ogrenciler",
      keywords: ["pin", "şifre", "giremiyorum", "davet", "sıfırla"],
      blocks: [
        {
          kind: "para",
          text: "Öğrenciler telefon + 4-6 haneli PIN ile girer. \"Giremiyorum\" diyen öğrenci için kadro tablosundaki \"PIN\" düğmesine bas. Pencere duruma göre davranır: öğrenci daveti kabul etmişse PIN yenilenir (eski PIN anında geçersiz olur ve giriş, kayıttaki telefon numarasına yeniden eşitlenir); henüz hesap açmamışsa yeni bir davet linki üretilir.",
        },
        {
          kind: "steps",
          items: [
            "Öğrencinin satırında \"PIN\" düğmesine bas.",
            "Hesabı varsa: istersen \"PIN belirle\" alanına 4-6 rakam yaz (boş bırakırsan rastgele üretilir) ve \"Sıfırla\"ya bas.",
            "\"Yeni PIN hazır\" ekranındaki PIN'i kopyala ya da WhatsApp'tan gönder.",
            "Hesabı yoksa: \"Sıfırla\" yeni davet linki üretir — \"Yeni davet linki hazır\" ekranından ilet.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "PIN", where: "Kadro tablosunda satır sonunda", does: "PIN'i sıfırla penceresini açar." },
            { label: "Sıfırla", where: "Açılan pencerede", does: "Duruma göre yeni PIN ya da yeni davet linki üretir." },
            { label: "PIN'i kopyala", where: "\"Yeni PIN hazır\" ekranında", does: "Üretilen PIN'i panoya kopyalar." },
            { label: "WhatsApp'tan gönder", where: "Sonuç ekranında (telefonu varsa)", does: "PIN'i ya da davet linkini hazır mesajla gönderir." },
            { label: "Vazgeç", where: "Açılan pencerede", does: "İşlem yapmadan kapatır." },
          ],
        },
        {
          kind: "warning",
          text: "Pencereyi kapatınca PIN bir daha gösterilmez — kapatmadan önce mutlaka kopyala ya da gönder. Sıfırlama sonrası eski PIN geçersizdir.",
        },
      ],
    },
    {
      id: "kokpit",
      no: 7,
      chapter: "Kadro",
      title: "Öğrenci kokpiti ve 10 sekme",
      lead: "Kokpit bir öğrenciyle ilgili her şeyin tek adresi: başlıkta hızlı eylemler, altında 10 sekmelik ikincil gezinme.",
      where: "/koc/ogrenciler",
      keywords: ["kokpit", "sekme", "whatsapp şablon", "öğrenci sayfası"],
      blocks: [
        {
          kind: "para",
          text: "Kadro tablosunda isme tıklayınca kokpit açılır. Başlıkta öğrencinin adı, sınav rozeti, davet durumu (\"Davet kabul edildi\" / \"Davet bekliyor\"), koçu ve hedefi görünür. Sağdaki \"WhatsApp\" düğmesi ok işaretiyle bir şablon menüsü açar: mesajlar duyurudaki ortak şablon havuzundan gelir ve gruplara ayrılıdır; {ad} otomatik olarak öğrencinin adıyla değişir. Kokpiti yalnız sana atanan öğrenciler için açabilirsin.",
        },
        {
          kind: "steps",
          items: [
            "Öğrenciler listesinde isme tıkla — Genel Bakış sekmesi açılır.",
            "Sekme şeridinden çalışacağın alana geç (dar ekranda şerit yatay kayar).",
            "Hızlı mesaj için \"WhatsApp\" menüsünden şablon seç ya da \"Boş sohbet aç\"a bas.",
            "Davet bekleyen öğrencide başlıktan davet linkini kopyala ya da gönder.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Öğrenciler", where: "Sayfanın en üstünde, geri oku", does: "Kadro listesine döner." },
            { label: "WhatsApp", where: "Başlığın sağında (ok işaretli)", does: "Şablon menüsünü açar; seçilen mesaj kişiselleşmiş hâlde WhatsApp'ta hazırlanır." },
            { label: "Boş sohbet aç", where: "WhatsApp menüsünün ilk maddesi", does: "Mesaj ön dolgusu olmadan sohbeti açar." },
            { label: "Linki kopyala", where: "Başlıkta (yalnız davet bekleyende)", does: "Davet linkini panoya kopyalar." },
            { label: "WhatsApp'tan gönder", where: "Başlıkta (yalnız davet bekleyende)", does: "Davet mesajını hazır hâlde gönderir." },
          ],
        },
        {
          kind: "table",
          title: "10 sekme",
          head: ["Sekme", "Ne için"],
          rows: [
            ["Genel Bakış", "Sayı kartları, net gelişimi, içgörüler, çalışma süresi, son denemeler"],
            ["Soru Takibi", "Haftalık gün × ders soru ızgarası (D/Y/B destekli)"],
            ["Denemeler", "Deneme listesi, yeni deneme girişi, eksik analizi panosu"],
            ["Program", "Haftalık program kurma, AI taslağı, yayınlama"],
            ["Görüşmeler", "Görüşme planla, sonuçlandır, transkriptlere geç"],
            ["Konular", "Konu ilerleme yüzdeleri ve konu × kaynak işaretleme"],
            ["Kaynaklar", "Kaynak ekle/düzenle/arşivle ve kaynak başına istatistik"],
            ["İçerik", "Öğrencinin gördüğü içerikler ve kişiye özel atama"],
            ["Muhasebe", "Ücret planı, faturalar, ödemeler"],
            ["Profil", "Öğrenci bilgilerini düzenleme"],
          ],
        },
        {
          kind: "tip",
          text: "WhatsApp menüsündeki şablonları /koc/duyuru sayfasındaki \"Yönet\" penceresinden düzenlersin — burada değişiklik yapamazsın, havuz ortaktır.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Takip                                                              */
    /* ------------------------------------------------------------------ */
    {
      id: "genel-bakis",
      no: 8,
      chapter: "Takip",
      title: "Genel Bakış sekmesi",
      lead: "Görüşme öncesi 2 dakikalık okuma: toplam ve haftalık soru, çalışma süresi, son net ve eğilimi, seri, ödeme ve son giriş.",
      keywords: ["özet", "net gelişimi", "içgörü", "seri", "grafik"],
      blocks: [
        {
          kind: "para",
          text: "Üstte yedi kart durur: Toplam soru, Bu hafta, Çalışma (bu hafta + toplam), Son net (bir önceki tam denemeye göre farkıyla), Seri (kesintisiz günlük giriş), Ödeme rozeti ve Son giriş rozeti. Altında tam denemelerin net gelişim grafiği, otomatik içgörüler, son 8 haftanın çalışma süresi grafiği ve son 5 deneme listelenir.",
        },
        {
          kind: "steps",
          items: [
            "Son net kartındaki farka bak — yükseliş mi düşüş mü?",
            "Otomatik içgörüleri oku; görüşme gündemini buradan çıkar.",
            "Çalışma süresi grafiğinde haftalık düşüşleri yakala.",
            "Son denemelerden birine tıklayıp doğrudan analizine geç.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Tüm denemeler", where: "\"Son denemeler\" kartının altında", does: "Denemeler sekmesine geçer." },
            { label: "Deneme satırı", where: "\"Son denemeler\" kartında", does: "Satıra tıklamak o denemenin analiz ekranını açar." },
          ],
        },
        {
          kind: "note",
          text: "Net gelişimi grafiği yalnız tam denemeleri kullanır; branş denemeleri toplam net eğrisini bozmasın diye grafiğe girmez.",
        },
      ],
    },
    {
      id: "soru-takibi",
      no: 9,
      chapter: "Takip",
      title: "Soru Takibi sekmesi",
      lead: "Gün × ders ızgarasında hücreye dokun, doğru/yanlış/boş ya da sadece toplamı gir, Kaydet'e bas. Koç olarak öğrencinin verisini düzenleyebilirsin.",
      keywords: ["soru girişi", "d/y/b", "ızgara", "haftalık", "doğruluk"],
      blocks: [
        {
          kind: "para",
          text: "Izgara bu haftayı gösterir; hafta Pazartesi başlar ve bugünün sütunu vurgulanır. Hücreye dokununca açılan panelde Doğru / Yanlış / Boş girersin — üçü de doluysa toplam otomatik hesaplanır, net (D − Y ÷ bölen) ve doğruluk yüzdesi anında önizlenir. Kırılım bilmiyorsan yalnız toplam soru sayısını yazmak da geçerlidir. Öğrenci de aynı ızgarayı kendi tarafında kullanır; girişleri buradan düzeltebilirsin.",
        },
        {
          kind: "steps",
          items: [
            "Düzenlemek istediğin gün + ders hücresine dokun.",
            "Doğru, Yanlış, Boş değerlerini gir (ya üçünü doldur ya üçünü boş bırak) veya sadece toplamı yaz.",
            "\"Tamam\" ile paneli kapat; hücreyi silmek için \"Temizle\".",
            "Tüm değişiklikler bittiğinde alttaki \"Kaydet\"e bas — kaydedilmemiş gün sayısı düğmenin solunda yazar.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Izgara hücresi", where: "Izgarada gün × ders kesişimi", does: "Alttan D/Y/B giriş panelini açar; kırılımlı hücrelerde altta ince çizgi işareti görünür." },
            { label: "Temizle", where: "Açılan panelde", does: "Hücrenin tüm değerlerini siler (Kaydet'e basınca kalıcılaşır)." },
            { label: "Tamam", where: "Açılan panelde", does: "Paneli kapatır; değer taslakta kalır." },
            { label: "Kaydet", where: "Izgaranın altında", does: "Değişen günleri topluca kaydeder." },
          ],
        },
        {
          kind: "warning",
          text: "Panelde \"Üçünü de doldur ya da üçünü de boş bırak\" uyarısı görürsen kırılım eksik demektir — iki alan dolu bir alan boş kaydedilmez.",
        },
        {
          kind: "note",
          text: "Sayfanın altındaki \"Ders ders soru ve doğruluk\" tablosu son 8 haftayı özetler — öğrencinin Gelişim sayfasında gördüğü tablonun aynısıdır.",
        },
      ],
    },
    {
      id: "denemeler",
      no: 10,
      chapter: "Takip",
      title: "Denemeler sekmesi ve yeni deneme",
      lead: "D/Y/B gir, net canlı hesaplansın. Net = doğru − yanlış ÷ bölen; bölen LGS'de 3, YKS ve KPSS'de 4.",
      keywords: ["deneme", "net", "branş", "tam", "yayınevi"],
      blocks: [
        {
          kind: "para",
          text: "\"Yeni deneme\" penceresinde bölüm (örn. TYT/AYT), kapsam (Tam deneme / Branş denemesi), tarih, yayınevi ve deneme adını seçip ders ders D/Y/B girersin; toplam net tabloda canlı hesaplanır. Alt dersler (örn. Geometri) puanlanan üst derse otomatik toplanır. Net, kaydedildiği anda dondurulur — formül sonradan değişse bile geçmiş netler yeniden hesaplanmaz.",
        },
        {
          kind: "steps",
          items: [
            "\"Yeni deneme\"ye bas; Bölüm ve Kapsam seç.",
            "Tarih, Yayınevi ve Deneme adını gir (ad boşsa listede yayınevi görünür).",
            "Her ders için D / Y / B yaz — net sütunu anında dolar.",
            "\"Denemeyi kaydet\"e bas.",
            "Listede \"Analiz\" ile konu-eksik girişine geç ya da rozeti elle çevir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Yeni deneme", where: "Sekme başlığının sağında", does: "Deneme giriş penceresini açar." },
            { label: "Denemeyi kaydet", where: "Açılan pencerede, en altta", does: "Denemeyi ve ders sonuçlarını kaydeder; net snapshot olarak yazılır." },
            { label: "Analiz", where: "Deneme satırının sonunda", does: "O denemenin konu-eksik analiz ekranını açar." },
            { label: "Analiz bekliyor / Analiz yapıldı", where: "Analiz düğmesinin yanında", does: "Analiz bayrağını tek dokunuşla çevirir." },
          ],
        },
        {
          kind: "table",
          title: "Net kuralları",
          head: ["Sınav", "Bölen", "Örnek"],
          rows: [
            ["LGS", "3", "30 doğru, 6 yanlış → 30 − 6/3 = 28 net"],
            ["YKS", "4", "30 doğru, 8 yanlış → 30 − 8/4 = 28 net"],
            ["KPSS", "4", "50 doğru, 12 yanlış → 50 − 12/4 = 47 net"],
          ],
        },
        {
          kind: "note",
          text: "Sekmenin altındaki \"Toplam eksik\" ve \"Konu ısı haritası\" panoları tüm deneme analizlerinden beslenir — analiz girdikçe dolar.",
        },
      ],
    },
    {
      id: "deneme-analizi",
      no: 11,
      chapter: "Takip",
      title: "Deneme analizi girişi",
      lead: "Ders ders konu listesinde her konuya kaç soru kaçtığını (yanlış + boş) yaz. Kaydedince deneme otomatik \"analiz yapıldı\" olur.",
      keywords: ["analiz", "eksik", "konu", "yanlış boş"],
      blocks: [
        {
          kind: "para",
          text: "Analiz ekranı denemedeki hataları konuya bağlar: her ders bir kart, her konu bir satırdır. Satıra o konudan kaçan soru sayısını yazarsın; eksik girilen satırlar kızarır, ders başlığında toplam eksik görünür. Bu veriler kokpitteki \"Toplam eksik\" sıralamasını, ısı haritasını ve Konular sekmesindeki \"En zayıf konular\"ı besler.",
        },
        {
          kind: "steps",
          items: [
            "Denemeler sekmesinde ya da Panel'de \"Analiz gir\" / \"Analiz\" ile ekranı aç.",
            "Öğrenciyle kitapçığı açıp konu konu eksik sayısını gir.",
            "Yanlış girdiğin satırı 0 yaparak silebilirsin.",
            "Alttaki yapışkan şeritten \"Analizi kaydet\"e bas — denemeler listesine dönersin.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Konu eksik kutusu", where: "Ders kartında, konu adının sağında", does: "O konunun eksik sayısını tutar; 0 girmek kaydı siler." },
            { label: "Analizi kaydet", where: "Yapışkan alt şeritte", does: "Tüm eksikleri kaydeder ve denemeyi \"Analiz yapıldı\" işaretler." },
          ],
        },
        {
          kind: "tip",
          text: "Alt şerit toplam eksik sayısını ve kaydedilmemiş değişiklik olup olmadığını gösterir — sayfadan ayrılmadan önce şeride bak.",
        },
      ],
    },
    {
      id: "deneme-panosu",
      no: 12,
      chapter: "Takip",
      title: "Haftalık deneme panosu",
      lead: "Tüm öğrencilerinin bir haftadaki denemeleri tek tabloda: net sıralaması, ortalama, en yüksek ve analiz durumu.",
      where: "/koc/denemeler",
      keywords: ["pano", "haftalık", "sıralama", "ortalama net"],
      blocks: [
        {
          kind: "para",
          text: "Pano varsayılan olarak bu haftayı gösterir; oklarla geçmiş haftalara gidersin (hafta Pazartesi başlar). Koç hesabında yalnız kendi öğrencilerin listelenir. Üç sayı kartı haftanın özetini verir: deneme sayısı, ortalama net, en yüksek net. Tabloda öğrenci adına tıklamak onun Denemeler sekmesini açar.",
        },
        {
          kind: "steps",
          items: [
            "Hafta oklarıyla incelemek istediğin haftaya git.",
            "\"Nete göre\" ya da \"İsme göre\" sıralamayı seç.",
            "Analiz sütununda \"Bekliyor\" görünen satırları not et — döngü kapanmamış.",
            "Öğrenci adına tıklayıp denemenin detayına in.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Önceki hafta / Sonraki hafta", where: "Hafta etiketinin iki yanındaki oklar", does: "Panoyu bir hafta geri/ileri alır; bu haftadan ileri gidilmez." },
            { label: "Nete göre", where: "\"Sırala:\" çipleri", does: "Tabloyu en yüksek netten başlayarak dizer." },
            { label: "İsme göre", where: "\"Sırala:\" çipleri", does: "Tabloyu alfabetik dizer." },
          ],
        },
        {
          kind: "tip",
          text: "Pazartesi sabahı panoyu \"Nete göre\" açıp geçen haftayı taramak, duyuru ve tebrik mesajları için en hızlı kaynaktır.",
        },
      ],
    },
    {
      id: "konular-kaynaklar",
      no: 13,
      chapter: "Takip",
      title: "Konular ve Kaynaklar sekmeleri",
      lead: "Kaynaklar sekmesinde öğrencinin kitaplarını tanımlarsın; Konular sekmesinde her konunun hangi kaynakta bittiğini işaretlersin.",
      keywords: ["konu takibi", "kaynak", "soru bankası", "ilerleme", "arşiv"],
      blocks: [
        {
          kind: "para",
          text: "İkili çalışır: önce Kaynaklar sekmesinden öğrencinin kullandığı kitap/fasikülleri eklersin, sonra Konular sekmesindeki konu × kaynak matrisinde biten konuları işaretlersin. Konu ilerleme kartı ders bazında yüzde gösterir; \"En zayıf konular\" deneme analizlerinden gelir. Öğrenci de kendi tarafından işaretleyebilir. Kaynak silinmez, arşivlenir — geçmiş istatistik kaybolmaz.",
        },
        {
          kind: "steps",
          items: [
            "Kaynaklar sekmesinde \"Kaynak ekle\" ile kitabı tanımla (ad zorunlu; ders seçersen matris o derste görünür).",
            "Konular sekmesine geç; \"Ders seç\" ile dersi aç.",
            "Biten konu × kaynak hücrelerini işaretle.",
            "Konu ilerleme kartından ders bazlı yüzdeyi takip et.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Kaynak ekle", where: "Kaynaklar sekmesi başlığının sağında", does: "Kaynak formunu açar: Kaynak adı, Yazar / hoca, Ders, Not, Bağlantı." },
            { label: "Kaynağı ekle", where: "Açılan pencerede", does: "Kaynağı öğrencinin listesine kaydeder." },
            { label: "Kaynağı düzenle", where: "Kaynak satırında kalem simgesi", does: "Aynı formu mevcut bilgilerle açar." },
            { label: "Kaynağı arşivle / Kaynağı geri al", where: "Kaynak satırında arşiv simgesi", does: "Kaynağı pasife alır ya da geri getirir; arşivli kaynak üstü çizili ve \"Arşiv\" rozetli görünür." },
            { label: "Ders seç", where: "Konular sekmesinde, matris başlığında", does: "Konu × kaynak matrisinde gösterilecek dersi değiştirir." },
          ],
        },
        {
          kind: "tip",
          text: "Kaynaklar sekmesindeki \"Kaynak başına soru & konu\" tablosu hangi kitabın gerçekten kullanıldığını gösterir — bu hafta 0 soru çözülen kaynak, program görevlerine bağlanmamış demektir.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Program                                                            */
    /* ------------------------------------------------------------------ */
    {
      id: "program-olustur",
      no: 14,
      chapter: "Program",
      title: "Program oluşturma",
      lead: "Haftalık program ders × konu ızgarasında ya da gün görünümünde kurulur. Motto ve koç notu programın strateji panelinde durur.",
      keywords: ["program", "haftalık plan", "görev", "konu ekle", "motto"],
      blocks: [
        {
          kind: "para",
          text: "Program sekmesi seçili haftayı gösterir; oklarla hafta değiştirirsin, \"Planlı haftalar\" çipleri hangi haftaların dolu olduğunu gösterir (sarı nokta taslak, yeşil nokta yayında). İki görünüm var: \"Hafta · ders\" ızgarası derslere göre, \"Gün\" görünümü günlere göre çalışır. Görevde gün ve ders opsiyoneldir — günsüz görev haftanın genel konusu olur.",
        },
        {
          kind: "steps",
          items: [
            "Oklarla planlanacak haftaya git (genelde gelecek hafta).",
            "Boş haftada istersen \"Geçen haftadan kopyala\" ile başla.",
            "\"Hafta · ders\" ızgarasında \"Konu ekle\" ya da \"Gün\" görünümünde \"Görev ekle\" ile görevleri gir.",
            "Strateji panelinde \"Haftanın mottosu\" ve \"Koç notu\"nu yazıp \"Kaydet\"e bas.",
            "Bittiğinde \"Yayınla\" ile öğrenciye aç (bkz. bir sonraki bölüm).",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Önceki hafta / Sonraki hafta", where: "Hafta etiketinin iki yanındaki oklar", does: "Görüntülenen haftayı değiştirir." },
            { label: "Hafta · ders / Gün", where: "Görünüm anahtarı, araç şeridinde", does: "Izgara ile gün sütunları arasında geçiş yapar." },
            { label: "Geçen haftadan kopyala", where: "Araç şeridinde (yalnız boş haftada)", does: "Önceki haftanın görevlerini yapılmamış olarak bu haftaya kopyalar." },
            { label: "Konu ekle", where: "Izgarada ders sütununun altında", does: "O derse konu ekleme penceresini açar (Gün, Ders, Konu / açıklama, Hedef soru, Kaynak)." },
            { label: "Görev ekle", where: "Gün görünümünde her gün kartının altında", does: "O güne görev ekleme penceresini açar." },
            { label: "Kaydet", where: "Strateji / Koç notu panelinde", does: "Motto ve koç notunu kaydeder." },
            { label: "Görevi düzenle / Görevi sil", where: "Görev satırında kalem / çöp simgeleri", does: "Görevi düzenler ya da siler." },
            { label: "Tamamlandı dairesi", where: "Görev satırının başında", does: "Görevi tamamlandı/geri alındı olarak işaretler." },
          ],
        },
        {
          kind: "tip",
          text: "Görev formunda \"Bu hafta (gün yok)\" seçersen görev güne bağlanmaz — esnek konular için idealdir. Kaynak bağlarsan öğrencide görev kaynağıyla birlikte görünür.",
        },
      ],
    },
    {
      id: "program-yayinla",
      no: 15,
      chapter: "Program",
      title: "Yayınla ve öğrenci önerisini inceleme",
      lead: "Program taslak kaldığı sürece öğrenci hiçbir şey görmez. Yayınla'ya basınca haftanın programı öğrencinin ekranına düşer.",
      keywords: ["yayınla", "taslak", "öğrenci önerisi", "durum"],
      blocks: [
        {
          kind: "para",
          text: "Programın üç durumu vardır: Taslak (yalnız sen görürsün), Yayınlandı (öğrenci görür ve işaretler), Tamamlandı. Öğrenciler de kendilerine taslak önerebilir — bu taslaklar \"Öğrenci önerisi\" rozetiyle gelir ve Panel'deki \"Yayınlanmayı bekleyen programlar\" kartında en üstte durur. Öneriyi düzenleyip yayınlayan yine sensin; öğrenci kendi taslağını yayınlayamaz.",
        },
        {
          kind: "steps",
          items: [
            "Panel'deki \"Yayınlanmayı bekleyen programlar\" kartından ya da kokpitten taslağı aç.",
            "\"Öğrenci önerisi\" rozetli taslaklarda görevleri gözden geçir; düzenle, sil, ekle.",
            "Motto ve koç notunu tamamla.",
            "\"Yayınla\"ya bas — öğrenciye anında görünür.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Yayınla", where: "Durum panelinde, sağda (yalnız taslakta)", does: "Programı öğrenciye açar; en az bir görev olmadan basılamaz." },
            { label: "Taslak / Yayınlandı / Tamamlandı", where: "Durum panelinde rozet", does: "Programın mevcut durumunu gösterir." },
            { label: "Öğrenci önerisi", where: "Durum panelinde ek rozet", does: "Taslağın öğrenciden geldiğini belirtir." },
          ],
        },
        {
          kind: "warning",
          text: "\"Program öğrencide görünmüyor\" şikâyetinin sebebi neredeyse her zaman budur: program taslakta kalmış, Yayınla'ya basılmamıştır.",
        },
      ],
    },
    {
      id: "program-ai",
      no: 16,
      chapter: "Program",
      title: "AI ile program ve notu görevlere dönüştürme",
      lead: "AI, öğrencinin verisine göre haftalık taslak önerir; uzun koç notunu da tek tıkla işaretlenebilir görevlere çevirebilirsin.",
      keywords: ["ai", "yapay zeka", "taslak öner", "notu görevlere dönüştür"],
      blocks: [
        {
          kind: "para",
          text: "Program sekmesindeki \"AI ile oluştur\" düğmesi öğrencinin soru, deneme ve eksik verisine bakarak konu listesi önerir. Öneri sen onaylayana kadar hiçbir yere yazılmaz; seçtiğin konular normal taslak görevleri olarak eklenir, sonra istediğin gibi düzenlersin. Ayrıca koç notu uzunsa sistem \"Notu görevlere dönüştür\" önerir — notun maddeleri gün gün görevlere çevrilir, notun kendisi silinmez.",
        },
        {
          kind: "steps",
          items: [
            "Program sekmesinde \"AI ile oluştur\"a bas.",
            "İstersen \"Odak\" alanına haftanın ağırlığını yaz (örn. matematik ve paragraf).",
            "\"Taslak öner\"e bas; gelen konu listesinde istemediklerinin işaretini kaldır.",
            "\"N konuyu ekle\" ile seçilenleri taslağa aktar; beğenmediysen \"Yeniden öner\".",
            "Uzun not yazdıysan çıkan şeritten \"Notu görevlere dönüştür\"ü kullan: maddeleri ve günleri düzenle, \"N görev olarak ekle\"ye bas.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "AI ile oluştur", where: "Program sekmesinde, hafta gezgininin altında", does: "AI taslak penceresini açar." },
            { label: "Taslak öner", where: "Açılan pencerede", does: "Öğrenci verisine göre konu listesi üretir." },
            { label: "Yeniden öner", where: "Öneri listesinin altında", does: "Listeyi atıp yeni üretim ister." },
            { label: "N konuyu ekle", where: "Öneri listesinin altında", does: "Seçili konuları taslağa görev olarak ekler." },
            { label: "Notu görevlere dönüştür", where: "Strateji panelinin altındaki bilgi şeridinde (not uzunsa)", does: "Not maddelerini görev adaylarına çeviren pencereyi açar." },
            { label: "N görev olarak ekle", where: "Dönüştürme penceresinde", does: "Seçili maddeleri belirlenen günlere görev olarak ekler; not olduğu gibi kalır." },
          ],
        },
        {
          kind: "tip",
          text: "AI çıktısını olduğu gibi yayınlama — hedef soru sayılarını ve kaynak bağlarını elden geçir. AI taslağı başlangıç noktasıdır, karar senindir.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Görüşme                                                            */
    /* ------------------------------------------------------------------ */
    {
      id: "gorusme-planlama",
      no: 17,
      chapter: "Görüşme",
      title: "Görüşme planlama ve sonuçlandırma",
      lead: "Görüşmeler sayfası tüm kadronun takvimidir; planlama ve sonuçlandırma öğrencinin kokpitindeki Görüşmeler sekmesinde yapılır.",
      where: "/koc/gorusmeler",
      keywords: ["görüşme", "randevu", "yapıldı", "gelmedi", "toplantı linki"],
      blocks: [
        {
          kind: "para",
          text: "/koc/gorusmeler yaklaşan ve geçmiş görüşmeleri listeler; \"Görüşmesini planlamayanlar\" kartı takvimin hazırken randevu almamış öğrencileri gösterir ve tek tuşla WhatsApp hatırlatması yollatır. Görüşme kaydını öğrencinin kokpitinde \"Görüşme planla\" ile açarsın: tarih-saat, Meet/Zoom linki ve öğrencinin Bugün ekranında görünecek not. Görüşme sonrası durumu \"Yapıldı\" ya da \"Gelmedi\" yaparsın; koç özeti yalnız koçlara görünür.",
        },
        {
          kind: "steps",
          items: [
            "Öğrencinin kokpitinde Görüşmeler sekmesini aç, \"Görüşme planla\"ya bas.",
            "Tarih, Saat, Toplantı linki ve Öğrenciye not alanlarını doldur, \"Görüşmeyi planla\" ile kaydet.",
            "Görüşme günü karttaki \"Görüşmeye katıl\" ile toplantıya gir.",
            "Sonrasında \"Yapıldı\" ya da \"Gelmedi\" işaretle; \"Düzenle\" içinden koç özetini yaz.",
            "\"Program oluştur\" ile görüşmeden doğrudan gelecek haftanın taslağını aç.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Görüşme planla", where: "Kokpit Görüşmeler sekmesi başlığında", does: "Planlama penceresini açar (Tarih, Saat, Toplantı linki, Öğrenciye not)." },
            { label: "Görüşmeye katıl", where: "Görüşme kartında (link girildiyse)", does: "Meet/Zoom linkini yeni sekmede açar." },
            { label: "Yapıldı", where: "Görüşme kartında", does: "Görüşmeyi yapıldı olarak işaretler." },
            { label: "Gelmedi", where: "Görüşme kartında", does: "Görüşmeyi gelmedi olarak işaretler." },
            { label: "Düzenle", where: "Görüşme kartında", does: "Tarih/not/linki değiştirir; \"Görüşme özeti (koç)\" alanı yalnız burada görünür." },
            { label: "Program oluştur / Programı aç", where: "Görüşme kartının sağ altında", does: "Görüşmeye bağlı bir sonraki haftanın programını oluşturur ya da açar." },
            { label: "Hatırlat", where: "/koc/gorusmeler'de planlamayanlar kartında", does: "Öğrenciye randevu alma linkiyle hazır WhatsApp mesajı açar." },
            { label: "Görüşme transkriptleri (AI önerileri)", where: "Kokpit Görüşmeler sekmesinin üstünde", does: "Öğrencinin transkript listesine geçer." },
          ],
        },
        {
          kind: "note",
          text: "Durum rozetleri: Planlandı, Yapıldı, Gelmedi, İptal. \"Öğrenciye not\" öğrencinin Bugün ekranında görünür; \"Görüşme özeti\" öğrenciye asla gösterilmez.",
        },
      ],
    },
    {
      id: "cal-takvimi",
      no: 18,
      chapter: "Görüşme",
      title: "Görüşme takvimini bağlama (Cal linki)",
      lead: "Cal.com linkini profiline girmezsen öğrencilerin uygulamadan randevu alamaz. Link girilince takvimin öğrencinin ekranına gömülü gelir.",
      where: "/koc/profil",
      keywords: ["cal", "takvim", "randevu", "cal.com", "booking"],
      blocks: [
        {
          kind: "para",
          text: "Öğrenciler görüşme randevusunu kendi uygulamalarındaki gömülü Cal.com takviminden alır. Bu takvim, senin /koc/profil sayfasındaki \"Görüşme takvimi (Cal linki)\" alanından beslenir. Alan boşsa hem /koc/gorusmeler hem profil sayfası sarı uyarı gösterir ve öğrenci tarafında randevu düğmesi çalışmaz.",
        },
        {
          kind: "steps",
          items: [
            "Cal.com'da hesabını ve haftalık görüşme etkinliğini oluştur.",
            "Etkinlik linkini kopyala (örn. https://cal.com/kullaniciadi/haftalik).",
            "/koc/profil sayfasında \"Görüşme takvimi (Cal linki)\" alanına yapıştır.",
            "\"İletişimi kaydet\"e bas.",
            "/koc/gorusmeler'i aç — sarı uyarı kaybolduysa bağlantı tamam.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Görüşme takvimi (Cal linki)", where: "/koc/profil, iletişim formunda", does: "Öğrencilere gömülü gelecek Cal.com randevu linkini tutar." },
            { label: "İletişimi kaydet", where: "İletişim formunun altında", does: "Telefon, Telegram, Instagram, Cal linki ve IBAN bilgilerini kaydeder." },
            { label: "Profilinden Cal linkini ekle", where: "/koc/gorusmeler'deki sarı uyarıda", does: "Seni doğrudan profil sayfasına götürür." },
          ],
        },
        {
          kind: "warning",
          text: "Cal linki koç başınadır — her koç kendi linkini girmek zorundadır. Link yokken öğrencilerin \"randevu alamıyorum\" demesi normaldir; ilk kontrol noktası burasıdır.",
        },
      ],
    },
    {
      id: "canli-transkript",
      no: 19,
      chapter: "Görüşme",
      title: "Canlı transkript",
      lead: "Öğrenciyi seç, Başlat'a bas: konuşma cihazında (WebGPU) canlı yazıya çevrilir. Varsayılan olarak ses kaydedilmez, yalnız metin saklanır.",
      where: "/koc/canli-transkript",
      keywords: ["transkript", "mikrofon", "whisper", "webgpu", "kvkk", "ses"],
      blocks: [
        {
          kind: "para",
          text: "Yazıya çevirme tamamen senin cihazında çalışır; ilk kullanımda model bir kez (~250 MB) iner, sonrası hızlıdır. Varsayılanda ses hiçbir yere gönderilmez ve kaydedilmez — yalnız üretilen metin \"Kaydet\" dediğinde uygulamaya işlenir. KVKK kutusunu işaretlersen (öğrenci/veli onayı şart) ses kaydı da saklanır. Durdurduktan sonra \"Devam et\" aynı kayda ekler, \"Yeniden başlat\" sıfırdan başlar.",
        },
        {
          kind: "steps",
          items: [
            "Herhangi bir koç sayfasında \"g\" sonra \"t\" ile buraya gel ya da menüden \"Canlı\"yı aç.",
            "\"Öğrenci\" listesinden görüşeceğin öğrenciyi seç.",
            "Ses kaydı da saklanacaksa KVKK onay kutusunu işaretle (onaysız işaretleme).",
            "\"Başlat\"a bas; tarayıcı mikrofon izni isterse \"İzin ver\" de.",
            "Görüşme bitince \"Durdur\", ardından \"Kaydet ve incele\" — AI öneri ekranına geçersin.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Öğrenci", where: "Sayfanın üstünde açılır liste", does: "Transkriptin hangi öğrencinin kaydına yazılacağını seçer." },
            { label: "Ses kaydını da sakla — öğrenci/veli onayı alındı (KVKK).", where: "Başlat'ın üstünde onay kutusu", does: "İşaretliyse ses de kaydedilip saklanır; işaretsizse yalnız metin." },
            { label: "Başlat", where: "Denetim şeridinde", does: "Mikrofonu ve cihaz-içi çeviriyi başlatır; metin canlı akar." },
            { label: "Durdur", where: "Kayıt sırasında", does: "Dinlemeyi durdurur; kalan tamponu çevirir." },
            { label: "Devam et", where: "Durdurduktan sonra", does: "Biriken metni koruyarak kayda kaldığı yerden devam eder." },
            { label: "Yeniden başlat", where: "Durdurduktan sonra", does: "Bu oturumun metnini silip sıfırdan başlar." },
            { label: "Kaydet ve incele", where: "Durdurduktan sonra, metin yeterliyse", does: "Metni kaydeder ve transkript inceleme sayfasına götürür." },
          ],
        },
        {
          kind: "warning",
          text: "WebGPU olmayan tarayıcılarda canlı transkript çalışmaz — güncel Chrome/Brave/Edge kullan. Alternatif olarak kokpitteki transkript sayfasından \"Ses kaydından\" yükleme ya da \"Metin yapıştır\" yolunu kullanabilirsin.",
        },
      ],
    },
    {
      id: "transkript-cikarim",
      no: 20,
      chapter: "Görüşme",
      title: "Transkriptten AI çıkarımı ve öneri onayı",
      lead: "AI transkriptten soru, deneme, görev ve not önerileri çıkarır. Hiçbir öneri sen \"Onayla\" demeden kayda yazılmaz.",
      keywords: ["çıkarım", "öneri", "onayla", "reddet", "transkript inceleme"],
      blocks: [
        {
          kind: "para",
          text: "Öğrencinin transkript sayfasında üç giriş yolu vardır: Canlı (mikrofon), Ses kaydından (Meet/Zoom kaydını yükle) ve Metin yapıştır. Kaydedilen her transkript \"Geçmiş\" listesine düşer; detayında \"Çıkarımı çalıştır\" AI'a metni tarattırır. Çıkan her öneri bir kart olur: türü, okunur özeti, kaynağındaki alıntı ve güven yüzdesiyle. Onayladığın öneri normal kayıt işlemini çalıştırır (net sunucuda hesaplanır); reddettiğin hiçbir iz bırakmaz.",
        },
        {
          kind: "steps",
          items: [
            "Kokpit → Görüşmeler → \"Görüşme transkriptleri (AI önerileri)\" bağlantısını aç.",
            "Canlı, ses dosyası ya da yapıştırılmış metinle transkript oluştur.",
            "Detay sayfasında \"Çıkarımı çalıştır\"a bas; özet ve öneri kartları gelir.",
            "Her kartı oku — alıntıyı kontrol et — \"Onayla\" ya da \"Reddet\" de.",
            "Gerekirse \"Yeniden çıkar\" ile önerileri baştan ürettir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Çıkarımı çalıştır / Yeniden çıkar", where: "Transkript detayında, sağ üstte", does: "AI'dan öneri üretir; mevcut öneriler varsa etiket \"Yeniden çıkar\" olur." },
            { label: "Onayla", where: "Öneri kartının altında", does: "Öneriyi gerçek kayda çevirir (soru girişi, deneme, görev, konu işareti ya da görüşme notu)." },
            { label: "Reddet", where: "Öneri kartının altında", does: "Öneriyi reddedildi olarak kapatır; hiçbir kayıt oluşmaz." },
            { label: "Yükle ve çevir", where: "\"Ses kaydından\" bölümünde", does: "Ses dosyasını parçalara bölüp yazıya çevirir (KVKK onayı zorunlu)." },
            { label: "Transkript metni", where: "Detay sayfasının en altında", does: "Ham transkripti açıp kapatır." },
          ],
        },
        {
          kind: "table",
          title: "Öneri türleri",
          head: ["Tür", "Onaylanınca ne olur"],
          rows: [
            ["Soru takibi", "İlgili günün soru ızgarasına giriş yazılır"],
            ["Deneme sonucu", "Yeni deneme kaydı oluşur; net sunucuda hesaplanır"],
            ["Program görevi", "Haftalık plana görev eklenir"],
            ["Konu ilerlemesi", "Konu × kaynak hücresi işaretlenir"],
            ["Görüşme notu", "Görüşme özeti / öğrenci notu güncellenir"],
          ],
        },
        {
          kind: "warning",
          text: "Öneriler onaylanana kadar hiçbir yere yazılmaz — ama onay geri alınamaz; onaylamadan önce alıntıyı ve rakamları mutlaka kontrol et.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  İletişim                                                           */
    /* ------------------------------------------------------------------ */
    {
      id: "duyuru",
      no: 21,
      chapter: "İletişim",
      title: "Toplu WhatsApp duyurusu",
      lead: "Mesajı bir kez yaz, {ad} her öğrencinin adıyla değişsin; sonra listeden tek tek WhatsApp'a bas. Otomatik gönderim yoktur.",
      where: "/koc/duyuru",
      keywords: ["duyuru", "toplu mesaj", "şablon", "whatsapp", "{ad}"],
      blocks: [
        {
          kind: "para",
          text: "Duyuru ekranı mesajı senin adına göndermez — her öğrenci için wa.me bağlantısı açar, mesajı sen kendi WhatsApp'ından onaylayıp yollarsın. Mesaj gövdesindeki {ad} kalıbı gönderim anında öğrencinin adıyla değişir; önizleme kutusu ilk öğrenci üzerinden nasıl görüneceğini gösterir. Şablon havuzu tüm koçlara ortaktır ve kokpitteki WhatsApp menüsünü de besler.",
        },
        {
          kind: "steps",
          items: [
            "Mesajı yaz ya da \"Hazır şablonlar\"dan bir grup seçip şablona tıkla.",
            "Sınav çipleri ve \"Öğrenci ara\" ile alıcı listesini süz.",
            "Her satırda \"WhatsApp\"a bas — sohbet mesaj hazır açılır, gönderi sen yaparsın.",
            "Gönderdiklerin yeşil işaretlenir; \"mesajlandı\" sayacından kalanları takip et.",
            "Şablon eklemek/düzenlemek için \"Yönet\"i aç.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Şablon çipleri", where: "Mesaj kutusunun altında", does: "Grubu seçer; grubun şablonları düğme olarak listelenir, tıklayınca mesaj kutusuna dolar." },
            { label: "Yönet", where: "Şablon çiplerinin sağında", does: "Şablonları yönet penceresini açar." },
            { label: "Yeni", where: "Şablon yönetim penceresinde", does: "Yeni şablon editörünü açar (Grup, Başlık, Mesaj, \"Listede görünsün\")." },
            { label: "Kaydet / Vazgeç", where: "Şablon editöründe", does: "Şablonu kaydeder ya da değişikliği atar." },
            { label: "Mesajı kopyala", where: "Öğrenci satırında kopya simgesi", does: "Kişiselleşmiş mesajı panoya kopyalar (WhatsApp dışı kanallar için)." },
            { label: "WhatsApp / Tekrar", where: "Öğrenci satırının sonunda", does: "Kişiselleşmiş mesajla sohbeti açar; daha önce açtıysan \"Tekrar\" yazar." },
            { label: "Öğrenci ara", where: "Filtre şeridinde", does: "Listeyi ada göre süzer." },
          ],
        },
        {
          kind: "tip",
          text: "\"Telefonu yok\" uyarısı alan öğrencilere mesaj gidemez — önce kokpit Profil sekmesinden numarayı tamamla. Şablonda \"Listede görünsün\" kapalıysa şablon composer'da gizlenir ama silinmez.",
        },
      ],
    },
    {
      id: "icerik-kutuphanesi",
      no: 22,
      chapter: "İletişim",
      title: "İçerik kütüphanesi ve atama",
      lead: "Video, PDF, not ve bağlantıları kütüphaneye ekle; herkese açık bırak ya da belirli öğrencilere ata. Yalnız kendi eklediğini yönetirsin.",
      where: "/koc/icerik",
      keywords: ["içerik", "video", "pdf", "not", "atama", "kütüphane"],
      blocks: [
        {
          kind: "para",
          text: "Kütüphane tüm koçlara ortaktır: herkes tüm içeriği görür, ama silme ve atama düğmeleri yalnız kendi eklediğin kartlarda çıkar. \"Kütüphanede herkese açık\" işaretli içerik, sınav filtresine uyan tüm öğrencilere görünür; işareti kapatırsan yalnız seçtiğin öğrenciler görür. YouTube bağlantıları küçük resimle, notlar doğrudan uygulama içinde açılır. Kokpitin İçerik sekmesi aynı işi tek öğrenci odağıyla yapar.",
        },
        {
          kind: "steps",
          items: [
            "\"İçerik ekle\"ye bas; Tür seç (Video, PDF, Not, Bağlantı).",
            "Başlığı ve bağlantıyı (notsa içeriğini) gir; istersen Sınav, Ders ve Konu etiketle.",
            "\"Kütüphanede herkese açık\" kutusunu ihtiyaca göre ayarla; kapalıysa öğrencileri işaretle.",
            "\"İçeriği ekle\" ile kaydet.",
            "Sonradan hedef değiştirmek için karttaki \"Ata\" düğmesini kullan.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "İçerik ekle", where: "Sayfa başlığının sağında", does: "İçerik ekleme penceresini açar." },
            { label: "İçeriği ekle", where: "Açılan pencerede", does: "İçeriği kaydeder ve seçili öğrencilere atar." },
            { label: "Ata (N)", where: "Kart altında (yalnız kendi içeriğinde)", does: "Öğrenci atama penceresini açar; N mevcut atama sayısıdır." },
            { label: "Atamaları kaydet", where: "Atama penceresinde", does: "İşaretli öğrenci kümesini kaydeder; tümünü kaldırmak atamayı temizler." },
            { label: "İçeriği sil", where: "Kartın sağ üstünde çöp simgesi (yalnız kendi içeriğinde)", does: "İçeriği, atamaları ve izlenme kayıtlarını siler (onay ister)." },
            { label: "Kütüphaneye git", where: "Kokpit İçerik sekmesinde", does: "Bu sayfaya döner." },
          ],
        },
        {
          kind: "note",
          text: "Kart rozetleri: \"Kütüphane\" herkese açık, \"Özel\" atamayla sınırlı demektir. \"izlendi\" sayacı ve kokpitteki İzlendi/Bekliyor rozetleri öğrencinin işaretlemesinden gelir.",
        },
      ],
    },
    {
      id: "blog",
      no: 23,
      chapter: "İletişim",
      title: "Blog yazıları",
      lead: "Kısa, uygulanabilir çalışma yazıları yaz; durumu \"Yayında\" yaptıklarında sitenin /blog sayfasında görünür. Yalnız kendi yazını düzenlersin.",
      where: "/koc/blog",
      keywords: ["blog", "yazı", "slug", "yayında", "taslak"],
      blocks: [
        {
          kind: "para",
          text: "Liste tüm yazıları gösterir ama düzenleme bağlantısı yalnız kendi yazılarında aktiftir. Editörde slug başlıktan otomatik türetilir; elle değiştirdiğin anda otomatik türetme durur. Üç durum vardır: Taslak (yalnız panelde), Yayında (sitede /blog altında) ve Arşiv. İçerik basit biçimlendirme alır: \"## başlık\", \"- liste\", \"> alıntı\", **kalın** ve [link](/iletisim).",
        },
        {
          kind: "steps",
          items: [
            "\"Yeni yazı\"ya bas; Başlık ve İçerik alanlarını doldur.",
            "Özeti yaz — listede ve arama sonuçlarında bu görünür.",
            "Durumu seç: bitene kadar Taslak, hazır olunca Yayında.",
            "\"Yazıyı oluştur\" (ya da düzenlemede \"Kaydet\") ile kaydet.",
            "Yayındaki yazıyı listeden \"Sitede aç\" ile kontrol et.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Yeni yazı", where: "Sayfa başlığının sağında", does: "Boş yazı editörünü açar." },
            { label: "Yazıyı oluştur / Kaydet", where: "Editörün altında", does: "Yazıyı kaydeder ve listeye döner." },
            { label: "Sil", where: "Editörün altında (yalnız mevcut yazıda)", does: "Yazıyı kalıcı olarak siler (onay ister)." },
            { label: "Sitede aç", where: "Listede yazı satırında (yalnız yayındakilerde)", does: "Yazının site sayfasını yeni sekmede açar." },
          ],
        },
        {
          kind: "warning",
          text: "Slug yayına alındıktan sonra değiştirilirse eski bağlantılar kırılır — yayındaki yazının slug'ına dokunma.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Para                                                               */
    /* ------------------------------------------------------------------ */
    {
      id: "muhasebe",
      no: 24,
      chapter: "Para",
      title: "Muhasebe: ücret planı, fatura, ödeme",
      lead: "Akış üç adımdır: öğrenciye ücret planı tanımla → fatura kes (plan varsa otomatik de kesilir) → ödemeyi kaydet. Tutarları ₺ girersin.",
      where: "/koc/muhasebe",
      keywords: ["muhasebe", "fatura", "ödeme", "ücret planı", "kuruş", "vade"],
      blocks: [
        {
          kind: "para",
          text: "Muhasebe sayfası kendi öğrencilerinin gelir özetini verir: bu ay gelir, tahsil edilmemiş bakiye, tahsilat oranı, gecikmiş fatura sayısı. Öğrenci bazlı işler kokpitin Muhasebe sekmesindedir: ücret planı (Haftalık / Aylık / Paket / Tek seferlik), fatura kesme ve ödeme kaydı. Haftalık ve aylık planlarda \"Otomatik yenileme\" açıksa dönem faturası kendiliğinden kesilir. Para her yerde tam sayı kuruş olarak saklanır; sen arayüzde ₺ girersin, sistem kuruşa çevirir — yuvarlama kayması olmaz.",
        },
        {
          kind: "steps",
          items: [
            "Kokpit → Muhasebe'de \"Ücret planı oluştur\" ile tip, tutar (₺) ve vade gününü tanımla.",
            "Gerekirse \"Fatura kes\" ile dönem faturası oluştur (tutar plandan ön dolu gelir).",
            "Para geldiğinde \"Ödeme al\" ile kaydet — fatura seçersen tutar kalan bakiyeyle dolar.",
            "Fatura satırındaki üç nokta menüsünden durumu yönet.",
            "/koc/muhasebe'deki \"Faturalar\" ve \"Ödemeler\" sayfalarından toplu listeye bak.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Faturalar", where: "Muhasebe başlığının sağında", does: "Tüm faturaların listesini açar (Tümü / Açık / Gecikmiş / Ödendi / Taslak / İptal filtreleri)." },
            { label: "Ödemeler", where: "Muhasebe başlığının sağında", does: "Tüm tahsilatların listesini açar; satırdan ödeme silinebilir." },
            { label: "Ödeme al", where: "Muhasebe başlığında ve kokpit sekmesinde", does: "Ödeme kaydet penceresini açar: öğrenci, fatura (opsiyonel), tutar (₺), tarih, yöntem (Havale / EFT, Nakit, Kart, Diğer), not." },
            { label: "Ücret planı oluştur / Planı düzenle", where: "Kokpit Muhasebe sekmesinde", does: "Plan penceresini açar: Ücretlendirme, Tutar (₺), Dönem (ay), Vade günü, İlk fatura tarihi, Otomatik yenileme." },
            { label: "Fatura kes", where: "Kokpit Muhasebe sekmesinde", does: "Fatura penceresini açar; tutar ₺ girilir, kuruş hassasiyetinde saklanır." },
            { label: "Gönderildi işaretle / Ödendi işaretle / Gecikmiş işaretle / Taslağa çevir", where: "Fatura satırında üç nokta menüsü", does: "Fatura durumunu elle değiştirir." },
            { label: "Faturayı iptal et", where: "Aynı menünün altında", does: "Faturayı iptale çeker; bakiyesi hesaplardan düşer." },
            { label: "Hatırlat", where: "\"Gecikmiş ödemeler\" kartında satır sonunda", does: "Öğrenciye tutar dolu hazır ödeme hatırlatması ile WhatsApp açar." },
          ],
        },
        {
          kind: "note",
          text: "\"Gecikmiş\" rozet statüden değil vadeden türetilir: vadesi geçen açık fatura otomatik gecikmiş görünür. Toplu otomatik fatura çalıştırma ve banka ekstresi mutabakatı yönetici araçlarıdır — ihtiyaç olursa yöneticine söyle.",
        },
      ],
    },
    {
      id: "odeme-bildirimleri",
      no: 25,
      chapter: "Para",
      title: "Ödeme bildirimlerini onaylama ve gecikme takibi",
      lead: "Öğrenci \"Ödeme bildir\" ile havalesini bildirir; bakiyeye ancak sen onaylayınca yansır. Gecikmişleri tek tuş WhatsApp'la kovalarsın.",
      where: "/koc/muhasebe",
      keywords: ["ödeme bildirimi", "onayla", "reddet", "gecikmiş", "havale"],
      blocks: [
        {
          kind: "para",
          text: "Öğrenci uygulamasından yapılan ödeme bildirimi doğrudan ödeme kaydı OLUŞTURMAZ — /koc/muhasebe'de \"Bekleyen ödeme bildirimleri\" kartına düşer ve onay bekler. \"Onayla\" bildirimi gerçek ödeme kaydına çevirir ve fatura bakiyesine işler; \"Reddet\" hiçbir kayıt bırakmaz. Bildirilen tutar yanlışsa reddet, doğru tutarı elle \"Ödeme al\" ile gir.",
        },
        {
          kind: "steps",
          items: [
            "/koc/muhasebe'yi aç; sarı çerçeveli \"Bekleyen ödeme bildirimleri\" kartına bak.",
            "Bildirimdeki tutarı, tarihi ve yöntemi banka hesabınla karşılaştır.",
            "Doğruysa \"Onayla\" — ödeme işlenir, fatura bakiyesi düşer.",
            "Tutar farklıysa \"Reddet\" ve doğru tutarı \"Ödeme al\" ile kaydet.",
            "\"Gecikmiş ödemeler\" kartındaki öğrencilere \"Hatırlat\" ile mesaj at.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Onayla", where: "Bildirim satırının sonunda", does: "Bildirimi gerçek ödeme kaydına çevirir; fatura kapanırsa durum \"Ödendi\" olur." },
            { label: "Reddet", where: "Bildirim satırının sonunda", does: "Bildirimi reddeder; ödeme kaydı oluşmaz." },
            { label: "Hatırlat", where: "\"Gecikmiş ödemeler\" kartında", does: "Kalan tutar dolu hazır mesajla WhatsApp açar." },
          ],
        },
        {
          kind: "warning",
          text: "Onaylamadığın bildirim bakiyeye yansımaz — öğrenci \"ödedim ama hâlâ borçlu görünüyorum\" diyorsa ilk bakacağın yer bu karttır.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Talepler                                                           */
    /* ------------------------------------------------------------------ */
    {
      id: "leadler-bekleme",
      no: 26,
      chapter: "Talepler",
      title: "Leadler ve bekleme listesi",
      lead: "Siteden gelen ön görüşme talepleri Leadler'e, dönem doluyken gelenler Bekleme listesine düşer. Her iki havuz da tüm koçlara ortaktır.",
      where: "/koc/leadler",
      keywords: ["lead", "bekleme listesi", "öğrenciye çevir", "kayda çevir", "durum"],
      blocks: [
        {
          kind: "para",
          text: "Lead akışı: Yeni → Görüşüldü → Kayıt (ya da Kayıp). Bekleme akışı: Bekliyor → Davet edildi → Kayıt (ya da Ayrıldı); bekleyenler FIFO sıra numarasıyla listelenir. Her kartta WhatsApp düğmesi duruma uygun hazır mesaj açar (leadde ilk temas, beklemede davet). \"Öğrenciye çevir\" / \"Kayda çevir\" yeni öğrenci formunu ad, telefon ve sınav dolu açar — kaydı tamamlayınca durumu elle \"Kayıt\" yapmayı unutma.",
        },
        {
          kind: "steps",
          items: [
            "Panel'deki lead/bekleme şeridinden ya da Talepler menüsünden havuza gir.",
            "\"Yeni\" (leadlerde) ya da \"Bekliyor\" (beklemede) filtresiyle sıradakileri gör.",
            "\"WhatsApp\" ile ilk teması kur; görüşme sonrası durumu güncelle.",
            "Anlaşınca \"Öğrenciye çevir\" / \"Kayda çevir\" ile kayıt formuna geç.",
            "Kayıt tamamlanınca kartın durumunu \"Kayıt\" yap.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Tümü / Yeni / Görüşüldü / Kayıt / Kayıp", where: "/koc/leadler üstünde filtre çipleri", does: "Lead listesini duruma göre süzer; sayılar çipin içinde." },
            { label: "Tümü / Bekliyor / Davet edildi / Kayıt / Ayrıldı", where: "/koc/bekleme üstünde filtre çipleri", does: "Bekleme listesini duruma göre süzer." },
            { label: "Durum seçici", where: "Kartın sağ üstünde", does: "Kaydın durumunu değiştirir; değişiklik anında kaydedilir." },
            { label: "WhatsApp", where: "Kartın altında", does: "Duruma uygun hazır mesajla sohbet açar." },
            { label: "Öğrenciye çevir", where: "Lead kartının altında", does: "Yeni öğrenci formunu lead bilgileriyle dolu açar." },
            { label: "Kayda çevir", where: "Bekleme kartının altında", does: "Yeni öğrenci formunu bekleme bilgileriyle dolu açar." },
          ],
        },
        {
          kind: "tip",
          text: "Bu havuzlar kadro filtresinden bağımsızdır: leadleri, bekleme listesini, mesaj şablonlarını, içerik kütüphanesini ve görüşme listesini tüm koçlar ortak görür; yalnız öğrenci kadrosu sana atananlarla sınırlıdır.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Araçlar                                                            */
    /* ------------------------------------------------------------------ */
    {
      id: "asistan",
      no: 27,
      chapter: "Araçlar",
      title: "Koç Asistanı",
      lead: "Öğrencilerin hakkında soru sor, plan ve soru önerileri iste. Asistanın her yazma işlemi onay kartı olarak gelir; onaylamadan hiçbir şey değişmez.",
      where: "/koc/asistan",
      keywords: ["asistan", "ai", "sohbet", "onay bekliyor", "ajan"],
      blocks: [
        {
          kind: "para",
          text: "Asistan iki yerden açılır: tam sayfa /koc/asistan ve her sayfadaki sağ-alt yüzen \"Koç Asistanı\" düğmesi (panel kapansa da sohbet korunur). Okuma soruları (\"matematikte gerileyen kim?\") doğrudan cevaplanır. Yazma isteklerinde (\"salıya 50 paragraf sorusu ekle\") asistan işlemi yapmaz — sohbete \"Onay bekliyor\" kartı düşer; işlem ancak sen \"Onayla\" deyince uygulanır.",
        },
        {
          kind: "steps",
          items: [
            "Soruyu ya da isteği yaz; Enter (veya gönder oku) ile yolla.",
            "Boş ekrandaki hazır öneri çiplerinden biriyle de başlayabilirsin.",
            "Yazma isteğiyse gelen onay kartındaki özeti oku.",
            "\"Onayla\" ile uygula ya da \"Reddet\" ile iptal et.",
            "Uygulanan işlem sohbete \"Uygulandı\" satırı olarak düşer.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Koç Asistanı", where: "Her koç sayfasında sağ altta yüzen düğme", does: "Asistan panelini açar/kapatır." },
            { label: "Gönder", where: "Mesaj kutusunun sağında ok simgesi", does: "Mesajı yollar (Enter da gönderir; Shift+Enter yeni satır)." },
            { label: "Onayla", where: "\"Onay bekliyor\" kartında", does: "Önerilen yazma işlemini gerçekten uygular." },
            { label: "Reddet", where: "\"Onay bekliyor\" kartında", does: "Öneriyi uygulamadan kaldırır." },
          ],
        },
        {
          kind: "warning",
          text: "Onay kartındaki özet neyin yazılacağının tek güvencesidir — öğrenci adını, günü ve sayıları okumadan onaylama. Onaylanan işlem normal kayıt gibi kalıcıdır.",
        },
      ],
    },
    {
      id: "profil-ayarlar-eklenti",
      no: 28,
      chapter: "Araçlar",
      title: "Profil, ayarlar ve transkript eklentisi",
      lead: "Ayarlar hesabının merkezi: herkese açık koç profilin, iletişim/ödeme bilgilerin, rehberler ve canlı transkript eklentisinin token yönetimi.",
      where: "/koc/ayarlar",
      keywords: ["profil", "ayarlar", "eklenti", "token", "iban", "instagram"],
      blocks: [
        {
          kind: "para",
          text: "/koc/profil iki form taşır: üstteki herkese açık koç profili (fotoğraf, tanıtım, dereceler, bağlantılar — sitedeki /koclar sayfanı besler) ve alttaki ekip içi iletişim formu (telefon, Telegram, Instagram, Cal linki, IBAN — herkese açık değildir). /koc/eklenti ise tarayıcı eklentisiyle canlı transkript için token üretir: token yalnız oluşturulurken bir kez gösterilir, kaybolursa yenisini üretirsin.",
        },
        {
          kind: "steps",
          items: [
            "/koc/ayarlar'dan ihtiyacına göre karta git: rehber, profil ya da eklenti.",
            "Profilde tanıtımını doldurup \"Profili kaydet\"e bas; iletişim bilgilerini \"İletişimi kaydet\" ile ayrı kaydet.",
            "Eklenti için /koc/eklenti'de cihaz etiketi yazıp \"Oluştur\"a bas.",
            "Çıkan token'ı hemen \"Kopyala\" ile al ve eklentinin \"Eklentiyi bağla\" alanına yapıştır.",
            "Kullanmadığın cihazın token'ını \"İptal et\" ile kapat.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            { label: "Koç rehberini aç", where: "/koc/ayarlar, \"Kullanım rehberi\" kartında", does: "Bu rehberi açar." },
            { label: "Profilimi düzenle", where: "/koc/ayarlar, profil kartında", does: "/koc/profil sayfasını açar." },
            { label: "Eklentiyi bağla", where: "/koc/ayarlar, eklenti kartında", does: "/koc/eklenti sayfasını açar." },
            { label: "Profili kaydet", where: "/koc/profil, üst formun altında", does: "Herkese açık koç profilini kaydeder." },
            { label: "İletişimi kaydet", where: "/koc/profil, alt formun altında", does: "Telefon, Telegram, Instagram, Cal linki ve IBAN'ı kaydeder." },
            { label: "Oluştur", where: "/koc/eklenti, token formunda", does: "Yeni eklenti token'ı üretir ve bir kez gösterir." },
            { label: "Kopyala", where: "Yeni token kutusunda", does: "Token'ı panoya kopyalar — pencereden ayrılınca bir daha görünmez." },
            { label: "İptal et", where: "Token satırında", does: "Token'ı geçersiz kılar; eklenti o cihazda bağlantıyı kaybeder." },
            { label: "Sil", where: "İptal edilmiş token satırında", does: "Token kaydını listeden kaldırır." },
          ],
        },
        {
          kind: "note",
          text: "Koç ekleme, rol değiştirme ve öğrenci ataması yönetici işidir — Ayarlar'daki \"Ekip\" kartı seni yöneticine yönlendirir. IBAN yalnız yönetim panelinde görünür, herkese açık profile çıkmaz.",
        },
      ],
    },

    /* ------------------------------------------------------------------ */
    /*  Ek                                                                 */
    /* ------------------------------------------------------------------ */
    {
      id: "sorun-giderme",
      no: 0,
      chapter: "Ek",
      title: "Sık karşılaşılan durumlar",
      lead: "En çok sorulan \"neden olmuyor?\" sorularının kısa cevapları — çoğunun çözümü tek düğme uzağında.",
      keywords: ["sorun", "sss", "giremiyorum", "görünmüyor", "çalışmıyor"],
      blocks: [
        {
          kind: "para",
          text: "Aşağıdaki durumların hepsi rehberin ilgili bölümünde ayrıntılı anlatılıyor; burası hızlı teşhis içindir. Çözüm bulamazsan yöneticine yaz.",
        },
        {
          kind: "faq",
          items: [
            {
              q: "Öğrenci uygulamaya giremiyor.",
              a: "Kadro tablosunda \"PIN\" düğmesine bas. Hesabı varsa yeni PIN üretilir (giriş, kayıttaki telefona yeniden eşitlenir); hesabını hiç açmamışsa yeni davet linki çıkar. Telefon numarasının doğru olduğundan emin ol — numara giriş kimliğidir.",
            },
            {
              q: "Program öğrencide görünmüyor.",
              a: "Program taslakta kalmıştır. Kokpit → Program'da durum rozetine bak; \"Taslak\" ise \"Yayınla\"ya bas. Öğrenci, sen yayınlayana kadar hiçbir görev görmez.",
            },
            {
              q: "Öğrenci uygulamadan randevu alamıyor.",
              a: "Cal linkin eksiktir. /koc/profil'de \"Görüşme takvimi (Cal linki)\" alanını doldurup \"İletişimi kaydet\"e bas.",
            },
            {
              q: "Bir öğrencim listede görünmüyor.",
              a: "Öğrenci sana atanmamıştır. Atamayı yalnız yönetici yapar — yöneticine söyle.",
            },
            {
              q: "Öğrenci \"ödedim\" diyor ama hâlâ borçlu görünüyor.",
              a: "Ödeme bildirimi onay bekliyordur. /koc/muhasebe'deki \"Bekleyen ödeme bildirimleri\" kartından \"Onayla\" — bakiye ancak onaydan sonra düşer.",
            },
            {
              q: "Net hesaplaması elimdeki sonuçtan farklı çıktı.",
              a: "Net = doğru − yanlış ÷ bölen; bölen LGS'de 3, YKS ve KPSS'de 4. Ayrıca net kaydedildiği anda dondurulur — sonradan yapılan formül/soru değişiklikleri eski denemeleri değiştirmez.",
            },
            {
              q: "Canlı transkript başlamıyor.",
              a: "Tarayıcı WebGPU desteklemiyor ya da mikrofon izni reddedilmiş olabilir. Güncel Chrome/Brave/Edge kullan; adres çubuğundaki kilit simgesinden mikrofonu aç. İlk açılışta modelin (~250 MB) inmesini bekle. Olmuyorsa \"Ses kaydından\" ya da \"Metin yapıştır\" yolunu kullan.",
            },
            {
              q: "Transkript önerileri kayda geçmedi.",
              a: "Öneriler onaylanana kadar hiçbir yere yazılmaz. Transkript detayında her kartı tek tek \"Onayla\" — \"Uygulandı\" rozetini görmeden kayıt oluşmaz.",
            },
            {
              q: "Duyuru mesajları kendiliğinden gitmedi.",
              a: "Gitmez — sistemde otomatik gönderim yoktur. Duyuru ekranı her öğrenci için WhatsApp sohbetini hazırlar; göndermeyi tek tek sen yaparsın.",
            },
            {
              q: "Soru ızgarasında girdiğim değerler kayboldu.",
              a: "Hücre panelini kapatmak kaydetmez; ızgaranın altındaki \"Kaydet\" düğmesine basman gerekir. \"N günde kaydedilmemiş değişiklik var\" yazısı görünüyorsa henüz kaydedilmemiştir.",
            },
            {
              q: "Şablonlarda / içerikte düzenleme düğmelerini göremiyorum.",
              a: "Blogda yalnız kendi yazını, içerik kütüphanesinde yalnız kendi eklediğin içeriği yönetebilirsin. Başkasının kaydı için sahibine ya da yöneticine söyle.",
            },
            {
              q: "\"Analiz bekleyen\" sayısı düşmüyor.",
              a: "Deneme analizi girilmemiş demektir. \"Analiz gir\" ile konu eksiklerini kaydet ya da analiz gerçekten yapıldıysa satırdaki \"Analiz bekliyor\" düğmesine basarak elle işaretle.",
            },
          ],
        },
      ],
    },
    {
      id: "sozluk",
      no: 0,
      chapter: "Ek",
      title: "Sözlük",
      lead: "Panelde ve bu rehberde geçen terimlerin kısa tanımları.",
      keywords: ["terim", "tanım", "kavram", "sözlük"],
      blocks: [
        {
          kind: "para",
          text: "Terimler ekranlarda geçtiği hâliyle listelenmiştir. Bir rozet ya da etiketin anlamını arama kutusuna yazarak da bulabilirsin.",
        },
        {
          kind: "table",
          head: ["Terim", "Anlamı"],
          rows: [
            ["Net", "Doğru − yanlış ÷ bölen. Bölen LGS'de 3, YKS ve KPSS'de 4. Kaydedildiği anda dondurulur; formül değişse de geçmiş netler değişmez."],
            ["D/Y/B", "Doğru / Yanlış / Boş — soru takibi ve deneme girişindeki üçlü kırılım."],
            ["Kadro", "Sana atanan aktif öğrencilerin tamamı; Öğrenciler sayfasındaki liste."],
            ["Kayıt (enrollment)", "Öğrencinin bir sınava aktif kaydı. Soru, deneme, program ve muhasebe verilerinin tamamı öğrenciye değil bu kayda bağlanır."],
            ["Dönem", "İşletmenin o anki alım penceresi (kohort). Doluyken yeni talepler bekleme listesine düşer."],
            ["Lead", "Sitedeki iletişim formundan gelen ön görüşme talebi; Yeni → Görüşüldü → Kayıt/Kayıp akışıyla yönetilir."],
            ["Bekleme listesi", "Dönem doluyken gelen taleplerin FIFO (ilk gelen önce) sırası; Bekliyor → Davet edildi → Kayıt/Ayrıldı."],
            ["Kuruş", "Paranın saklandığı birim: 1 ₺ = 100 kuruş, tam sayı. Arayüzde ₺ girersin, sistem kuruşa çevirir — yuvarlama hatası olmaz."],
            ["Tam deneme", "Bölümün tüm derslerini kapsayan deneme; net gelişim grafiğine yalnız bunlar girer."],
            ["Branş denemesi", "Tek derse odaklı deneme; listede \"Branş\" rozetiyle görünür."],
            ["Analiz bekleyen", "Sonucu girilmiş ama konu-eksik analizi yapılmamış deneme; Panel'deki sayaç bunları sayar."],
            ["Eksik", "Deneme analizinde bir konudan kaçan soru sayısı (yanlış + boş toplamı)."],
            ["Taslak / Yayınlandı", "Haftalık programın durumu: taslak yalnız koça görünür, yayınlanınca öğrenciye açılır."],
            ["Öğrenci önerisi", "Öğrencinin kendine önerdiği haftalık program taslağı; koç inceleyip yayınlar."],
            ["Seri", "Öğrencinin kesintisiz günlük veri girişi yaptığı gün sayısı."],
            ["Son giriş", "Öğrencinin en son soru girişinden bu yana geçen süre rozeti; 3+ gün uyarı eşiğidir."],
            ["Davet linki", "Öğrencinin hesabını açıp PIN belirlediği tek kullanımlık bağlantı."],
            ["Şablon", "Duyuru ve kokpit WhatsApp menüsündeki hazır mesaj; {ad} gönderimde öğrencinin adıyla değişir. Havuz tüm koçlara ortaktır."],
            ["Transkript", "Görüşmenin yazıya dökülmüş hâli (canlı mikrofon, ses dosyası ya da yapıştırılan metin)."],
            ["Öneri (çıkarım)", "AI'ın transkriptten veya asistandan çıkardığı, onay bekleyen yazma işlemi. Onaylanmadan hiçbir kayda yazılmaz."],
            ["KVKK onayı", "Ses kaydının saklanması için öğrenci/veli izni; işaretlenmezse yalnız metin kaydedilir."],
            ["Kokpit", "Tek öğrencinin 10 sekmelik yönetim ekranı (/koc/ogrenciler/[id])."],
          ],
        },
      ],
    },
  ],
};

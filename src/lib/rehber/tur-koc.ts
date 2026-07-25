import type { Tour } from "@/lib/rehber/tur-types";

/**
 * Koç paneli ürün turu — paneli gezinme sırasıyla, ekran ekran tanıtan
 * tam ekran sunum. Rehber (ara-bul-oku) ve akıştan (iş sırası) farklı:
 * burada her adım BİR ekranı tanıtır ve en sık kullanılan düğmeleri gösterir.
 * Yöneticiye özel ekranlar bu turda YOK; onların ayrı bir turu var.
 */
export const kocTuru: Tour = {
  id: "koc",
  title: "Koç paneli turu",
  subtitle:
    "Paneli baştan sona, ekran ekran gezelim — her adımda bir ekran, üstündeki önemli alanlar ve en çok kullanacağın düğmeler.",
  guideBase: "/koc/rehber",
  steps: [
    {
      id: "hosgeldin",
      nav: "Tur",
      title: "Koç paneline hoş geldin",
      purpose:
        "Bu tur paneli gezinme sırasıyla 17 adımda tanıtır: her adım bir ekran — ne işe yarar, üstünde ne var, hangi düğmelere basarsın.",
      highlights: [
        {
          label: "Kapsam",
          text: "Panel'den başlayıp Öğrenciler, kokpit, Denemeler, Duyuru, Asistan, Görüşmeler, Canlı, Muhasebe, Talepler & İçerik ve Ayarlar'a kadar tüm ekranları geziyoruz.",
        },
        {
          label: "Gezinme",
          text: "Ok tuşlarıyla ya da İleri / Geri düğmeleriyle ilerlersin; istediğin an çıkıp kaldığın yerden dönebilirsin.",
        },
        {
          label: "Ekranı aç",
          text: "Rotası olan adımlarda \"Ekranı aç\" düğmesiyle anlatılan ekrana gerçekten gidebilirsin.",
        },
        {
          label: "Rehberde oku",
          text: "Her adımın altındaki \"Rehberde oku\" bağlantısı, aynı konunun ayrıntılı rehber bölümünü açar.",
        },
      ],
      section: "panel-haritasi",
    },
    {
      id: "panel",
      nav: "Panel",
      title: "Panel: günün özeti tek ekranda",
      route: "/koc",
      purpose:
        "Güne buradan başlarsın: haftanın sayıları, bugün ilgi bekleyen öğrenciler ve yapılacaklar tek bakışta önünde.",
      highlights: [
        {
          label: "5 kutu",
          text: "Aktif öğrenci, Bu hafta soru, Bu hafta deneme, Analiz bekleyen ve Gecikmiş ödeme — kadronun haftalık nabzı.",
        },
        {
          label: "Bugün hatırlat",
          text: "3+ gündür soru girmeyen öğrencileri listeler; tek dokunuşla WhatsApp'tan dürtersin.",
        },
        {
          label: "Bekleyen işler",
          text: "Analiz bekleyen denemeler ve yayınlanmayı bekleyen programlar kart kart sıralanır — öğrenci önerileri en üstte.",
        },
        {
          label: "Yaklaşan görüşmeler",
          text: "Önümüzdeki 7 günün planlı görüşmeleri alt kartta durur.",
        },
        {
          label: "Uyarı bantları",
          text: "Yeni lead ya da bekleme listesine biri düştüğünde sayfanın üstünde renkli bir bant belirir.",
        },
      ],
      buttons: [
        { label: "Yeni öğrenci", does: "Kadroya yeni öğrenci ekleme formunu açar." },
        {
          label: "WhatsApp",
          does: "Sessiz kalan öğrenciye hazır hatırlatma mesajıyla sohbet açar.",
        },
        {
          label: "Analiz gir",
          does: "Bekleyen denemenin analiz ekranına götürür.",
        },
        { label: "Nasıl işler", does: "Baştan sona iş akışı rehberini açar." },
      ],
      tip: "Gecikmiş ödeme kutusu tıklanabilir — doğrudan Muhasebe'ye götürür.",
      section: "panel",
    },
    {
      id: "ogrenciler",
      nav: "Öğrenciler",
      title: "Öğrenciler: kadronun tamamı",
      route: "/koc/ogrenciler",
      purpose:
        "Tüm kadron tek tabloda: kim ne kadar çalışıyor, ödemesi ne durumda, en son ne zaman giriş yaptı — hepsi satır satır.",
      highlights: [
        {
          label: "Sınav filtreleri",
          text: "Üstteki Tümü / KPSS / YKS / LGS çipleriyle listeyi tek dokunuşla daraltırsın.",
        },
        {
          label: "Sütunlar",
          text: "Ad, Sınav, Bu hafta soru, Süre (bugün · hafta · ay), Ödeme, Son giriş ve Davet yan yana durur.",
        },
        {
          label: "Rozetler",
          text: "Ödeme ve Son giriş rozetleri renkle konuşur: gecikme ve sessizlik daha sen aramadan görünür.",
        },
        {
          label: "Davet sütunu",
          text: "Öğrenci hesabını açmadıysa davet linkini kopyalar ya da WhatsApp'tan yollarsın; açtıysa \"Kabul edildi\" rozeti durur.",
        },
      ],
      buttons: [
        { label: "Yeni öğrenci", does: "Öğrenci ekleme formunu açar." },
        {
          label: "Linki kopyala",
          does: "Öğrencinin davet linkini panoya kopyalar.",
        },
        {
          label: "WhatsApp'tan gönder",
          does: "Davet linkini hazır mesajla WhatsApp'ta açar.",
        },
      ],
      tip: "Ada tıklayınca öğrencinin kokpitine geçersin — günlük işin çoğu orada döner. Davet sütunundaki küçük düğmeyle PIN de sıfırlarsın.",
      section: "ogrenciler",
    },
    {
      id: "yeni-ogrenci",
      nav: "Öğrenciler",
      title: "Yeni öğrenci: iki dakikada kadroda",
      route: "/koc/ogrenciler/yeni",
      purpose:
        "Ad ve sınavı seç, öğrenciyi oluştur; sistem davet linkini üretir, sen WhatsApp'tan yollarsın — öğrenci PIN'ini kendisi belirler.",
      highlights: [
        {
          label: "Zorunlu alanlar",
          text: "Yalnız Ad Soyad ve sınav (KPSS / YKS / LGS) zorunlu; YKS'de Sayısal / Eşit Ağırlık / Sözel alanını da seçersin.",
        },
        {
          label: "Telefon",
          text: "Telefon öğrencinin giriş kimliğidir — girersen davet WhatsApp'tan tek dokunuşla gider.",
        },
        {
          label: "Hedef",
          text: "Hedef metni kokpit başlığında görünür ve motivasyon dilini besler.",
        },
        {
          label: "Davet kartı",
          text: "Kayıttan hemen sonra davet linki ekrana gelir; öğrenci bu linkten PIN'ini belirleyip hesabını açar.",
        },
      ],
      buttons: [
        { label: "Öğrenciyi oluştur", does: "Formu kaydeder ve davet linkini üretir." },
        {
          label: "WhatsApp'tan gönder",
          does: "Daveti hazır mesajla öğrencinin WhatsApp'ına taşır.",
        },
        {
          label: "Öğrenci sayfasına git",
          does: "Yeni öğrencinin kokpitini açar.",
        },
      ],
      tip: "Telefon girmezsen WhatsApp gönderimi kapalı kalır; linki elle kopyalayıp iletmen gerekir.",
      section: "yeni-ogrenci",
    },
    {
      id: "kokpit",
      nav: "Öğrenci kokpiti",
      title: "Öğrenci kokpiti: her şey tek çatı altında",
      route: "/koc/ogrenciler",
      purpose:
        "Bir öğrenciyle ilgili her iş burada döner. Başlıkta kimlik ve hızlı eylemler, altında 10 sekmelik ikincil gezinme.",
      highlights: [
        {
          label: "10 sekme",
          text: "Genel Bakış, Soru Takibi, Denemeler, Program, Görüşmeler, Konular, Kaynaklar, İçerik, Muhasebe ve Profil — soldan sağa iş sırasına yakın dizili.",
        },
        {
          label: "Başlık rozetleri",
          text: "Sınav ve alan rozeti, \"Davet kabul edildi\" ya da \"Davet bekliyor\" durumu ve hedef metni başlıkta durur.",
        },
        {
          label: "WhatsApp menüsü",
          text: "Başlıktaki WhatsApp düğmesi açılır menüdür: boş sohbet ya da grup grup hazır şablonlarla (Takip, Ödeme...) mesaj açarsın.",
        },
        {
          label: "Davet eylemleri",
          text: "Öğrenci hesabını açmadıysa davet linkini kopyalama ve WhatsApp'tan gönderme düğmeleri başlıkta bekler.",
        },
      ],
      buttons: [
        {
          label: "WhatsApp",
          does: "Şablon menüsünü açar; seçtiğin mesaj öğrencinin adıyla kişiselleşir.",
        },
        {
          label: "Linki kopyala",
          does: "Bekleyen davet linkini panoya alır.",
        },
      ],
      tip: "Kokpite en hızlı yol Öğrenciler tablosunda ada tıklamak; Panel'deki listelerdeki adlar da doğrudan buraya getirir.",
      section: "kokpit",
    },
    {
      id: "kokpit-takip",
      nav: "Öğrenci kokpiti",
      title: "Genel Bakış ve Soru Takibi",
      route: "/koc/ogrenciler",
      purpose:
        "Genel Bakış öğrencinin fotoğrafını çeker; Soru Takibi haftalık soru girişinin işlendiği ızgaradır — ikisi kokpitin kalbidir.",
      highlights: [
        {
          label: "Özet kutular",
          text: "Toplam soru, Bu hafta, Çalışma süresi, Son net, Seri, Ödeme ve Son giriş tek sırada durur.",
        },
        {
          label: "Net gelişimi",
          text: "Tam denemelerin net grafiği ile yanındaki otomatik içgörüler trendi sen yorumlamadan söyler.",
        },
        {
          label: "Hafta ızgarası",
          text: "Soru Takibi'nde gün × ders ızgarasına sayıları girersin; hafta Pazartesi başlar ve koç olarak öğrencinin girişlerini düzenleyebilirsin.",
        },
        {
          label: "D/Y/B ayrıntısı",
          text: "İstersen hücreyi Doğru / Yanlış / Boş olarak açarsın; üçü de dolunca toplam ve net kendiliğinden hesaplanır.",
        },
        {
          label: "Ders tablosu",
          text: "\"Ders ders soru ve doğruluk\" tablosu son 8 haftayı, öğrencinin Gelişim sayfasında gördüğüyle bire bir gösterir.",
        },
      ],
      buttons: [
        { label: "Kaydet", does: "Izgaradaki tüm değişiklikleri tek seferde yazar." },
      ],
      tip: "Hızlı yol tek sayı (toplam) girmektir; D/Y/B'yi yalnız doğruluk analizi istediğin derslerde aç.",
      section: "soru-takibi",
    },
    {
      id: "kokpit-program",
      nav: "Öğrenci kokpiti",
      title: "Program: haftalık planı kur ve yayınla",
      route: "/koc/ogrenciler",
      purpose:
        "Haftalık programı ders × konu görevleriyle burada kurarsın. Taslak sende kalır; öğrenci ancak Yayınla'ya bastığında görür.",
      highlights: [
        {
          label: "Durum şeridi",
          text: "Taslak / Yayınlandı / Tamamlandı rozeti, tamamlanma yüzdesi ve öğrenci önerisi işareti en üstte durur.",
        },
        {
          label: "Strateji paneli",
          text: "Haftanın mottosu ve Koç notu programdan ayrı bir panelde — öğrencinin haftaya bakışını buradan yönlendirirsin.",
        },
        {
          label: "İki görünüm",
          text: "\"Hafta · ders\" ve \"Gün\" görünümleri arasında geçerek görevleri istediğin açıdan düzenlersin.",
        },
        {
          label: "Öğrenci önerisi",
          text: "Öğrenci kendi taslağını gönderebilir; \"Öğrenci önerisi\" rozetiyle gelir, sen düzenleyip yayınlarsın.",
        },
      ],
      buttons: [
        {
          label: "Yayınla",
          does: "Taslağı öğrenciye açar — basılmadan öğrenci programı hiç görmez.",
        },
        {
          label: "AI ile oluştur",
          does: "Öğrencinin verisinden haftalık konu taslağı önerir; seçtiklerini eklersin.",
        },
        { label: "Görev ekle", does: "Güne yeni ders × konu görevi ekler." },
        {
          label: "Geçen haftadan kopyala",
          does: "Boş haftayı önceki haftanın konularıyla doldurur.",
        },
      ],
      tip: "Uzun koç notu yazarsan sistem \"Notu görevlere dönüştür\" önerir — öğrenciler işaretlenebilir görev listesini çok daha rahat takip ediyor.",
      section: "program-yayinla",
    },
    {
      id: "kokpit-deneme",
      nav: "Öğrenci kokpiti",
      title: "Denemeler ve deneme analizi",
      route: "/koc/ogrenciler",
      purpose:
        "Deneme sonuçlarını D/Y/B olarak girersin, net otomatik hesaplanır; ardından analizle yanlışları konu konu işlersin.",
      highlights: [
        {
          label: "Deneme tablosu",
          text: "Tarih, Deneme, Bölüm, Kapsam (Tam / Branş), Net ve Analiz sütunlarıyla tüm geçmiş tek listede.",
        },
        {
          label: "Net hesabı",
          text: "Net = doğru − yanlış ÷ bölen; bölen LGS'de 3, YKS ve KPSS'de 4 — sen sadece D/Y/B girersin.",
        },
        {
          label: "Analiz ekranı",
          text: "Analiz'de yanlış ve boşları konulara dağıtırsın; bu veriler Konular sekmesindeki zayıf konu listesini besler.",
        },
        {
          label: "Analiz durumu",
          text: "Analizi kaydedince deneme \"yapıldı\" işaretlenir ve Panel'deki bekleyenler listesinden düşer.",
        },
      ],
      buttons: [
        { label: "Yeni deneme", does: "D/Y/B girişli deneme formunu açar." },
        { label: "Denemeyi kaydet", does: "Sonucu kaydeder; net o anki formülle saklanır." },
        { label: "Analiz", does: "Denemenin konu bazlı analiz ekranına gider." },
        { label: "Analizi kaydet", does: "Konu eksiklerini yazar ve denemeyi analiz yapıldı işaretler." },
      ],
      tip: "Branş denemeleri net grafiğine girmez; grafik yalnız tam denemelerden çizilir.",
      section: "deneme-analizi",
    },
    {
      id: "kokpit-konu",
      nav: "Öğrenci kokpiti",
      title: "Konular, Kaynaklar ve İçerik",
      route: "/koc/ogrenciler",
      purpose:
        "Bu üç sekme öğrencinin ne bildiğini, neyle çalıştığını ve ona ne verdiğini izler — müfredat, kitaplık ve atanan materyal.",
      highlights: [
        {
          label: "Konu ilerleme",
          text: "Konular sekmesi ders ders ilerlemeyi ve deneme analizlerinden beslenen en zayıf konuları gösterir.",
        },
        {
          label: "Konu × kaynak",
          text: "Bitti matrisi hangi konunun hangi kaynakta bitirildiğini tek tabloda işaretler.",
        },
        {
          label: "Kaynak takibi",
          text: "Kaynaklar sekmesinde öğrencinin kitaplarını yönetir, kaynak başına çözülen soru ve konuyu izlersin.",
        },
        {
          label: "İçerik sekmesi",
          text: "Öğrencinin gördüğü video, PDF ve notlar izlenme durumuyla listelenir — ne atadıysan karşılığını görürsün.",
        },
      ],
      tip: "Zayıf konu listesi deneme analizlerinden dolar; analiz girmeden bu ekranlar boş kalır.",
      section: "konular-kaynaklar",
    },
    {
      id: "denemeler",
      nav: "Denemeler",
      title: "Haftalık deneme panosu",
      route: "/koc/denemeler",
      purpose:
        "Kadronun bu haftaki tüm deneme netleri tek tabloda. Kim girdi, kim girmedi, ortalama nerede — haftalık kalite kontrolün.",
      highlights: [
        {
          label: "Hafta gezinme",
          text: "Ok düğmeleriyle önceki ve sonraki haftalara gidersin; hafta her zaman Pazartesi başlar.",
        },
        {
          label: "Özet kutular",
          text: "Deneme sayısı, Ortalama net ve En yüksek net haftanın fotoğrafını üç kutuda verir.",
        },
        {
          label: "Sonuçlar tablosu",
          text: "O hafta girilen her deneme öğrenci adı, deneme adı ve netiyle satır satır listelenir.",
        },
      ],
      tip: "Pano girilmiş denemeleri gösterir; yeni deneme girişi öğrencinin kokpitindeki Denemeler sekmesinden yapılır.",
      section: "deneme-panosu",
    },
    {
      id: "duyuru",
      nav: "Duyuru",
      title: "Duyuru: toplu WhatsApp, tek tek onay",
      route: "/koc/duyuru",
      purpose:
        "Tüm öğrencilerine kişiselleştirilmiş WhatsApp mesajı hazırlarsın; her mesajı sen açıp yollarsın — otomatik gönderim yok.",
      highlights: [
        {
          label: "Kişiselleştirme",
          text: "Mesajdaki {ad} her öğrencinin kendi adıyla değişir; önizleme ilk öğrenci üzerinden anında görünür.",
        },
        {
          label: "Hazır şablonlar",
          text: "Takip, Ödeme, Yeni öğrenci ve Önemli gruplarındaki şablonlar tek dokunuşla mesaj kutusuna dolar.",
        },
        {
          label: "Filtre ve arama",
          text: "Sınav çipleri ve \"Öğrenci ara\" kutusuyla alıcı listesini daraltırsın.",
        },
        {
          label: "Gönderim takibi",
          text: "Kime mesaj açtıysan yeşil işaretlenir; \"mesajlandı\" sayacı kimin kaldığını söyler.",
        },
      ],
      buttons: [
        {
          label: "WhatsApp",
          does: "O öğrencinin kişiselleşmiş mesajını wa.me'de açar; göndermek sana kalır.",
        },
        { label: "Yönet", does: "Şablonları ekleyip düzenleyeceğin yönetim penceresini açar." },
      ],
      tip: "Mesajlandı işaretleri sayfayı yenileyince sıfırlanır — toplu duyuruyu tek oturuşta bitir.",
      section: "duyuru",
    },
    {
      id: "asistan",
      nav: "Asistan",
      title: "Koç Asistanı: sor, önersin, sen onayla",
      route: "/koc/asistan",
      purpose:
        "Kadron hakkında doğal dille soru sorar, plan ve soru eklemesi istersin. Okuma anında yanıtlanır; her yazma işlemi onayına sunulur.",
      highlights: [
        {
          label: "Sohbet",
          text: "\"Matematikte gerileyen öğrenciler kim?\" gibi sorulara verinden yanıt alırsın; öneri çipleri başlangıç fikri verir.",
        },
        {
          label: "Onay kartları",
          text: "Asistan bir değişiklik önerdiğinde \"Onay bekliyor\" kartı çıkar — ne yapacağı özetle yazar.",
        },
        {
          label: "Güvenli yazma",
          text: "Sen Onayla demeden hiçbir öneri öğrenci verisine işlenmez; Reddet dersen iz bırakmadan düşer.",
        },
      ],
      buttons: [
        { label: "Onayla", does: "Bekleyen öneriyi gerçekten uygular." },
        { label: "Reddet", does: "Öneriyi uygulamadan kaldırır." },
      ],
      tip: "İşlem isteklerinde öğrenci adını ve günü açık yaz — \"Yusuf'a salı 50 paragraf sorusu ekle\" gibi; asistan ne kadar net, öneri o kadar isabetli.",
      section: "asistan",
    },
    {
      id: "gorusmeler",
      nav: "Görüşmeler",
      title: "Görüşmeler: planlı ve geçmiş, tek panoda",
      route: "/koc/gorusmeler",
      purpose:
        "Tüm öğrencilerin planlı ve geçmiş koçluk görüşmeleri burada. Yeni görüşme planlamak içinse öğrencinin kokpitine girersin.",
      highlights: [
        {
          label: "Cal uyarısı",
          text: "Profilinde Cal linki yoksa üstte \"Görüşme takvimin eksik\" uyarısı çıkar — öğrencilerin uygulamadan randevu alamaz.",
        },
        {
          label: "Planlamayanlar",
          text: "Takvimin hazırken randevu almamış öğrenciler ayrı kartta listelenir; tek dokunuş WhatsApp hatırlatması hazırdır.",
        },
        {
          label: "Yaklaşan / Geçmiş",
          text: "Görüşmeler tarihe göre iki listede akar; Planlandı, Yapıldı, Gelmedi ve İptal rozetleri durumu söyler.",
        },
        {
          label: "Görüşme sonrası",
          text: "Kokpitte görüşmeyi Yapıldı işaretleyip aynı yerden gelecek haftanın programını başlatırsın.",
        },
      ],
      buttons: [
        { label: "Hatırlat", does: "Randevu almayan öğrenciye hazır WhatsApp mesajı açar." },
        { label: "Görüşme planla", does: "Kokpitte tarih ve saatiyle görüşme oluşturur." },
        { label: "Yapıldı", does: "Görüşmeyi tamamlandı olarak işaretler." },
        { label: "Program oluştur", does: "Görüşmenin ardından gelecek haftanın taslağını açar." },
      ],
      tip: "Cal linkini bir kez profiline ekle; sonrasında öğrenciler müsait saatlerinden kendileri randevu alır.",
      section: "gorusme-planlama",
    },
    {
      id: "canli",
      nav: "Canlı",
      title: "Canlı transkript: görüşmeyi yazıya çevir",
      route: "/koc/canli-transkript",
      purpose:
        "Öğrenciyi seç, Başlat'a bas: görüşme cihazında (WebGPU) canlı yazıya dönüşür. Varsayılanda ses kaydedilmez, yalnız metin saklanır.",
      highlights: [
        {
          label: "Öğrenci seçimi",
          text: "Önce öğrenciyi seçersin; transkript o öğrencinin kaydına bağlanır.",
        },
        {
          label: "KVKK kutusu",
          text: "Ses kaydını da saklamak istersen onay kutusunu işaretlersin — işaretlemezsen ses cihazdan hiç çıkmaz.",
        },
        {
          label: "Durdur ve devam",
          text: "Durdur'dan sonra \"Devam et\" aynı transkripte ekler, \"Yeniden başlat\" sıfırdan açar.",
        },
        {
          label: "AI çıkarımı",
          text: "Kaydettikten sonra çıkarım, konuşmadan soru takibi, deneme, görev ve not önerileri üretir — hepsi onayınla işlenir.",
        },
      ],
      buttons: [
        { label: "Başlat", does: "Mikrofonu açar ve canlı yazıya çevirmeye başlar." },
        { label: "Durdur", does: "Dinlemeyi durdurur; metin ekranda kalır." },
        { label: "Kaydet ve incele", does: "Metni kaydedip AI çıkarım ekranına götürür." },
        { label: "Onayla", does: "Çıkarılan öneriyi öğrencinin verisine işler." },
      ],
      tip: "Herhangi bir koç sayfasında g'ye ardından t'ye bas — bu ekrana anında gelirsin.",
      section: "canli-transkript",
    },
    {
      id: "muhasebe",
      nav: "Muhasebe",
      title: "Muhasebe: fatura, ödeme ve gecikmeler",
      route: "/koc/muhasebe",
      purpose:
        "Ayın gelir fotoğrafı, öğrencilerin bildirdiği ödemeler ve gecikmiş faturalar tek ekranda — tahsilatı buradan yönetirsin.",
      highlights: [
        {
          label: "4 kutu",
          text: "Bu ay gelir, Tahsil edilmemiş, Tahsilat oranı ve Gecikmiş — ayın mali özeti üstte durur.",
        },
        {
          label: "Ödeme bildirimleri",
          text: "Öğrencinin \"ödedim\" bildirimleri onay kartında bekler; Onayla dediğinde gerçek ödeme kaydına dönüşür.",
        },
        {
          label: "Gecikmiş ödemeler",
          text: "Vadesi geçen faturalar bakiyeleriyle listelenir; hazır WhatsApp hatırlatması yanı başında.",
        },
        {
          label: "Alt sayfalar",
          text: "Faturalar ve Ödemeler düğmeleri tam listelere açılır; ücret planı öğrencinin kokpitindeki Muhasebe sekmesindedir.",
        },
      ],
      buttons: [
        { label: "Ödeme al", does: "Elle ödeme kaydeder; fatura varsa bakiyeyi kapatır." },
        { label: "Onayla", does: "Öğrencinin ödeme bildirimini gerçek kayda çevirir." },
        { label: "Hatırlat", does: "Geciken öğrenciye tutarlı hazır mesaj açar." },
        { label: "Faturalar", does: "Tüm faturaların listesine gider." },
      ],
      tip: "Bildirilen tutar yanlışsa Onayla'ma — Reddet deyip doğru tutarı \"Ödeme al\" ile elle gir.",
      section: "muhasebe",
    },
    {
      id: "talepler-icerik",
      nav: "Talepler & İçerik",
      title: "Talepler ve içerik: lead, bekleme, kütüphane, blog",
      route: "/koc/leadler",
      purpose:
        "Gezinmedeki iki açılır menü: Talepler'de siteden gelen lead ve bekleme listesi, İçerik'te kütüphane ve blog yönetimi.",
      highlights: [
        {
          label: "Lead havuzu",
          text: "Siteden gelen ön görüşme talepleri Yeni → Görüşüldü → Kayıt / Kayıp hattında ilerler; WhatsApp ilk temas mesajı hazırdır.",
        },
        {
          label: "Bekleme listesi",
          text: "Dönem doluyken gelen talepler sıra numarasıyla bekler; davet mesajı ve durum takibi aynı ekranda.",
        },
        {
          label: "İçerik kütüphanesi",
          text: "Video, PDF, not ve bağlantıları ekler, kütüphanede paylaşır ya da tek öğrenciye atarsın.",
        },
        {
          label: "Blog",
          text: "Kısa, uygulanabilir çalışma yazıları yazarsın; yayına aldıkların sitede /blog altında görünür.",
        },
      ],
      buttons: [
        {
          label: "Öğrenciye çevir",
          does: "Lead'in adı, telefonu ve sınavıyla önceden dolu yeni öğrenci formunu açar.",
        },
        {
          label: "Kayda çevir",
          does: "Bekleme listesindekini aynı şekilde kayıt formuna taşır.",
        },
        { label: "İçerik ekle", does: "Kütüphaneye yeni materyal ekleme penceresini açar." },
        { label: "Yeni yazı", does: "Boş blog taslağı oluşturur." },
      ],
      tip: "Lead'i kayda çevirince formu baştan doldurma — \"Öğrenciye çevir\" bilgileri senin yerine taşır.",
      section: "leadler-bekleme",
    },
    {
      id: "ayarlar",
      nav: "Ayarlar",
      title: "Ayarlar: hesabın, profilin ve buradan sonrası",
      route: "/koc/ayarlar",
      purpose:
        "Hesap bilgilerin, herkese açık koç profilin ve transkript eklentin burada. Tur bitti — ayrıntı gerektiğinde rehber hep elinin altında.",
      highlights: [
        {
          label: "Hesabın",
          text: "Adın ve rolün (Koç) burada görünür; ekip değişiklikleri için yöneticinle konuşursun.",
        },
        {
          label: "Profilin",
          text: "Fotoğraf, tanıtım, dereceler ve \"Görüşme takvimi (Cal linki)\" profil sayfandan düzenlenir — /koclar'daki sayfanı besler.",
        },
        {
          label: "Eklenti",
          text: "Canlı transkript tarayıcı eklentisinin token'ını buradan bağlarsın.",
        },
        {
          label: "Rehber kapısı",
          text: "Kullanım rehberi kartından bu tura, ekran ekran koç rehberine ve baştan sona iş akışına her zaman dönersin.",
        },
      ],
      buttons: [
        { label: "Profilimi düzenle", does: "Herkese açık profilini ve Cal linkini düzenlemeye açar." },
        { label: "Eklentiyi bağla", does: "Transkript eklentisi token yönetimine gider." },
        { label: "Koç rehberini aç", does: "Ekran ekran ayrıntılı referans rehberi açar." },
        { label: "Baştan sona nasıl işler", does: "İş sırasını anlatan akış rehberine götürür." },
      ],
      tip: "Cal linkini profiline eklemeden öğrencilerin uygulamadan randevu alamaz — turdan çıkmadan önce kontrol et.",
      section: "profil-ayarlar-eklenti",
    },
  ],
};

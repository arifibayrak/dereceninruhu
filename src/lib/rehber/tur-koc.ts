import type { Tour } from "@/lib/rehber/tur-types";

/**
 * Koç paneli ürün turu — paneli gezinme sırasıyla, ekran ekran tanıtan
 * tam ekran sunum. Rehber (ara-bul-oku) ve akıştan (iş sırası) farklı:
 * burada her adım BİR ekranı ya da ekranın bir bölgesini tanıtır ve en sık
 * kullanılan düğmeleri gösterir. `target` verilen adımlarda sayfadaki ilgili
 * bölgeye ışık tutulur. Yöneticiye özel ekranlar bu turda YOK; onların ayrı
 * bir turu var.
 */
export const kocTuru: Tour = {
  id: "koc",
  title: "Koç paneli turu",
  subtitle:
    "Paneli baştan sona, 34 adımda ekran ekran gezelim — her adımda bir ekran ya da ekranın bir bölgesi, üstündeki önemli alanlar ve en çok kullanacağın düğmeler.",
  guideBase: "/koc/rehber",
  steps: [
    {
      id: "hosgeldin",
      nav: "Tur",
      title: "Koç paneline hoş geldin",
      purpose:
        "Bu tur paneli gezinme sırasıyla 34 adımda tanıtır: her adım bir ekran ya da ekranın bir bölgesi — ne işe yarar, üstünde ne var, hangi düğmelere basarsın.",
      highlights: [
        {
          label: "Kapsam",
          text: "Panel'den başlayıp Öğrenciler, kokpit, Denemeler, Duyuru, Asistan, Görüşmeler, Canlı, Muhasebe, Talepler, İçerik ve Ayarlar'a kadar tüm ekranları geziyoruz.",
        },
        {
          label: "Örnek kayıtlar",
          text: "Kokpit ve transkript adımları kurgusal bir öğrenci ve kurgusal bir görüşme üzerinde ilerler — gerçek ekranları gerçek veriye dokunmadan görürsün.",
        },
        {
          label: "Gezinme",
          text: "Ok tuşlarıyla ya da İleri / Geri düğmeleriyle ilerlersin; istediğin an çıkıp kaldığın yerden dönebilirsin.",
        },
        {
          label: "Ekranı aç",
          text: 'Rotası olan adımlarda "Ekranı aç" düğmesiyle anlatılan ekrana gerçekten gidebilirsin.',
        },
        {
          label: "Rehberde oku",
          text: 'Her adımın altındaki "Rehberde oku" bağlantısı, aynı konunun ayrıntılı rehber bölümünü açar.',
        },
      ],
      section: "panel-haritasi",
    },
    {
      id: "panel",
      nav: "Panel",
      title: "Panel: günün özeti tek ekranda",
      route: "/koc",
      target: "panel-kutular",
      purpose:
        "Güne buradan başlarsın: haftanın sayıları, bugün ilgi bekleyen öğrenciler ve yapılacaklar tek bakışta önünde.",
      highlights: [
        {
          label: "5 kutu",
          text: "Aktif öğrenci, Bu hafta soru, Bu hafta deneme, Analiz bekleyen ve Gecikmiş ödeme — kadronun haftalık nabzı en üstte durur.",
        },
        {
          label: "Hafta etiketi",
          text: "Başlıktaki hafta aralığı Pazartesi başlar; kutulardaki tüm sayılar bu haftaya aittir.",
        },
        {
          label: "Sayfanın devamı",
          text: "Kutulardan sonra uyarı bantları ve dört iş kartı gelir — ikisini de sıradaki adımlarda tek tek gezeceğiz.",
        },
      ],
      buttons: [
        {
          label: "Yeni öğrenci",
          does: "Kadroya yeni öğrenci ekleme formunu açar.",
        },
        {
          label: "Paneli tanı",
          does: "Bu turu istediğin zaman yeniden başlatır.",
        },
      ],
      tip: "Gecikmiş ödeme kutusu tıklanabilir — doğrudan Muhasebe'ye götürür.",
      section: "panel",
    },
    {
      id: "panel-uyarilar",
      nav: "Panel",
      title: "Uyarı bantları: yeni talepler seni bulur",
      route: "/koc",
      target: "panel-uyarilar",
      purpose:
        "Sayfanın üstündeki renkli bantlar yeni talepleri haber verir. Sayı sıfırsa bant hiç görünmez — bant görüyorsan gerçekten bekleyen biri var.",
      highlights: [
        {
          label: "Lead bandı",
          text: '"N yeni lead ön görüşme bekliyor" bandına tıklayınca Leadler ekranı, Yeni filtresi açık halde gelir — ilk temasa hazır.',
        },
        {
          label: "Bekleme bandı",
          text: '"N kişi bekleme listesinde sırada" bandı Bekleme listesini Bekliyor filtresiyle açar — sıradaki adayları görürsün.',
        },
        {
          label: "Yalnız gerekince",
          text: "Bantlar sayaç sıfırlanınca kendiliğinden kaybolur; panelde boş uyarı asla durmaz.",
        },
      ],
      tip: "Bantları günün ilk işinde tıkla — lead ne kadar taze aranırsa kayda dönme olasılığı o kadar yüksek.",
      section: "panel",
    },
    {
      id: "panel-kartlar",
      nav: "Panel",
      title: "Dört iş kartı: bugünün yapılacakları",
      route: "/koc",
      target: "panel-kartlar",
      purpose:
        "Panelin gövdesi dört karttır: kim sessiz kaldı, hangi deneme analizsiz, hangi program taslakta, hangi görüşme yaklaşıyor.",
      highlights: [
        {
          label: "Bugün hatırlat",
          text: "3+ gündür soru girmeyen öğrenciler kaç gündür sessiz olduklarıyla listelenir; tek dokunuşla WhatsApp'tan dürtersin.",
        },
        {
          label: "Analiz bekleyen denemeler",
          text: 'Girilen ama birlikte analiz edilmemiş denemeler burada bekler; "Analiz gir" seni doğrudan analiz ekranına götürür.',
        },
        {
          label: "Yayınlanmayı bekleyen programlar",
          text: 'Taslak kalan haftalık programlar listelenir; "Öğrenci önerisi" rozetlileri öncelikle incele — öğrenci senden yanıt bekliyor.',
        },
        {
          label: "Yaklaşan görüşmeler (7 gün)",
          text: 'Önümüzdeki haftanın planlı görüşmeleri tarih ve saatiyle durur; "Tüm görüşmeler →" panoya açılır.',
        },
      ],
      buttons: [
        {
          label: "WhatsApp",
          does: "Sessiz kalan öğrenciye hazır hatırlatma mesajıyla sohbet açar.",
        },
        {
          label: "Analiz gir",
          does: "Bekleyen denemenin analiz ekranına götürür.",
        },
        { label: "Tüm görüşmeler →", does: "Görüşmeler panosunu açar." },
      ],
      tip: "Kartlardaki her öğrenci adı tıklanabilir — seni doğrudan kokpitine götürür.",
      section: "panel",
    },
    {
      id: "ogrenciler",
      nav: "Öğrenciler",
      title: "Öğrenciler: kadronun tamamı",
      route: "/koc/ogrenciler",
      target: "ogrenciler-filtre",
      purpose:
        "Tüm kadron tek tabloda: kim ne kadar çalışıyor, ödemesi ne durumda, en son ne zaman giriş yaptı — hepsi satır satır.",
      highlights: [
        {
          label: "Sınav filtreleri",
          text: "Üstteki Tümü / KPSS / YKS / LGS çipleriyle listeyi tek dokunuşla daraltırsın.",
        },
        {
          label: "Tek tablo",
          text: "Ad, Sınav, Bu hafta soru, Süre, Ödeme, Son giriş ve Davet sütunları yan yana — nasıl okunduklarını sıradaki adımda göreceğiz.",
        },
        {
          label: "Ada tıkla",
          text: "Öğrencinin adına tıklayınca kokpitine geçersin — günlük işin çoğu orada döner.",
        },
      ],
      buttons: [
        { label: "Yeni öğrenci", does: "Öğrenci ekleme formunu açar." },
        {
          label: "Linki kopyala",
          does: "Öğrencinin davet linkini panoya kopyalar.",
        },
      ],
      tip: "Koç olarak yalnız sana atanmış öğrencileri görürsün — kadronda görmediğin öğrenci için yöneticinle konuş.",
      section: "ogrenciler",
    },
    {
      id: "ogrenciler-sutunlar",
      nav: "Öğrenciler",
      title: "Sütunları okumak: rozetler renkle konuşur",
      route: "/koc/ogrenciler",
      purpose:
        "Tablonun her sütunu bir soruya cevap verir: ne kadar çalışıyor, ödeme ne durumda, en son ne zaman girdi, daveti ne âlemde.",
      highlights: [
        {
          label: "Bu hafta soru · Süre",
          text: "Haftalık soru toplamının yanında çalışma süresi üç kırılımla durur: haftanın toplamı büyük, altında bugün ve ay.",
        },
        {
          label: "Ödeme rozeti",
          text: '"Plan yok", gün ve tutar yazan kırmızı "Gecikmiş", kalan tutar ve vadeli "Borç" ya da yeşil "Ödendi" — kırmızıyı görünce Muhasebe\'ye geç.',
        },
        {
          label: "Son giriş rozeti",
          text: '"Bugün" yeşil, "Dün" nötr; 3 gün ve üzeri turuncu "N gün önce", hiç girmemişse kırmızı "Hiç giriş yok".',
        },
        {
          label: "Davet sütunu",
          text: 'Öğrenci hesabını açtıysa "Kabul edildi" rozeti; açmadıysa davet düğmeleri durur. Yanındaki küçük PIN düğmesini sıradaki adımlarda göreceğiz.',
        },
      ],
      tip: "Renk dili tabloda hep aynı: yeşil iyi, turuncu dikkat, kırmızı bugün ilgilen.",
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
        {
          label: "Öğrenciyi oluştur",
          does: "Formu kaydeder ve davet linkini üretir.",
        },
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
      id: "davet-pin",
      nav: "Öğrenciler",
      title: "Davet ve PIN: öğrencinin kapı anahtarı",
      route: "/koc/ogrenciler",
      purpose:
        "Öğrenci uygulamaya davet linkiyle girer, PIN'ini kendisi belirler. Link kaybolursa ya da PIN unutulursa çözüm Davet sütununda.",
      highlights: [
        {
          label: "Davet linki",
          text: '"Linki kopyala" linki panoya alır; "WhatsApp\'tan gönder" hazır mesajla iletir — telefon kayıtlıysa tek dokunuş yeter.',
        },
        {
          label: "PIN düğmesi",
          text: "Her satırın sonundaki küçük PIN düğmesi sıfırlama penceresini açar; istersen PIN'i kendin belirlersin, boş bırakırsan rastgele üretilir.",
        },
        {
          label: "İki sonuç",
          text: "Öğrenci hesabını açtıysa yeni PIN üretilir ve eskisi anında geçersiz olur; hesabı yoksa yeni bir davet linki üretilir.",
        },
        {
          label: "Güvenli paylaşım",
          text: "Yeni PIN ekranda bir kez görünür; kopyalayıp ya da WhatsApp'tan yollayıp pencereyi kapat — kapanınca PIN ekrandan silinir.",
        },
      ],
      buttons: [
        {
          label: "WhatsApp'tan gönder",
          does: "Davet linkini hazır mesajla WhatsApp'ta açar.",
        },
        { label: "PIN", does: "PIN sıfırlama penceresini açar." },
        {
          label: "Sıfırla",
          does: "Yeni PIN'i ya da yeni davet linkini üretir.",
        },
      ],
      tip: "PIN sıfırlama girişi kayıttaki telefona yeniden eşitler — numara değiştiyse önce profildeki telefonu güncelle, sonra sıfırla.",
      section: "davet-ve-pin",
    },
    {
      id: "kokpit",
      nav: "Öğrenci kokpiti",
      title: "Öğrenci kokpiti: her şey tek çatı altında",
      route: "/koc/tur/ornek",
      purpose:
        "Bir öğrenciyle ilgili her iş burada döner. Buradaki kayıt kurgusal bir örnektir — başlıkta kimlik ve hızlı eylemler, altında 10 sekme.",
      highlights: [
        {
          label: "Örnek öğrenci",
          text: "Bu kokpitteki öğrenci ve verileri tur için uydurulmuştur; gerçek kokpit birebir aynı düzendedir, ekranı gönül rahatlığıyla kurcala.",
        },
        {
          label: "10 sekme",
          text: "Genel Bakış, Soru Takibi, Denemeler, Program, Görüşmeler, Konular, Kaynaklar, İçerik, Muhasebe ve Profil — soldan sağa iş sırasına yakın dizili.",
        },
        {
          label: "Başlık rozetleri",
          text: 'Sınav ve alan rozeti, "Davet kabul edildi" ya da "Davet bekliyor" durumu ve hedef metni başlıkta durur.',
        },
        {
          label: "WhatsApp menüsü",
          text: "Başlıktaki WhatsApp düğmesi açılır menüdür: boş sohbet ya da grup grup hazır şablonlarla (Takip, Ödeme...) mesaj açarsın.",
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
      route: "/koc/tur/ornek/soru-takibi",
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
          text: '"Ders ders soru ve doğruluk" tablosu son 8 haftayı, öğrencinin Gelişim sayfasında gördüğüyle bire bir gösterir.',
        },
      ],
      buttons: [
        {
          label: "Kaydet",
          does: "Izgaradaki tüm değişiklikleri tek seferde yazar.",
        },
      ],
      tip: "Hızlı yol tek sayı (toplam) girmektir; D/Y/B'yi yalnız doğruluk analizi istediğin derslerde aç.",
      section: "soru-takibi",
    },
    {
      id: "kokpit-program",
      nav: "Öğrenci kokpiti",
      title: "Program: haftalık planı kur ve yayınla",
      route: "/koc/tur/ornek/program",
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
          text: '"Hafta · ders" ve "Gün" görünümleri arasında geçerek görevleri istediğin açıdan düzenlersin.',
        },
        {
          label: "Öğrenci önerisi",
          text: 'Öğrenci kendi taslağını gönderebilir; "Öğrenci önerisi" rozetiyle gelir, sen düzenleyip yayınlarsın.',
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
      tip: 'Uzun koç notu yazarsan sistem "Notu görevlere dönüştür" önerir — öğrenciler işaretlenebilir görev listesini çok daha rahat takip ediyor.',
      section: "program-yayinla",
    },
    {
      id: "kokpit-deneme",
      nav: "Öğrenci kokpiti",
      title: "Denemeler ve deneme analizi",
      route: "/koc/tur/ornek/denemeler",
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
          text: 'Analizi kaydedince deneme "yapıldı" işaretlenir ve Panel\'deki bekleyenler listesinden düşer.',
        },
      ],
      buttons: [
        { label: "Yeni deneme", does: "D/Y/B girişli deneme formunu açar." },
        {
          label: "Denemeyi kaydet",
          does: "Sonucu kaydeder; net o anki formülle saklanır.",
        },
        {
          label: "Analiz",
          does: "Denemenin konu bazlı analiz ekranına gider.",
        },
        {
          label: "Analizi kaydet",
          does: "Konu eksiklerini yazar ve denemeyi analiz yapıldı işaretler.",
        },
      ],
      tip: "Branş denemeleri net grafiğine girmez; grafik yalnız tam denemelerden çizilir.",
      section: "deneme-analizi",
    },
    {
      id: "kokpit-konu",
      nav: "Öğrenci kokpiti",
      title: "Konular, Kaynaklar ve İçerik",
      route: "/koc/tur/ornek/konular",
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
      target: "denemeler-hafta",
      purpose:
        "Kadronun bu haftaki tüm deneme netleri tek tabloda. Kim girdi, kim girmedi, ortalama nerede — haftalık kalite kontrolün.",
      highlights: [
        {
          label: "Özet kutular",
          text: "Deneme sayısı, Ortalama net ve En yüksek net haftanın fotoğrafını üç kutuda verir.",
        },
        {
          label: "Sonuçlar tablosu",
          text: "O hafta girilen her deneme öğrenci adı, deneme adı, bölüm, net ve tarihle satır satır listelenir.",
        },
        {
          label: "Branş rozeti",
          text: 'Branş denemeleri "Branş" rozetiyle ayrışır — tam denemelerle aynı kefeye koymadan okursun.',
        },
      ],
      tip: "Pano girilmiş denemeleri gösterir; yeni deneme girişi öğrencinin kokpitindeki Denemeler sekmesinden yapılır.",
      section: "deneme-panosu",
    },
    {
      id: "denemeler-sirala",
      nav: "Denemeler",
      title: "Haftalar arasında gez, listeyi sırala",
      route: "/koc/denemeler",
      purpose:
        "Pano tek haftayı gösterir; oklarla geçmişe dönersin. Sıralamayı derdine göre seçersin: zirveyi mi arıyorsun, tek tek mi yokluyorsun?",
      highlights: [
        {
          label: "Hafta okları",
          text: 'Sol ok önceki haftaya götürür; sağ ok bu haftadayken kapalıdır. Hafta her zaman Pazartesi başlar, etiket "Bu hafta" / "Geçmiş hafta" der.',
        },
        {
          label: "Nete göre",
          text: "En yüksek net üstte — haftanın zirvesini ve dibini tek bakışta görürsün.",
        },
        {
          label: "İsme göre",
          text: "Alfabetik sıra — kadroyu tek tek yoklarken kimin deneme girmediği de belli olur.",
        },
        {
          label: "Analiz rozetleri",
          text: 'Analiz sütununda "Edildi" / "Bekliyor" rozetleri durur; bekleyenler Panel\'deki karta da düşer.',
        },
      ],
      buttons: [
        {
          label: "Nete göre",
          does: "Listeyi en yüksek netten başlayarak sıralar.",
        },
        { label: "İsme göre", does: "Listeyi alfabetik sıralar." },
      ],
      tip: "Ara sıra bir önceki haftaya dönüp Bekliyor rozetlerini tara — analiz borcu eskidikçe unutulur.",
      section: "deneme-panosu",
    },
    {
      id: "duyuru",
      nav: "Duyuru",
      title: "Duyuru: toplu WhatsApp, tek tek onay",
      route: "/koc/duyuru",
      target: "duyuru-baslik",
      purpose:
        "Tüm öğrencilerine kişiselleştirilmiş WhatsApp mesajı hazırlarsın; her mesajı sen açıp yollarsın — otomatik gönderim yok.",
      highlights: [
        {
          label: "Kişiselleştirme",
          text: "Mesajdaki {ad} her öğrencinin kendi adıyla değişir — tek metin yazarsın, herkes kendi adını okur.",
        },
        {
          label: "Önizleme",
          text: "Mesaj kutusunun altında önizleme, listedeki ilk öğrenci üzerinden anında görünür.",
        },
        {
          label: "Üç adım",
          text: "Akış hep aynı: mesajı yaz (ya da şablondan al), listeyi daralt, kişi kişi gönder — ayrıntısı sıradaki iki adımda.",
        },
      ],
      section: "duyuru",
    },
    {
      id: "duyuru-sablon",
      nav: "Duyuru",
      title: "Hazır şablonlar: yazma, seç",
      route: "/koc/duyuru",
      purpose:
        "Sık kullandığın mesajlar grup grup hazır durur; çipe tıkla, metin mesaj kutusuna dolsun. Kendi şablonlarını da eklersin.",
      highlights: [
        {
          label: "Dört grup",
          text: "Şablonlar Takip, Ödeme, Yeni öğrenci ve Önemli gruplarında dizilir; grubu seçince o grubun şablon çipleri açılır.",
        },
        {
          label: "Tek dokunuş",
          text: "Şablon çipine tıklamak metni mesaj kutusuna doldurur; üstüne istediğin gibi düzenlersin.",
        },
        {
          label: "Yönet",
          text: '"Yönet" penceresinden şablon ekler, düzenler, kendi gruplarını açarsın — kadronun diline göre kendi setini kur.',
        },
        {
          label: "{ad} şablonda da çalışır",
          text: "Şablon metnine {ad} koyarsan her öğrencide adıyla değişir — şablonlar da kişisel kalır.",
        },
      ],
      buttons: [
        {
          label: "Yönet",
          does: "Şablonları ekleyip düzenleyeceğin yönetim penceresini açar.",
        },
      ],
      section: "duyuru",
    },
    {
      id: "duyuru-gonderim",
      nav: "Duyuru",
      title: "Gönderim: kişi kişi, senin onayınla",
      route: "/koc/duyuru",
      purpose:
        "Alıcı listesini filtreyle daraltır, her öğrenci için WhatsApp'ı tek tek açarsın. Sistem hiçbir mesajı kendiliğinden göndermez.",
      highlights: [
        {
          label: "Filtre ve arama",
          text: 'Sınav çipleri ve "Öğrenci ara" kutusuyla listeyi daraltırsın; sayaç kaç kişiye WhatsApp açılabileceğini söyler.',
        },
        {
          label: "Kişi kişi onay",
          text: "WhatsApp düğmesi o öğrencinin kişiselleşmiş mesajını wa.me'de açar; göndermek her seferinde sana kalır — otomatik gönderim yoktur.",
        },
        {
          label: "Gönderim takibi",
          text: 'Mesajını açtığın öğrenci yeşil işaretlenir, düğmesi "Tekrar" olur; "mesajlandı" sayacı kimin kaldığını söyler.',
        },
        {
          label: "Telefon yok",
          text: 'Numarası kayıtlı olmayan öğrencide "Telefon yok" rozeti durur — o kişiye buradan mesaj açılamaz, önce numarasını ekle.',
        },
      ],
      buttons: [
        {
          label: "WhatsApp",
          does: "O öğrencinin kişiselleşmiş mesajını wa.me'de açar; göndermek sana kalır.",
        },
        { label: "Tekrar", does: "Daha önce açtığın mesajı yeniden açar." },
        { label: "Mesajı kopyala", does: "Kişiselleşmiş metni panoya alır." },
      ],
      tip: "Mesajlandı işaretleri sayfayı yenileyince sıfırlanır — toplu duyuruyu tek oturuşta bitir.",
      section: "duyuru",
    },
    {
      id: "asistan",
      nav: "Asistan",
      title: "Koç Asistanı: kadronu bilen sohbet",
      route: "/koc/asistan",
      target: "asistan-sohbet",
      purpose:
        "Kadron hakkında doğal dille soru sorar, plan ve soru eklemesi istersin. Okuma soruları anında yanıtlanır; yazma işlemleri onay bekler.",
      highlights: [
        {
          label: "Sohbet",
          text: '"Matematikte gerileyen öğrenciler kim?" gibi sorulara verinden yanıt alırsın; boş ekrandaki öneri çipleri başlangıç fikri verir.',
        },
        {
          label: "Her yerden açılır",
          text: 'Tam sayfa /koc/asistan dışında her koç sayfasının sağ altındaki yüzen "Koç Asistanı" düğmesi de aynı sohbeti açar.',
        },
        {
          label: "Sohbet korunur",
          text: "Paneli kapatsan da sohbet kaybolmaz; kaldığın yerden devam edersin.",
        },
      ],
      buttons: [
        {
          label: "Koç Asistanı",
          does: "Sağ alttaki yüzen düğme — asistan panelini açar/kapatır.",
        },
        { label: "Gönder", does: "Mesajı yollar; Enter da gönderir." },
      ],
      tip: 'İşlem isteklerinde öğrenci adını ve günü açık yaz — "Yusuf\'a salı 50 paragraf sorusu ekle" gibi; asistan ne kadar net, öneri o kadar isabetli.',
      section: "asistan",
    },
    {
      id: "asistan-onay",
      nav: "Asistan",
      title: "Onay kartı: asistan önerir, sen uygularsın",
      route: "/koc/asistan",
      purpose:
        'Asistan okuma sorularını anında yanıtlar; yazma isteklerinde işlem yapmaz, sohbete "Onay bekliyor" kartı düşer. Karar her zaman sende.',
      highlights: [
        {
          label: "Neyi okur",
          text: "Kadro verisini: soru girişleri, denemeler, programlar, konu ilerlemesi — okuma soruları beklemeden cevaplanır.",
        },
        {
          label: "Neyi yazabilir",
          text: "Program görevi, soru takibi kaydı gibi eklemeleri yalnız öneri olarak hazırlar; sen Onayla demeden hiçbir öneri öğrenci verisine işlenmez.",
        },
        {
          label: "Onay bekliyor kartı",
          text: "Kartta neyin yazılacağı özetle durur — öğrenci adını, günü ve sayıları okumadan onaylama.",
        },
        {
          label: "Kalıcılık",
          text: "Onaylanan işlem normal kayıt gibi kalıcıdır; Reddet dersen öneri iz bırakmadan düşer.",
        },
      ],
      buttons: [
        { label: "Onayla", does: "Bekleyen öneriyi gerçekten uygular." },
        { label: "Reddet", does: "Öneriyi uygulamadan kaldırır." },
      ],
      tip: "Onay kartındaki özet neyin yazılacağının tek güvencesidir — kartı okumak, geri almaktan hep daha ucuzdur.",
      section: "asistan",
    },
    {
      id: "gorusmeler",
      nav: "Görüşmeler",
      title: "Görüşmeler: planlı ve geçmiş, tek panoda",
      route: "/koc/gorusmeler",
      target: "gorusmeler-listeler",
      purpose:
        "Tüm öğrencilerin planlı ve geçmiş koçluk görüşmeleri burada. Yeni görüşme planlamak içinse öğrencinin kokpitine girersin.",
      highlights: [
        {
          label: "Yaklaşan / Geçmiş",
          text: "Görüşmeler tarihe göre iki listede akar; Planlandı, Yapıldı, Gelmedi ve İptal rozetleri durumu söyler.",
        },
        {
          label: "Planlama kokpitte",
          text: '"Görüşme planla" öğrencinin kokpitindeki Görüşmeler sekmesindedir; tarih, saat ve öğrenciye görünen notla oluşturursun.',
        },
        {
          label: "Görüşmeye katıl",
          text: 'Randevu Cal üzerinden alındıysa görüşme kartında "Görüşmeye katıl" bağlantısı hazır durur.',
        },
      ],
      buttons: [
        {
          label: "Görüşme planla",
          does: "Kokpitte tarih ve saatiyle görüşme oluşturur.",
        },
        {
          label: "Görüşmeye katıl",
          does: "Randevunun görüşme bağlantısını açar.",
        },
      ],
      tip: "Ada tıklayınca öğrencinin Görüşmeler sekmesine geçersin — sonuç işaretleme ve program bağlama orada.",
      section: "gorusme-planlama",
    },
    {
      id: "gorusme-sonuc",
      nav: "Görüşmeler",
      title: "Görüşme sonrası: işaretle ve programa bağla",
      route: "/koc/gorusmeler",
      purpose:
        "Görüşme bitince kokpitteki kartından sonucu işaretlersin; en güçlü hamle, görüşmeden çıkar çıkmaz gelecek haftanın programını başlatmaktır.",
      highlights: [
        {
          label: "Yapıldı / Gelmedi",
          text: "Planlı görüşmeyi tek dokunuşla sonuçlandırırsın; rozet bu panoda da anında güncellenir.",
        },
        {
          label: "İki ayrı not",
          text: "Görüşme özeti yalnız koçlara görünür; öğrenci notu ise öğrencinin Bugün ekranına düşer — ikisini karıştırma.",
        },
        {
          label: "Program oluştur",
          text: 'Görüşme kartındaki "Program oluştur" gelecek haftanın taslağını açar; görevleri ekleyip Yayınla\'ya basarsın. Taslak varsa düğme "Programı aç" olur.',
        },
      ],
      buttons: [
        { label: "Yapıldı", does: "Görüşmeyi tamamlandı olarak işaretler." },
        { label: "Gelmedi", does: "Görüşmeyi gelmedi olarak işaretler." },
        {
          label: "Program oluştur",
          does: "Görüşmeden gelecek haftanın program taslağını açar.",
        },
        { label: "Programı aç", does: "Görüşmeye bağlı taslağa geri döner." },
      ],
      tip: "Program taslağı bir sonraki haftaya (Pazartesi başlangıçlı) açılır; öğrenci sen Yayınla'ya basana kadar görmez.",
      section: "gorusme-planlama",
    },
    {
      id: "cal-takvim",
      nav: "Görüşmeler",
      title: "Cal takvimi: randevuyu öğrenci alsın",
      route: "/koc/profil",
      purpose:
        'Profilindeki "Görüşme takvimi (Cal linki)" alanı dolu olmalı — boşsa öğrencilerin uygulamadan randevu alamaz ve panoda uyarı görürsün.',
      highlights: [
        {
          label: "Cal linki",
          text: 'Cal.com görüşme linkini profildeki "Görüşme takvimi (Cal linki)" alanına yapıştır; takvimin öğrencinin uygulamasına gömülü gelir.',
        },
        {
          label: "Eksikse uyarı",
          text: 'Link boşken Görüşmeler panosunda "Görüşme takvimin eksik" uyarısı çıkar — öğrenciler randevu alamıyor demektir.',
        },
        {
          label: "Planlamayanlar listesi",
          text: 'Takvimin hazırken randevu almamış öğrenciler "Görüşmesini planlamayanlar" kartında listelenir; hazır WhatsApp hatırlatması yanı başında.',
        },
      ],
      buttons: [
        {
          label: "Hatırlat",
          does: "Randevu almayan öğrenciye hazır WhatsApp mesajı açar.",
        },
      ],
      tip: "Cal linkini bir kez ekle; sonrasında öğrenciler müsait saatlerinden kendileri randevu alır, görüşmeler panoya kendiliğinden düşer.",
      section: "cal-takvimi",
    },
    {
      id: "canli",
      nav: "Canlı",
      title: "Canlı transkript: görüşmeyi yazıya çevir",
      route: "/koc/canli-transkript",
      target: "canli-alan",
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
          text: 'Durdur\'dan sonra "Devam et" aynı transkripte ekleyerek sürdürür, "Yeniden başlat" sıfırdan açar.',
        },
        {
          label: "Sonrası",
          text: '"Kaydet ve incele" metni saklayıp AI çıkarım ekranına götürür — nasıl göründüğünü şimdi örnek bir görüşmede göreceğiz.',
        },
      ],
      buttons: [
        {
          label: "Başlat",
          does: "Mikrofonu açar ve canlı yazıya çevirmeye başlar.",
        },
        { label: "Durdur", does: "Dinlemeyi durdurur; metin ekranda kalır." },
        {
          label: "Devam et",
          does: "Aynı transkripte ekleyerek kaydı sürdürür.",
        },
        {
          label: "Kaydet ve incele",
          does: "Metni kaydedip AI çıkarım ekranına götürür.",
        },
      ],
      tip: "Herhangi bir koç sayfasında g'ye ardından t'ye bas — bu ekrana anında gelirsin.",
      section: "canli-transkript",
    },
    {
      id: "canli-ornek-ozet",
      nav: "Canlı",
      title: "Örnek görüşme: AI özeti",
      route: "/koc/tur/ornek-transkript",
      target: "transkript-ozet",
      purpose:
        "Buradaki görüşme tur için kurgulanmıştır — gerçek bir kayıt değildir. Kaydettiğin her transkriptin başına böyle bir AI özeti düşer.",
      highlights: [
        {
          label: "Kurgusal kayıt",
          text: "Bu döküm ve öneriler tur için uydurulmuştur; üstteki sarı bant da bunu söyler. Burada hiçbir şey kaydedilmez.",
        },
        {
          label: "Özet kartı",
          text: "22 dakikalık konuşma birkaç cümleye iner: ne konuşuldu, öğrenci nerede tıkanıyor, hangi kararlar alındı.",
        },
        {
          label: "Başlık rozetleri",
          text: 'Kaynağı ("Canlı (mikrofon)"), durumu ("Çıkarıldı") ve süreyi başlıktaki rozetlerden okursun.',
        },
      ],
      tip: "Özet, görüşme notu önerisi olarak da gelir — onaylarsan öğrencinin görüşme geçmişine işlenir.",
      section: "transkript-cikarim",
    },
    {
      id: "canli-ornek-oneri",
      nav: "Canlı",
      title: "Çıkarılan öneriler: onaysız hiçbir şey yazılmaz",
      route: "/koc/tur/ornek-transkript",
      target: "transkript-oneriler",
      purpose:
        "AI konuşmadan işlenebilir öneriler çıkarır: soru sayısı, program görevi, konu ilerlemesi, görüşme notu. Onaylamadan hiçbiri kayda dönmez.",
      highlights: [
        {
          label: "Öneri türleri",
          text: "Her önerinin başındaki rozet nereye yazacağını söyler: Soru takibi, Program görevi, Konu ilerlemesi ya da Görüşme notu.",
        },
        {
          label: "Güven yüzdesi",
          text: "Her önerinin yanında bir güven değeri durur (örnekte %64–%95); yüzde düştükçe öneriyi dökümden doğrulayarak oku.",
        },
        {
          label: "Onayla / Reddet",
          text: "Onayla gerçek kaydı oluşturur, Reddet öneriyi düşürür — bu örnek kayıtta düğmeler devre dışıdır.",
        },
      ],
      buttons: [
        {
          label: "Onayla",
          does: "Çıkarılan öneriyi öğrencinin verisine işler.",
        },
        { label: "Reddet", does: "Öneriyi uygulamadan kaldırır." },
      ],
      tip: 'AI öğrencinin beyanını da öneriye çevirir ("190 soru çözdüm" gibi) — sayı kritikse onaylamadan önce sor, sonra onayla.',
      section: "transkript-cikarim",
    },
    {
      id: "canli-ornek-dokum",
      nav: "Canlı",
      title: "Tam döküm: konuşmanın yazılı hafızası",
      route: "/koc/tur/ornek-transkript",
      target: "transkript-dokum",
      purpose:
        "Konuşmanın tamamı Koç / öğrenci sırasıyla metin olarak saklanır. Varsayılan yalnız metindir; KVKK onayı verdiysen ses kaydı da eklenir.",
      highlights: [
        {
          label: "Konuşma sırası",
          text: 'Her replik kimin söylediği etiketiyle listelenir — "geçen görüşmede ne demiştik" sorusunun cevabı hep burada.',
        },
        {
          label: "Varsayılan yalnız metin",
          text: "Ses kaydı ancak kayıttan önce KVKK onay kutusunu işaretlersen saklanır; işaretlemediysen yalnız bu metin tutulur.",
        },
        {
          label: "Önerilerin kaynağı",
          text: "Bir önceki adımdaki öneriler bu dökümden çıkarılır — güven yüzdesi düşük bir öneriyi buradan doğrularsın.",
        },
        {
          label: "Kurgusal döküm",
          text: "Bu konuşma da tur için yazıldı; gerçek kayda başlamak için Canlı transkript ekranına dönersin.",
        },
      ],
      tip: "Ekranın üstündeki geri düğmesi seni Canlı transkript ekranına götürür — gerçek kayıt orada başlar.",
      section: "canli-transkript",
    },
    {
      id: "muhasebe",
      nav: "Muhasebe",
      title: "Muhasebe: ayın mali fotoğrafı",
      route: "/koc/muhasebe",
      target: "muhasebe-kutular",
      purpose:
        "Ayın gelir fotoğrafı, bekleyen ödeme bildirimleri ve gecikmiş faturalar tek ekranda — tahsilatı buradan yönetirsin.",
      highlights: [
        {
          label: "4 kutu",
          text: "Bu ay gelir, Tahsil edilmemiş, Tahsilat oranı ve Gecikmiş — ayın mali özeti üstte durur.",
        },
        {
          label: "İki kart",
          text: "Gecikmiş ödemeler bakiyeleriyle solda, son tahsilatlar sağda akar — ikisinin ayrıntısını sıradaki adımlarda göreceğiz.",
        },
        {
          label: "Alt sayfalar",
          text: "Faturalar ve Ödemeler düğmeleri tam listelere açılır; öğrencinin ücret planı kokpitindeki Muhasebe sekmesindedir.",
        },
      ],
      buttons: [
        { label: "Faturalar", does: "Tüm faturaların listesine gider." },
        { label: "Ödemeler", does: "Tüm ödeme kayıtlarının listesine gider." },
      ],
      tip: "Bu ay gelir yalnız kaydedilmiş tahsilatları sayar — öğrenci bildirimi sen onaylamadan gelire yazılmaz.",
      section: "muhasebe",
    },
    {
      id: "muhasebe-fatura",
      nav: "Muhasebe",
      title: "Ücret planı ve fatura kesmek",
      route: "/koc/muhasebe/faturalar",
      purpose:
        'Ücret planını öğrencinin kokpitindeki Muhasebe sekmesinde kurarsın; faturayı "Fatura kes" ile açar, durumunu tek menüden yönetirsin.',
      highlights: [
        {
          label: "Ücret planı",
          text: "Tutar, dönem ve vade günü öğrencinin Muhasebe sekmesindeki ücret planında durur; kadro tablosundaki Ödeme rozetleri bu plandan beslenir.",
        },
        {
          label: "Fatura kes",
          text: "Dönem etiketi, tutar ve vadeyle açık fatura oluşturur — hem öğrencinin kokpitinden hem bu Faturalar sayfasından kesebilirsin.",
        },
        {
          label: "Durum menüsü",
          text: "Fatura Taslak, Gönderildi, Ödendi, Gecikmiş ya da İptal durumundadır; ödeme alındıkça durum kendiliğinden ilerler, vadesi geçen açık fatura Gecikmiş'e düşer.",
        },
        {
          label: "Kuruş kuralı",
          text: "Tutarı TL olarak yazarsın; sistem her tutarı kuruş cinsinden tam sayı saklar — yuvarlama farkı asla oluşmaz.",
        },
      ],
      buttons: [
        {
          label: "Fatura kes",
          does: "Dönem, tutar ve vadeyle yeni fatura oluşturur.",
        },
        {
          label: "Ücret planı",
          does: "Öğrencinin tutar, dönem ve vade gününü düzenler.",
        },
      ],
      tip: "Gecikmiş rozeti vadesi geçen açık faturadan hesaplanır — fatura kesmezsen gecikme uyarısı da çıkmaz.",
      section: "muhasebe",
    },
    {
      id: "muhasebe-tahsilat",
      nav: "Muhasebe",
      title: "Tahsilat: bildirimi onayla ya da elle kaydet",
      route: "/koc/muhasebe",
      purpose:
        'Öğrenci "ödedim" bildirdiğinde onay kartı düşer; onaylarsan gerçek ödeme kaydına döner. Elle tahsilat için Ödeme al hep elinin altında.',
      highlights: [
        {
          label: "Ödeme bildirimleri",
          text: "Öğrencinin bildirdiği havale/ödeme tarih, yöntem ve tutarla kartta bekler; Onayla dediğinde gerçek ödeme kaydına dönüşür.",
        },
        {
          label: "Tutar yanlışsa",
          text: 'Onaylama — Reddet deyip doğru tutarı "Ödeme al" ile elle gir; reddetmek bildirimi düşürür, para kaydı oluşturmaz.',
        },
        {
          label: "Ödeme al",
          text: "Elle ödeme kaydeder; öğrencinin açık faturası varsa bakiyesini kapatır.",
        },
        {
          label: "Gecikme hatırlatma",
          text: "Vadesi geçen faturalar bakiyeleriyle listelenir; Hatırlat, tutarı hazır yazılmış WhatsApp mesajı açar.",
        },
      ],
      buttons: [
        {
          label: "Onayla",
          does: "Öğrencinin ödeme bildirimini gerçek kayda çevirir.",
        },
        { label: "Reddet", does: "Bildirimi kayıt oluşturmadan düşürür." },
        {
          label: "Ödeme al",
          does: "Elle ödeme kaydeder; fatura varsa bakiyeyi kapatır.",
        },
        {
          label: "Hatırlat",
          does: "Geciken öğrenciye tutarlı hazır mesaj açar.",
        },
      ],
      tip: 'Reddetmek bildirimi siler ama ödemeyi değil — parayı gerçekten aldıysan mutlaka "Ödeme al" ile elle kaydet.',
      section: "odeme-bildirimleri",
    },
    {
      id: "leadler",
      nav: "Talepler",
      title: "Lead havuzu: siteden gelen talepler",
      route: "/koc/leadler",
      target: "leadler-filtre",
      purpose:
        "Sitedeki ön görüşme formu buraya düşer. Her lead'i durumuyla ilerletir, WhatsApp'tan ulaşır, hazır olunca tek dokunuşla kayda çevirirsin.",
      highlights: [
        {
          label: "Durum akışı",
          text: "Lead Yeni → Görüşüldü → Kayıt ya da Kayıp hattında ilerler; üstteki filtre çipleri her durumun sayacını taşır.",
        },
        {
          label: "Kart detayı",
          text: "Ad, sınav, telefon, geliş tarihi ve bıraktığı mesaj tek kartta — aramadan önce ne istediğini bilirsin.",
        },
        {
          label: "İlk temas",
          text: "WhatsApp düğmesi hazır ilk temas mesajıyla sohbeti açar; durumu görüşme sonrası menüden güncellersin.",
        },
        {
          label: "Öğrenciye çevir",
          text: "Lead'in adı, telefonu ve sınavıyla önceden dolu yeni öğrenci formunu açar — formu baştan doldurmazsın.",
        },
      ],
      buttons: [
        {
          label: "WhatsApp",
          does: "Lead'e hazır ilk temas mesajıyla sohbet açar.",
        },
        {
          label: "Öğrenciye çevir",
          does: "Lead'in bilgileriyle önceden dolu yeni öğrenci formunu açar.",
        },
      ],
      tip: 'Kayıt durumuna çektiğin lead\'de "Öğrenciye çevir" düğmesi kaybolur — çevirme işini durumu güncellemeden önce yap.',
      section: "leadler-bekleme",
    },
    {
      id: "bekleme",
      nav: "Talepler",
      title: "Bekleme listesi: sıradaki adaylar",
      route: "/koc/bekleme",
      purpose:
        "Dönem doluyken gelen talepler burada sıra numarasıyla bekler. Yer açıldığında sıradakini davet eder, kabul edince kayda çevirirsin.",
      highlights: [
        {
          label: "FIFO sıra",
          text: "Bekliyor durumundakiler geliş sırasına göre numaralanır — kim önce geldiyse sıra önce onun.",
        },
        {
          label: "Durum hattı",
          text: "Kayıt Bekliyor → Davet edildi → Kayıt ya da Ayrıldı hattında ilerler; filtre çipleri sayaçlarıyla üstte durur.",
        },
        {
          label: "Sıcak tut",
          text: "WhatsApp düğmesi bekleyene hazır mesaj açar — sıra hatırlatması ve davet mesajı hazır şablondur.",
        },
        {
          label: "Kayda çevir",
          text: "Adayın adı, telefonu ve sınavıyla önceden dolu kayıt formunu açar.",
        },
      ],
      buttons: [
        {
          label: "WhatsApp",
          does: "Bekleyen adaya hazır mesajla sohbet açar.",
        },
        {
          label: "Kayda çevir",
          does: "Bilgileri önceden dolu kayıt formuna taşır.",
        },
      ],
      tip: 'Panel\'deki "bekleme listesinde sırada" bandı seni doğrudan Bekliyor filtresine getirir.',
      section: "leadler-bekleme",
    },
    {
      id: "icerik-blog",
      nav: "İçerik",
      title: "İçerik ve blog: kütüphaneni yönet",
      route: "/koc/icerik",
      target: "icerik-baslik",
      purpose:
        "Video, PDF, not ve bağlantıları buradan eklersin: kütüphanede herkese açar ya da tek öğrenciye atarsın. Blog yazıların sitede yayına girer.",
      highlights: [
        {
          label: "İçerik ekle",
          text: "YouTube videoları küçük resimle görünür; notlar doğrudan uygulama içinde okunur. İçeriği ders ve konuyla da etiketlersin.",
        },
        {
          label: "Görünürlük",
          text: '"Kütüphane" rozetli içerik herkese açıktır (öğrencinin sınav filtresine göre); "Özel" olan yalnız atadığın öğrencilerde görünür.',
        },
        {
          label: "Ata",
          text: "İçeriği seçtiğin öğrencilere atar; kartta kaç öğrenciye atalı olduğu ve kaç kez izlendiği yazar.",
        },
        {
          label: "Sahiplik",
          text: "Yalnız kendi eklediğin içeriği ve kendi blog yazını düzenleyip silebilirsin — kartta ekleyen adı yazar.",
        },
        {
          label: "Blog",
          text: '"Yeni yazı" boş taslak açar; yayına aldıkların sitede /blog altında görünür — kısa, uygulanabilir çalışma yazıları en çok okunanlardır.',
        },
      ],
      buttons: [
        {
          label: "İçerik ekle",
          does: "Kütüphaneye yeni materyal ekleme penceresini açar.",
        },
        { label: "Ata", does: "İçeriği seçtiğin öğrencilere atar." },
        { label: "Yeni yazı", does: "Boş blog taslağı oluşturur." },
      ],
      tip: "Atadıklarının karşılığını görmek için öğrencinin kokpitindeki İçerik sekmesine bak — her materyal izlenme durumuyla listelenir.",
      section: "icerik-kutuphanesi",
    },
    {
      id: "ayarlar",
      nav: "Ayarlar",
      title: "Ayarlar: hesabın, profilin ve buradan sonrası",
      route: "/koc/ayarlar",
      target: "ayarlar-kartlar",
      purpose:
        "Hesap bilgilerin, herkese açık koç profilin ve transkript eklentin burada. 34 adımın sonuna geldik — ayrıntı gerektiğinde rehber hep elinin altında.",
      highlights: [
        {
          label: "Hesabın",
          text: "Adın ve rolün (Koç) burada görünür; ekip değişiklikleri için yöneticinle konuşursun.",
        },
        {
          label: "Profilin",
          text: 'Fotoğraf, tanıtım, dereceler ve "Görüşme takvimi (Cal linki)" profil sayfandan düzenlenir — /koclar\'daki sayfanı besler.',
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
        {
          label: "Profilimi düzenle",
          does: "Herkese açık profilini ve Cal linkini düzenlemeye açar.",
        },
        {
          label: "Eklentiyi bağla",
          does: "Transkript eklentisi token yönetimine gider.",
        },
        {
          label: "Koç rehberini aç",
          does: "Ekran ekran ayrıntılı referans rehberi açar.",
        },
        {
          label: "Baştan sona nasıl işler",
          does: "İş sırasını anlatan akış rehberine götürür.",
        },
      ],
      tip: "Cal linkini profiline eklemeden öğrencilerin uygulamadan randevu alamaz — turdan çıkmadan önce kontrol et.",
      section: "profil-ayarlar-eklenti",
    },
  ],
};

import type { Tour } from "@/lib/rehber/tur-types";

/**
 * Öğrenci uygulamasının ürün turu.
 *
 * Rehber (`ogrenci.ts`) "ekranı ara, oku"; akış (`akis.ts`) "sıra nasıl
 * işler"; bu dosya ise sunum: uygulamayı alt gezinme sırasıyla baştan sona
 * gezdirir. `target` verilen adımlarda sayfadaki ilgili bölgeye ışık tutulur.
 * Buton etiketleri uygulamadaki dizelerle birebirdir.
 */
export const ogrenciTuru: Tour = {
  id: "ogrenci",
  title: "Uygulama turu",
  subtitle:
    "Uygulamayı 28 adımda ekran ekran gez: ne nerede, hangi düğme ne yapar, günlük rutinin nasıl işler.",
  guideBase: "/ogrenci/rehber",
  steps: [
    {
      id: "hosgeldin",
      nav: "Tur",
      title: "Hoş geldin, kısa bir tur atalım",
      purpose:
        "Bu tur uygulamayı baştan sona tanıtır: 28 adımda hangi ekran ne işe yarar, üstünde neler var, en çok hangi düğmeleri kullanacaksın. On dakikanı almaz.",
      highlights: [
        {
          label: "Sıra",
          text: "Adımlar alt gezinmenin sırasını izler: Bugün ile başlar, Asistan ve Profil ile biter — uygulamayı gerçek kullanım sırasıyla görürsün.",
        },
        {
          label: "Gezinme",
          text: "Oklarla ileri-geri gidersin; istediğin an çıkabilirsin, tur kaçmaz — dilediğinde baştan açarsın.",
        },
        {
          label: "Ekranı aç",
          text: "Merak ettiğin adımda “Ekranı aç” ile gerçek ekrana gidip kendin kurcalayabilirsin.",
        },
        {
          label: "Derinlik",
          text: "Tur tanıtır, ezberletmez: ayrıntı gerektiğinde her adımdaki rehber bağlantısı ilgili bölümü açar.",
        },
      ],
      tip: "Turu tek oturuşta bitirmek zorunda değilsin — şimdilik bir göz at, ekranları kullandıkça geri dön.",
      section: "harita",
    },
    {
      id: "bugun",
      nav: "Bugün",
      title: "Bugün: günün karargâhı",
      route: "/ogrenci",
      target: "bugun-kutular",
      purpose:
        "Uygulamayı açınca gelen ekran. Günün özeti, bugünün görevleri ve hızlı soru girişi tek yerde — günlük rutinin tamamı buradan yürür.",
      highlights: [
        {
          label: "Dört kutu",
          text: "Seri (arka arkaya giriş yaptığın günler), Bu hafta (soru toplamın), Son net ve Çalışma süren — günün fotoğrafı tek bakışta.",
        },
        {
          label: "İçgörüler",
          text: "Kutuların altında sistemin verinden çıkardığı kısa notlar durur — neyin iyi gittiğini, neye bakman gerektiğini söyler.",
        },
        {
          label: "Sonraki görüşme",
          text: "Yaklaşan görüşmen kartta saatiyle görünür; vakti gelince buradan katılırsın.",
        },
        {
          label: "Sayfanın devamı",
          text: "Bugünün programı ve “Bugün kaç soru çözdün?” bölümü de bu ekranda — ikisini sıradaki iki adımda tek tek geziyoruz.",
        },
      ],
      buttons: [
        {
          label: "Katıl",
          does: "Görüşmenin video bağlantısını yeni sekmede açar.",
        },
      ],
      tip: "Çalışma kutusu tıklanabilir — dokununca seni doğrudan Kronometre ekranına götürür.",
      section: "bugun",
    },
    {
      id: "bugun-gorevler",
      nav: "Bugün",
      title: "Bugünün programı: dokun, bitir",
      route: "/ogrenci",
      purpose:
        "Koçunun bugüne koyduğu görevler “Bugünün programı” başlığında listelenir. Bitirdiğine dokunman yeter — işaret anında kaydolur, Kaydet düğmesi yoktur.",
      highlights: [
        {
          label: "Tek dokunuş",
          text: "Görevine dokun, yeşil tik düşer ve anında kaydolur; yanlışlıkla işaretlediysen tekrar dokun, geri alınır.",
        },
        {
          label: "Görev satırı",
          text: "Görevin altında dersi, hedef soru sayısı ve kaynağı yazar — neyi, ne kadar, nereden çalışacağın belli.",
        },
        {
          label: "Sayaç",
          text: "Başlığın yanındaki sayaç kaç görevden kaçını bitirdiğini gösterir — günü kapatmadan bir bak.",
        },
        {
          label: "Nereden gelir",
          text: "Görevler koçunun yayınladığı haftalık programdan düşer; koç o haftayı yayınlamadıysa bu bölüm hiç görünmez.",
        },
      ],
      buttons: [
        {
          label: "Haftanın tamamını gör",
          does: "Görev listesinden haftalık Program ekranına götürür.",
        },
      ],
      section: "gorev-isaretleme",
    },
    {
      id: "bugun-hizli-soru",
      nav: "Bugün",
      title: "Hızlı soru girişi: günün sayılarını yaz",
      route: "/ogrenci",
      target: "bugun-soru",
      purpose:
        "“Bugün kaç soru çözdün?” bölümü günün soru girişini kolaylaştırır: sayıyı yaz ya da −/+ ile ilerlet, sonunda mutlaka Kaydet'e bas.",
      highlights: [
        {
          label: "−/+ düğmeleri",
          text: "Her dersin yanındaki − ve + sayıyı 5'er azaltıp artırır; ortadaki kutuya elle de yazabilirsin.",
        },
        {
          label: "D/Y/B açıcısı",
          text: "Satırın sonundaki ok, doğru/yanlış/boş alanlarını açar. Üçünü de doldurunca toplam ve net kendiliğinden hesaplanır; eksik bırakırsan kayıt kabul edilmez.",
        },
        {
          label: "Toplam kutusu",
          text: "Alttaki şerit “Bugün toplam N soru” diye canlı sayar — Kaydet düğmesi de hep orada, elinin altında.",
        },
        {
          label: "Kaydet şart",
          text: "Görev işaretlemenin aksine buradaki sayılar Kaydet'e basmadan kaydolmaz — basmadan çıkarsan girdiklerin kaybolur.",
        },
      ],
      buttons: [
        {
          label: "Kaydet",
          does: "Girdiğin tüm ders sayılarını bugüne yazar.",
        },
      ],
      tip: "Girişten sonra “Bugünkü sorular kaydedildi 🔥” bildirimini görmeden çıkma — görmediysen kaydolmamıştır.",
      section: "hizli-soru-girisi",
    },
    {
      id: "program",
      nav: "Program",
      title: "Haftalık programın",
      route: "/ogrenci/program",
      target: "program-alan",
      purpose:
        "Koçunun senin için yayınladığı haftalık konu planı. Görevleri buradan izler, bitirdiklerini işaretlersin. Hafta her zaman Pazartesi başlar.",
      highlights: [
        {
          label: "Motto",
          text: "Koçun haftanın mottosunu en üstteki mor panoda paylaşır — haftaya oradan başla.",
        },
        {
          label: "Koç notu",
          text: "Mottodan sonra koçunun haftalık stratejisi gelir: neye ağırlık vereceğin, nelere dikkat edeceğin.",
        },
        {
          label: "Anında işaretleme",
          text: "Bitirdiğin göreve dokunman yeter: işaret anında kaydolur, Kaydet düğmesi yoktur. Yanlışsa tekrar dokun, geri alınır.",
        },
        {
          label: "Sayfanın devamı",
          text: "İki görünüm ve hafta gezinme de bu ekranda — ikisini sıradaki iki adımda geziyoruz.",
        },
      ],
      section: "program-nedir",
    },
    {
      id: "program-gorunum",
      nav: "Program",
      title: "İki görünüm: ders sütunları ya da gün listesi",
      route: "/ogrenci/program",
      purpose:
        "Aynı programı iki açıdan okursun: “Hafta · ders” dersleri sütun sütun gösterir, “Gün” ise günleri kontrol listesine çevirir.",
      highlights: [
        {
          label: "Hafta · ders",
          text: "Dersler sütun sütun dizilir (mobilde ders başına kart) — haftanın dağılımını tek bakışta görürsün.",
        },
        {
          label: "Gün",
          text: "Gün gün kontrol listesi; bugün en üste alınır ve vurgulanır — “bugün ne var?” sorusunun en hızlı cevabı.",
        },
        {
          label: "İlerleme çubuğu",
          text: "“Haftalık ilerleme” kartı biten görev sayısını ve yüzdeyi canlı gösterir; çubuk doldukça hafta kapanır.",
        },
        {
          label: "İşaretleme her yerde",
          text: "Hangi görünümde olursan ol, göreve dokunmak yeter — ikisi de aynı programı yazar.",
        },
      ],
      buttons: [
        {
          label: "Hafta · ders",
          does: "Programı ders sütunları hâlinde gösterir.",
        },
        {
          label: "Gün",
          does: "Programı günlük kontrol listesine çevirir; bugün en üstte durur.",
        },
      ],
      section: "gorev-isaretleme",
    },
    {
      id: "program-hafta",
      nav: "Program",
      title: "Haftalar arasında gez",
      route: "/ogrenci/program",
      purpose:
        "Üstteki oklarla geçmiş ve gelecek haftalara bakarsın; başlığın altındaki etiket hangi haftada olduğunu söyler. Hafta her zaman Pazartesi başlar.",
      highlights: [
        {
          label: "Oklar ve etiket",
          text: "Sol ok geçmişe, sağ ok geleceğe götürür; etiket “Bu hafta”, “Geçmiş hafta” ya da “Gelecek hafta” der — kaybolmazsın.",
        },
        {
          label: "Yayın kuralı",
          text: "Koçunun taslağı sana görünmez: o Yayınla'ya basana kadar hafta boş görünür — taslak üstünde çalışıyor olabilir, biraz bekle.",
        },
        {
          label: "Program henüz hazır değil",
          text: "Geçmiş bir haftada yayınlanmış plan yoksa bu kartı görürsün — o hafta program tutulmamış demektir.",
        },
        {
          label: "Boş haftada davet",
          text: "Bu hafta ya da gelecek bir hafta boşsa seni “Kendi programını oluştur” daveti karşılar — sıradaki adımın konusu.",
        },
      ],
      section: "program-nedir",
    },
    {
      id: "program-kendi",
      nav: "Program",
      title: "Kendi programını da kurabilirsin",
      route: "/ogrenci/program",
      purpose:
        "Koçun o hafta için program yayınlamadıysa planı sen kurarsın: konu ekle, düzenle, hazır olunca koçuna gönder.",
      highlights: [
        {
          label: "Taslak",
          text: "Konu eklemeye başladığın anda taslağın oluşur. Koçun inceleyip yayınlayana kadar yalnız plandır — yayınlanınca işaretlenebilir programa dönüşür.",
        },
        {
          label: "Konu detayı",
          text: "Her konuya açıklama, gün, hedef soru ve kaynak iliştirebilirsin; gün seçmezsen haftanın genel konusu olur.",
        },
        {
          label: "Sınır",
          text: "Taslak yalnız bu hafta ve gelecek haftalar için açılır — geçmiş haftaya kendi programını yazamazsın.",
        },
        {
          label: "Gönderim",
          text: "Hazır olunca taslağını koçuna yollarsın; sonradan değiştirirsen düğme “Tekrar gönder” olur.",
        },
      ],
      buttons: [
        {
          label: "Konu ekle",
          does: "Yeni konu penceresini açar; penceredeki aynı düğme konuyu taslağa kaydeder.",
        },
        {
          label: "Koça gönder",
          does: "Taslağını koçuna iletir; koç düzenleyip yayınlar.",
        },
      ],
      tip: "Son söz her zaman koçunda: gönderdiğin taslağı o inceler, gerekirse düzeltir, sonra yayınlar.",
      section: "kendi-programin",
    },
    {
      id: "program-ai",
      nav: "Program",
      title: "AI ile konu öner: taslağı birlikte kurun",
      route: "/ogrenci/program",
      purpose:
        "Konu seçmekte zorlanırsan yapay zekâdan taslak iste: soru girişlerine, denemelerine ve eksiklerine bakıp konu listesi önerir. Sen eklemeden hiçbir şey yazılmaz.",
      highlights: [
        {
          label: "Nereden açılır",
          text: "Taslağının üstündeki “AI ile konu öner” düğmesi öneri penceresini açar; hafta bomboşsa aynı pencere “AI ile program oluştur” düğmesinden gelir.",
        },
        {
          label: "Odak",
          text: "İstersen tek cümlelik odak yazarsın — “Bu hafta matematik ve paragraf ağırlıklı” gibi; öneri ona göre şekillenir.",
        },
        {
          label: "Seçim sende",
          text: "Önerilen konular işaretli gelir; beğenmediğinin işaretini kaldırırsın — yalnız seçtiklerin taslağına eklenir.",
        },
        {
          label: "Sonrası",
          text: "Eklenen konular normal taslağına düşer: düzenler, gün ve kaynak bağlar, “Koça gönder” ile incelemeye yollarsın.",
        },
      ],
      buttons: [
        {
          label: "Taslak öner",
          does: "Verine bakıp konu listesini üretir.",
        },
        {
          label: "Yeniden öner",
          does: "Listeyi beğenmediysen baştan üretir.",
        },
        {
          label: "Koça gönder",
          does: "Hazırladığın taslağı koçunun incelemesine yollar.",
        },
      ],
      tip: "Odak yazmak öneriyi ciddi isabetlendirir — hangi derse yükleneceğini tek cümleyle söyle.",
      section: "ai-oneri",
    },
    {
      id: "sorular",
      nav: "Sorular",
      title: "Haftalık soru ızgarası",
      route: "/ogrenci/soru-takibi",
      target: "sorular-izgara",
      purpose:
        "Haftanın 7 günü × derslerin tablosu. Unuttuğun günü sonradan doldurur, geçmiş haftalara dönersin. Koçun da aynı tabloyu görür.",
      highlights: [
        {
          label: "Izgara",
          text: "Satırlar derslerin, sütunlar Pazartesi'den Pazar'a günler; bugünün sütunu renkli vurgulanır.",
        },
        {
          label: "Toplamlar",
          text: "Her satırın sonunda dersin haftalık toplamı, en altta günlük toplamlar ve haftanın genel toplamı durur.",
        },
        {
          label: "Kırılım izi",
          text: "Hücrenin altındaki ince mor çizgi, o girişte doğru/yanlış/boş kırılımı olduğunu gösterir.",
        },
        {
          label: "Koç da görür",
          text: "Koçun aynı ızgarayı kendi ekranından izler, gerekirse girişlerini düzeltir — ikiniz aynı tabloya bakarsınız.",
        },
      ],
      tip: "Bugün ekranındaki hızlı giriş de bu tabloya yazar — ikisi aynı kaydın iki kapısıdır, çift giriş yapma.",
      section: "soru-takibi",
    },
    {
      id: "sorular-hucre",
      nav: "Sorular",
      title: "Hücre paneli: ya üçü ya hiçbiri",
      route: "/ogrenci/soru-takibi",
      purpose:
        "Bir gün-ders hücresine dokununca alttan panel açılır: ya doğru/yanlış/boş üçünü birden girersin ya da sadece toplamı yazarsın.",
      highlights: [
        {
          label: "Ya üçü ya hiçbiri",
          text: "D/Y/B'nin yalnız birini ya da ikisini doldurursan panel “Üçünü de doldur ya da üçünü de boş bırak” der ve kayıt kabul edilmez.",
        },
        {
          label: "Canlı önizleme",
          text: "Üçü de dolunca Toplam, Net ve Doğruluk panelde anında hesaplanır — kırılım girmenin ödülünü hemen görürsün.",
        },
        {
          label: "Sadece toplam",
          text: "Kırılım istemiyorsan tek sayı da geçerli: alttaki toplam kutusuna yaz, gerisine karışma.",
        },
      ],
      buttons: [
        {
          label: "Tamam",
          does: "Hücre panelini kapatır; girdiklerin taslakta bekler, henüz kaydolmaz.",
        },
        {
          label: "Temizle",
          does: "Hücredeki değerleri siler (Kaydet'e basınca kayıttan da silinir).",
        },
      ],
      section: "dogru-yanlis-bos",
    },
    {
      id: "sorular-kaydet",
      nav: "Sorular",
      title: "Kaydet: değişen günler tek seferde",
      route: "/ogrenci/soru-takibi",
      purpose:
        "Panel kapatmak kaydetmek değildir: değişen günler sayaçta birikir, Kaydet hepsini tek seferde yazar.",
      highlights: [
        {
          label: "Kirli gün sayacı",
          text: "Kaydet'in solundaki “N günde kaydedilmemiş değişiklik var” yazısı seni uyarır; hepsi kayıtlıysa “Tüm değişiklikler kayıtlı” der.",
        },
        {
          label: "Tek dokunuşta hepsi",
          text: "Kaydet, değişen tüm günleri birden kaydeder — basmadan sayfadan ayrılırsan girdiklerin kaybolur.",
        },
        {
          label: "Geçmiş açık, gelecek kapalı",
          text: "Geçmiş haftalara dönüp unuttuğun günü doldurursun; gelecek haftanın oku pasiftir — çözülmemiş soru yazılmaz.",
        },
        {
          label: "Hafta Pazartesi başlar",
          text: "Ok tuşlarıyla gezerken etiket “Bu hafta” / “Geçmiş hafta” der; tüm toplamlar Pazartesi–Pazar aralığına aittir.",
        },
      ],
      buttons: [
        {
          label: "Kaydet",
          does: "Değişen tüm günleri birden kaydeder.",
        },
      ],
      tip: "Çıkmadan önce sayaca bak: “Tüm değişiklikler kayıtlı” yazıyorsa gönül rahatlığıyla çık.",
      section: "soru-takibi",
    },
    {
      id: "sure",
      nav: "Süre",
      title: "Çalışma süreni tut",
      route: "/ogrenci/kronometre",
      target: "sure-kayit",
      purpose:
        "Kronometre çalışırken saati tutar; koçun toplam süreni kendi ekranından izler. Unuttuğun oturum için manuel giriş de var — o sıradaki adımda.",
      highlights: [
        {
          label: "Özet kutuları",
          text: "Bugünkü, haftalık ve toplam çalışma süren ile çalışma serin sayfanın üstünde durur.",
        },
        {
          label: "Kronometre",
          text: "Dersi seç (kararsızsan “Genel / karışık” da olur), sayacı başlat; mola verirken duraklat.",
        },
        {
          label: "Bitir kuralı",
          text: "Oturum bitince süre dakikaya yuvarlanıp bugüne kaydedilir; 1 dakikadan kısa oturum kaydedilmez, düğme pasif kalır.",
        },
        {
          label: "İki sekme",
          text: "“Kronometre” canlı ölçer, “Manuel giriş” sonradan ekler — manueli sıradaki adımda geziyoruz.",
        },
      ],
      buttons: [
        {
          label: "Başla",
          does: "Sayacı başlatır; duraklatınca etiket “Devam” olur, “Duraklat” molada süreyi korur.",
        },
        {
          label: "Bitir",
          does: "Ölçülen süreyi bugüne kaydeder; 1 dakikadan kısa oturumda pasif kalır.",
        },
        {
          label: "Sıfırla",
          does: "Sayacı kaydetmeden sıfırlar.",
        },
      ],
      tip: "Sayaç yalnız bu sayfada yaşar: kaydetmeden sekmeyi kapatırsan süre kaybolur. Uzun oturumlarda arada bir “Bitir” deyip yeni oturum açmak güvenlidir.",
      section: "kronometre",
    },
    {
      id: "sure-manuel",
      nav: "Süre",
      title: "Manuel giriş ve bugünkü oturumlar",
      route: "/ogrenci/kronometre",
      purpose:
        "Kronometreyi açmayı unuttuysan “Manuel giriş” sekmesi telafidir: dersi, dakikayı ve günü elle yazarsın; istersen kanıt görseli de eklersin.",
      highlights: [
        {
          label: "Alanlar",
          text: "Ders, süre (dakika), gün ve isteğe bağlı not — geçmiş bir günü seçebilirsin ama geleceğe süre yazılamaz.",
        },
        {
          label: "Kanıt görseli",
          text: "“Görsel seç” ile ekran görüntüsü eklersin (en fazla 5 MB); kanıtlı kayıtta listede “Kanıt” bağlantısı çıkar.",
        },
        {
          label: "Bugünkü oturumlar",
          text: "Günün tüm kayıtları kaynağıyla (Kronometre / Manuel) listelenir — hangisi ölçüldü, hangisi elle girildi bellidir.",
        },
        {
          label: "Silme",
          text: "Yanlış kaydı satırın sonundaki çöp simgesiyle silersin — toplamlar anında güncellenir.",
        },
      ],
      buttons: [
        {
          label: "Görsel seç",
          does: "Kanıt ekran görüntüsünü seçmek için dosya penceresini açar.",
        },
        {
          label: "Süreyi ekle",
          does: "Manuel girdiğin süreyi seçtiğin güne kaydeder.",
        },
      ],
      section: "manuel-sure",
    },
    {
      id: "denemeler",
      nav: "Denemeler",
      title: "Denemelerini kaydet",
      route: "/ogrenci/denemeler",
      target: "denemeler-liste",
      purpose:
        "Girdiğin tüm denemeler burada listelenir; yeni deneme girişi ve analiz de buradan başlar.",
      highlights: [
        {
          label: "Deneme listesi",
          text: "Her denemenin tarihi, yayınevi, adı, neti ve analiz durumu tek satırda görünür — geçmişin tek listede.",
        },
        {
          label: "Analiz durumu",
          text: "Analizi girilen deneme yeşil “Analiz yapıldı” rozeti taşır; girilmemişte “Analiz gir →” bağlantısı seni bekler.",
        },
        {
          label: "Yeni deneme",
          text: "“Deneme ekle” seni ayrı bir forma götürür — formu sıradaki adımda geziyoruz.",
        },
      ],
      buttons: [
        {
          label: "Deneme ekle",
          does: "Yeni deneme formunu açar.",
        },
      ],
      section: "deneme-ekleme",
    },
    {
      id: "deneme-ekle",
      nav: "Denemeler",
      title: "Yeni deneme: künye + D/Y/B tablosu",
      route: "/ogrenci/denemeler/yeni",
      purpose:
        "Yeni deneme formu iki bölümdür: üstte denemenin künyesi, altta ders ders doğru/yanlış/boş tablosu. Sen sayıları girersin, gerisini sistem halleder.",
      highlights: [
        {
          label: "Künye",
          text: "Bölüm, kapsam (Tam deneme / Branş denemesi), tarih, yayınevi ve deneme adı üstte durur — kapsamı doğru seçmek önemli, grafikler ona göre ayrışır.",
        },
        {
          label: "D/Y/B tablosu",
          text: "Her dersin D, Y, B sütunlarını doldurursun; yazarken dersin neti satır satır, toplam net en altta canlı güncellenir.",
        },
        {
          label: "Giriş kontrolü",
          text: "Ders adının yanındaki “/40” gibi sayı resmî soru sayısıdır — D+Y+B toplamını onunla karşılaştırıp giriş hatanı anında yakala.",
        },
        {
          label: "Kayıt şartı",
          text: "En az bir derse giriş yapmadan kaydetme düğmesi pasif kalır.",
        },
      ],
      buttons: [
        {
          label: "Denemeyi kaydet",
          does: "Denemeyi kaydedip toplam neti bildirir ve seni listeye döndürür.",
        },
      ],
      section: "deneme-ekleme",
    },
    {
      id: "deneme-net",
      nav: "Denemeler",
      title: "Net nasıl hesaplanır, neden donar",
      route: "/ogrenci/denemeler/yeni",
      purpose:
        "Neti sen hesaplamazsın: net = doğru − yanlış ÷ bölen. Bölen LGS'de 3, YKS ve KPSS'de 4 — formül tabloda canlı işler.",
      highlights: [
        {
          label: "Formül",
          text: "LGS'de 3 yanlış, YKS ve KPSS'de 4 yanlış bir doğruyu götürür; boşlar neti etkilemez.",
        },
        {
          label: "Canlı hesap",
          text: "Sayıları yazarken her dersin neti ve tablonun altındaki toplam net anında güncellenir — kaydetmeden önce sonucu görürsün.",
        },
        {
          label: "Donmuş net",
          text: "Net, kaydedildiği anda hesaplanıp saklanır — formül sonradan değişse bile geçmiş netlerin asla değişmez.",
        },
        {
          label: "Tam / Branş",
          text: "Branş denemeleri listende durur ama net gelişim grafiğine yalnız tam denemeler girer — elma ile armut karışmaz.",
        },
      ],
      section: "net-hesabi",
    },
    {
      id: "deneme-analiz",
      nav: "Denemeler",
      title: "Denemenin analizini gir",
      route: "/ogrenci/denemeler",
      purpose:
        "Neti kaydetmek işin yarısı. Hangi konudan kaç soru kaçırdığını da girersen sistem eksik haritanı çıkarır — çalışma önceliğin buradan doğar.",
      highlights: [
        {
          label: "Analiz durumu",
          text: "Listede analizi girilen deneme yeşil “Analiz yapıldı” rozeti taşır; girilmemişte “Analiz gir →” bağlantısı seni bekler.",
        },
        {
          label: "Eksik = yanlış + boş",
          text: "Boş bıraktığın soru da o konuyu bilmediğinin işaretidir; ikisini birlikte sayarsın.",
        },
        {
          label: "Konu konu giriş",
          text: "Kitapçığı açıp kaçırdıklarını konulara ayırırsın; her konunun kutusuna sayıyı yazarsın, hiç kaçırmadığın konulara dokunmazsın.",
        },
        {
          label: "Nereyi besler",
          text: "Analizler, eksik konu sıralamasını ve ısı haritasını besler — analizsiz deneme o ekranlara hiç girmez.",
        },
      ],
      buttons: [
        {
          label: "Analiz gir →",
          does: "O denemenin konu-eksik giriş ekranını açar.",
        },
        {
          label: "Analizi kaydet",
          does: "Tüm eksikleri kaydeder ve seni Eksik konular ekranına götürür.",
        },
      ],
      tip: "Analizi deneme tazeyken gir — kitapçık elindeyken on dakika sürer, bir hafta sonra eziyete dönüşür.",
      section: "deneme-analizi",
    },
    {
      id: "gelisim",
      nav: "Gelişim",
      title: "Büyük resme bak",
      route: "/ogrenci/gelisim",
      target: "gelisim-kutular",
      purpose:
        "Netlerin, soru hacmin, çalışma süren ve otomatik içgörüler bir arada. Haftada bir buraya bakmak, gidişatı görmenin en kısa yolu.",
      highlights: [
        {
          label: "Özet kutuları",
          text: "Son tam deneme netin, toplam deneme sayın, bu haftaki ve tüm zamanlardaki soru sayın, doğruluk yüzden — hepsi en üstte.",
        },
        {
          label: "Eksik konular kartı",
          text: "“Eksik konular ve kaynak takibi” kartı Analiz ekranının kapısıdır — deneme analizlerinden çıkan eksik haritan orada.",
        },
        {
          label: "Sayfanın devamı",
          text: "Kutuların altında grafikler ve içgörüler sürer — hepsini sıradaki adımda geziyoruz.",
        },
      ],
      section: "gelisim",
    },
    {
      id: "gelisim-grafik",
      nav: "Gelişim",
      title: "Grafikler ve içgörüler",
      route: "/ogrenci/gelisim",
      purpose:
        "Kutuların altı grafiklerle sürer: net gelişimin, haftalık soru hacmin, çalışma süren, ders tablosu ve en altta otomatik içgörüler.",
      highlights: [
        {
          label: "Net gelişimi",
          text: "Yalnız tam denemelerden çizilir; branş denemeleri listende durur ama bu grafiğe girmez. Eğilim yukarıysa yol doğru.",
        },
        {
          label: "Haftalık hacim",
          text: "Son 8 haftanın soru sayısı grafiği — bu haftayı öncekilerle karşılaştır, düşüş varsa sebebini bil.",
        },
        {
          label: "Çalışma süresi",
          text: "Kronometre ve manuel girişlerin toplamı son 8 hafta boyunca çizilir; soru başına süre kutusu verimi söyler.",
        },
        {
          label: "Ders tablosu",
          text: "Ders ders soru ve doğruluk. Doğruluk yalnız D/Y/B girdiğin kayıtlardan hesaplanır — kırılım girmenin ödülü burada.",
        },
        {
          label: "İçgörüler",
          text: "Sistemin verinden çıkardığı kısa notlar en altta seni bekler.",
        },
      ],
      tip: "Doğruluğu düşük dersleri not et ve haftalık programına o derslerden konu koy — grafik güzelliği için değil, plan için var.",
      section: "gelisim",
    },
    {
      id: "analiz",
      nav: "Gelişim",
      title: "Eksik konular ve ısı haritası",
      route: "/ogrenci/analiz",
      target: "analiz-siralama",
      purpose:
        "Tüm deneme analizlerin tek yerde toplanır: en çok kaçırdığın konuların sıralaması ve deneme deneme ısı haritası. “Neye çalışayım?” sorusunun cevabı.",
      highlights: [
        {
          label: "Toplam eksik sıralaması",
          text: "En çok soru kaçırdığın konular en üstte — tepedeki 2-3 konuyu haftalık programına almak en akıllı hamledir.",
        },
        {
          label: "Isı haritası",
          text: "Eksikleri deneme deneme gösterir: satırı sürekli koyu kalan konu tesadüf değil, gerçek eksiktir. Rengi solan konu kapanıyor demektir.",
        },
        {
          label: "Veri kaynağı",
          text: "Ekran yalnız senin girdiğin deneme analizlerinden beslenir — analiz girmediğin deneme burada görünmez.",
        },
        {
          label: "Nereden açılır",
          text: "Alt barda yoktur: Gelişim'deki “Eksik konular ve kaynak takibi” kartından ya da analiz kaydedince otomatik açılır.",
        },
      ],
      buttons: [
        {
          label: "Kaynak takibi",
          does: "Kaynaklar ekranına götürür — eksik konuyu hangi kaynaktan kapattığını orada işaretlersin.",
        },
        {
          label: "Eksik konular ve kaynak takibi",
          does: "Gelişim ekranındaki bu kart, seni buraya getiren kapıdır.",
        },
      ],
      section: "analiz-ekrani",
    },
    {
      id: "kaynaklar",
      nav: "Kaynaklar",
      title: "Kaynakların: kitaplığını yönet",
      route: "/ogrenci/kaynaklar",
      target: "kaynaklar-yonetim",
      purpose:
        "Çalıştığın kitap ve soru bankalarını buraya eklersin; kaynak başına soru ve konu takibi de bu ekranda — ikisini sıradaki adımlarda geziyoruz.",
      highlights: [
        {
          label: "Kaynak listesi",
          text: "Ad, yazar, ders ve bağlantıyla kaynaklarını tutarsın. Biten kaynağı silme, arşivle — listen sade kalır, geçmişin korunur.",
        },
        {
          label: "Ders bağı",
          text: "Kaynağı bir derse ya da “Genel”e bağlarsın — konu matrisi ve kaynak sayaçları bu bağa göre dizilir.",
        },
        {
          label: "Koç da görür",
          text: "Koçun kokpitinden aynı kitaplığı izler — neyle çalıştığın ikinizin de önünde.",
        },
      ],
      buttons: [
        {
          label: "Kaynak ekle",
          does: "Yeni kaynak penceresini açar (ad, yazar/hoca, ders, not, bağlantı).",
        },
        {
          label: "Kaynağı ekle",
          does: "Penceredeki kaynağı listene kaydeder.",
        },
      ],
      tip: "Bir derste hiç kaynak görünmüyorsa o derse (ya da “Genel”e) kaynak eklememişsin demektir — önce “Kaynak ekle”.",
      section: "kaynak-yonetimi",
    },
    {
      id: "kaynaklar-soru",
      nav: "Kaynaklar",
      title: "Bugün kaynak başına soru",
      route: "/ogrenci/kaynaklar",
      purpose:
        "“Bugün kaynak başına soru” kartında her kaynaktan bugün kaç soru çözdüğünü girersin; koçun kaynak kaynak görür.",
      highlights: [
        {
          label: "Kutudan çıkınca kaydolur",
          text: "Sayıyı yaz, kutudan çık — kayıt kendiliğinden düşer, Kaydet düğmesi yoktur.",
        },
        {
          label: "Toplam bilgisi",
          text: "Her kaynağın altında dersi ve tüm zamanlar toplamı yazar — hangi kaynağı ne kadar tükettiğin bellidir.",
        },
        {
          label: "Ayrı sayaç",
          text: "Bu giriş Sorular sekmesindeki ders bazlı takipten ayrıdır ve ona otomatik yazılmaz — günlük toplamını yine soru takibine gir.",
        },
      ],
      section: "kaynak-soru",
    },
    {
      id: "kaynaklar-matris",
      nav: "Kaynaklar",
      title: "Konu × kaynak matrisi: Bitti'yi işaretle",
      route: "/ogrenci/kaynaklar",
      purpose:
        "“Konu × kaynak takibi” hangi konuyu hangi kaynakta bitirdiğinin haritasıdır: dersi seç, konu ile kaynağın kesişim hücresine dokun.",
      highlights: [
        {
          label: "Bitti işareti",
          text: "Hücreye dokun — yeşil tik anında kaydolur; yanlışsa tekrar dokun, işaret kalkar. Kaydet düğmesi yoktur.",
        },
        {
          label: "Sütunlar",
          text: "Seçtiğin derse ve “Genel”e bağlı kaynaklar sütun olur; satırın sonunda konunun kaç kaynakta bittiği yazar.",
        },
        {
          label: "Neye yarar",
          text: "Aynı konuyu ikinci bir kaynaktan da bitirmek pekiştirmenin kanıtıdır; koçun aynı matrisi kendi ekranından izler.",
        },
        {
          label: "Kaynak yoksa",
          text: "Ders için hiç kaynak yoksa matris boş kalır ve önce kaynak eklemeni ister — kapı yine “Kaynak ekle”.",
        },
      ],
      section: "konu-kaynak-matrisi",
    },
    {
      id: "icerik",
      nav: "İçerik",
      title: "Koçunun paylaştığı içerikler",
      route: "/ogrenci/icerik",
      target: "icerik-liste",
      purpose:
        "Koçunun senin için seçtiği video, PDF ve notlar burada birikir. İzlediklerini işaretlersin; koçun kimin neyi izlediğini kendi ekranından görür.",
      highlights: [
        {
          label: "Nereden açılır",
          text: "Alt barda yoktur; Bugün ekranındaki “İçerik” kartından girersin.",
        },
        {
          label: "Sana özel",
          text: "“Sana özel” rozetli içerikler koçunun özellikle sana atadıklarıdır — önceliğin onlar olsun.",
        },
        {
          label: "İzleme sayacı",
          text: "Başlığın altında kaç içerikten kaçını izlediğin yazar; biriken içerik olup olmadığını tek bakışta görürsün.",
        },
      ],
      buttons: [
        {
          label: "İçeriği aç",
          does: "İçeriğin bağlantısını (PDF, sayfa vb.) yeni sekmede açar; videolarda kapak görseline dokunmak yeter.",
        },
        {
          label: "İzledim işaretle",
          does: "İçeriği izlendi yapar, anında kaydolur; yanlışsa “İzlendi” düğmesine tekrar dokun, işaret kalkar.",
        },
      ],
      section: "icerik",
    },
    {
      id: "gorusmeler",
      nav: "Görüşmeler",
      title: "Koçunla görüşme planla",
      route: "/ogrenci/gorusmeler",
      target: "gorusmeler-alan",
      purpose:
        "Koçunun takviminden uygun saati seçip randevunu alırsın; yaklaşan ve geçmiş görüşmelerin durum rozetleriyle burada listelenir.",
      highlights: [
        {
          label: "Gömülü takvim",
          text: "“Görüşme saatini seç” kartında koçunun takvimi açılır: gün ve saat seçip randevuyu tamamlarsın.",
        },
        {
          label: "Onay adımı",
          text: "Saat seçtikten sonra alttaki onay düğmesine basarsın ki sistem planladığını bilsin ve Bugün ekranındaki uyarı kapansın.",
        },
        {
          label: "Görüşmelerim",
          text: "Yaklaşan ve geçmiş görüşmelerin Planlandı, Yapıldı, Gelmedi, İptal rozetleriyle listelenir.",
        },
      ],
      buttons: [
        {
          label: "Görüşmemi planladım",
          does: "Planladığını sisteme bildirir; kart “Planlandı ✓” durumuna geçer.",
        },
        {
          label: "Katıl",
          does: "Görüşme saatinde video bağlantısını yeni sekmede açar.",
        },
      ],
      tip: "Gömülü takvim yüklenmezse “Takvim açılmıyorsa buradan planla →” bağlantısı aynı takvimi yeni sekmede açar.",
      section: "gorusmeler",
    },
    {
      id: "odemeler",
      nav: "Ödemeler",
      title: "Bakiye, faturalar ve ödeme bildirimi",
      route: "/ogrenci/odemeler",
      target: "odemeler-bakiye",
      purpose:
        "Kalan bakiyeni, faturalarını ve ödeme geçmişini görürsün; bankadan gönderdiğin ödemeyi buradan bildirirsin. Onayı her zaman koçun verir.",
      highlights: [
        {
          label: "Üst kutular",
          text: "Kalan bakiyen ve bugüne kadar ödediğin toplam en üstte durur.",
        },
        {
          label: "Faturalar",
          text: "Ücret planın ve dönem faturaların listelenir; açık faturanın satırındaki “Bildir” düğmesi tutarı otomatik doldurur.",
        },
        {
          label: "Bildirim akışı",
          text: "Parayı bankadan sen gönderirsin — uygulama transfer yapmaz. Bildirimin “Onay bekliyor” rozetiyle koçunun onayına düşer.",
        },
        {
          label: "Onay",
          text: "Koçun onaylayana kadar bakiyen değişmez; onaylanınca tutar düşer ve ödeme geçmişine geçer.",
        },
      ],
      buttons: [
        {
          label: "Ödeme bildir",
          does: "Bildirim formunu açar: tutar, gönderim tarihi, yöntem ve istersen dekont notu.",
        },
        {
          label: "Bildirimi gönder",
          does: "Bildirimi koçunun onayına yollar.",
        },
      ],
      tip: "Ekrana Profil'deki “Ödemelerime git” düğmesinden de ulaşırsın. Dekont numarasını nota yazarsan onay hızlanır.",
      section: "odemeler",
    },
    {
      id: "asistan-profil",
      nav: "Asistan & Profil",
      title: "Asistanın, profilin — ve turun sonu",
      route: "/ogrenci/asistan",
      purpose:
        "Verine dayanarak cevap veren yapay zekâ asistanını her ekrandan açabilirsin; profil ve tema üst bardadır. 28 adımın sonuna geldik — gerisi pratik.",
      highlights: [
        {
          label: "Asistan",
          text: "Soru girişlerini, denemelerini, sürelerini ve eksiklerini bilir; “Bu hafta neye ağırlık vermeliyim?” gibi soruları senin verinden cevaplar.",
        },
        {
          label: "Her yerden açılır",
          text: "Sağ alttaki yüzen mor “Asistan” düğmesi her ekranda seninle gelir; tam ekran hâli de bu sayfadadır.",
        },
        {
          label: "Profil",
          text: "Üst bardaki kişi simgesinden bilgilerini güncellersin — koçun bunları görür, güncel tut. “Ödemelerime git” kısayolu da orada.",
        },
        {
          label: "Tema ve çıkış",
          text: "Üst bardaki güneş/ay simgesi açık-koyu tema arasında geçer; en uçtaki simge oturumu kapatır.",
        },
        {
          label: "Devamı",
          text: "Ayrıntı gerektiğinde rehber her ekranı ve her butonu anlatır; akış sayfası ise işlerin hangi sırayla yürüdüğünü gösterir.",
        },
      ],
      buttons: [
        {
          label: "Gönder",
          does: "Yazdığın soruyu asistana iletir; hazır öneri çiplerine dokunmak da yeter.",
        },
        {
          label: "Kaydet",
          does: "Profil değişikliklerini kaydeder.",
        },
      ],
      tip: "Takıldığında sıra şu: önce asistana sor, sonra rehberde ara, akışa bak — strateji ve moral içinse her zaman koçun.",
      section: "asistan",
    },
  ],
};

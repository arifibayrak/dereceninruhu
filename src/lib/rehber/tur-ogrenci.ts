import type { Tour } from "@/lib/rehber/tur-types";

/**
 * Öğrenci uygulamasının ürün turu.
 *
 * Rehber (`ogrenci.ts`) "ekranı ara, oku"; akış (`akis.ts`) "sıra nasıl
 * işler"; bu dosya ise sunum: uygulamayı alt gezinme sırasıyla baştan sona
 * gezdirir. Buton etiketleri uygulamadaki dizelerle birebirdir.
 */
export const ogrenciTuru: Tour = {
  id: "ogrenci",
  title: "Uygulama turu",
  subtitle:
    "Uygulamayı 15 adımda ekran ekran gez: ne nerede, hangi düğme ne yapar, günlük rutinin nasıl işler.",
  guideBase: "/ogrenci/rehber",
  steps: [
    {
      id: "hosgeldin",
      nav: "Tur",
      title: "Hoş geldin, kısa bir tur atalım",
      purpose:
        "Bu tur uygulamayı baştan sona tanıtır: 15 adımda hangi ekran ne işe yarar, üstünde neler var, en çok hangi düğmeleri kullanacaksın. Beş dakikanı alır.",
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
      purpose:
        "Uygulamayı açınca gelen ekran. Günün özeti, bugünün görevleri ve hızlı soru girişi tek yerde — günlük rutinin tamamı buradan yürür.",
      highlights: [
        {
          label: "Dört kutu",
          text: "Seri (arka arkaya giriş yaptığın günler), Bu hafta (soru toplamın), Son net ve Çalışma süren — günün fotoğrafı tek bakışta.",
        },
        {
          label: "Bugünün programı",
          text: "Koçunun bugüne koyduğu görevler. Bitirdiğine dokun, yeşil tik düşer — işaret anında kaydolur, geri almak için tekrar dokun.",
        },
        {
          label: "Hızlı soru girişi",
          text: "“Bugün kaç soru çözdün?” bölümüne ders ders sayılarını yazarsın; istersen ok ile doğru/yanlış/boş kırılımını açarsın.",
        },
        {
          label: "Sonraki görüşme",
          text: "Yaklaşan görüşmen kartta saatiyle görünür; vakti gelince buradan katılırsın.",
        },
      ],
      buttons: [
        {
          label: "Kaydet",
          does: "Hızlı soru girişindeki sayıları bugüne yazar — basmadan hiçbir şey kaydolmaz.",
        },
        {
          label: "Haftanın tamamını gör",
          does: "Görev listesinden haftalık program ekranına götürür.",
        },
        {
          label: "Katıl",
          does: "Görüşmenin video bağlantısını yeni sekmede açar.",
        },
      ],
      tip: "Soru girişinden sonra “Bugünkü sorular kaydedildi 🔥” bildirimini görmeden çıkma — görmediysen kaydolmamıştır.",
      section: "bugun",
    },
    {
      id: "program",
      nav: "Program",
      title: "Haftalık programın",
      route: "/ogrenci/program",
      purpose:
        "Koçunun senin için yayınladığı haftalık konu planı. Görevleri buradan izler, bitirdiklerini işaretlersin. Hafta her zaman Pazartesi başlar.",
      highlights: [
        {
          label: "Motto ve koç notu",
          text: "Koçun haftanın stratejisini en üstte anlatır — haftaya oradan başla.",
        },
        {
          label: "İki görünüm",
          text: "“Hafta · ders” dersleri sütun sütun gösterir; “Gün” ise gün gün kontrol listesidir, bugün en üstte durur.",
        },
        {
          label: "Anında işaretleme",
          text: "Bitirdiğin konuya dokunman yeter: işaret anında kaydolur, Kaydet düğmesi yoktur. Yanlışsa tekrar dokun, geri alınır.",
        },
        {
          label: "Hafta gezme",
          text: "Üstteki oklarla geçmiş ve gelecek haftalara bakarsın; başlığın altında hangi haftada olduğun yazar.",
        },
      ],
      buttons: [
        {
          label: "Hafta · ders",
          does: "Programı ders sütunları hâlinde gösterir (mobilde ders başına kart).",
        },
        {
          label: "Gün",
          does: "Programı günlük kontrol listesine çevirir; ilerleme çubuğu yüzdeyi canlı gösterir.",
        },
      ],
      tip: "“Program henüz hazır değil” yazıyorsa koçun o haftayı henüz yayınlamamıştır — taslağı sana görünmez, biraz bekle ya da sonraki adıma bak.",
      section: "program-nedir",
    },
    {
      id: "program-kendi",
      nav: "Program",
      title: "Kendi programını da kurabilirsin",
      route: "/ogrenci/program",
      purpose:
        "Koçun o hafta için program yayınlamadıysa planı sen kurarsın: konu ekle, istersen yapay zekâdan öneri al, hazır olunca koçuna gönder.",
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
          label: "AI önerisi",
          text: "Yapay zekâ soru girişlerine, denemelerine ve eksiklerine bakıp konu listesi önerir. Beğenmediğinin işaretini kaldırırsın — sen eklemeden hiçbir şey yazılmaz.",
        },
        {
          label: "Sınır",
          text: "Taslak yalnız bu hafta ve gelecek haftalar için açılır — geçmiş haftaya kendi programını yazamazsın.",
        },
      ],
      buttons: [
        {
          label: "Konu ekle",
          does: "Yeni konu penceresini açar; penceredeki aynı düğme konuyu taslağa kaydeder.",
        },
        {
          label: "AI ile konu öner",
          does: "Öneri penceresini açar; “Taslak öner” ile liste gelir, seçtiklerini taslağa eklersin.",
        },
        {
          label: "Koça gönder",
          does: "Taslağını koçuna iletir; koç düzenleyip yayınlar. Sonradan değiştirirsen “Tekrar gönder” olur.",
        },
      ],
      tip: "Son söz her zaman koçunda: gönderdiğin taslağı o inceler, gerekirse düzeltir, sonra yayınlar.",
      section: "kendi-programin",
    },
    {
      id: "sorular",
      nav: "Sorular",
      title: "Haftalık soru ızgarası",
      route: "/ogrenci/soru-takibi",
      purpose:
        "Haftanın 7 günü × derslerin tablosu. Unuttuğun günü sonradan doldurur, geçmiş haftalara dönersin. Koçun da aynı tabloyu görür.",
      highlights: [
        {
          label: "Hücre paneli",
          text: "Bir gün-ders hücresine dokununca alttan panel açılır: ya doğru/yanlış/boş üçünü birden girersin ya da sadece toplamı yazarsın.",
        },
        {
          label: "Ya üçü ya hiçbiri",
          text: "D/Y/B'nin yalnız birini ya da ikisini doldurursan kayıt kabul edilmez. Üçünü girersen net ve doğruluk otomatik hesaplanır.",
        },
        {
          label: "Hafta gezme",
          text: "Geçmiş haftalara giriş serbesttir; gelecek haftaya kapalıdır — çözülmemiş soru yazılmaz. Hafta Pazartesi başlar.",
        },
        {
          label: "Kırılım izi",
          text: "Hücrenin altındaki ince mor çizgi, o girişte D/Y/B kırılımı olduğunu gösterir.",
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
        {
          label: "Kaydet",
          does: "Değişen tüm günleri birden kaydeder — basmadan sayfadan ayrılırsan girdiklerin kaybolur.",
        },
      ],
      tip: "Panel kapatmak kaydetmek değildir: istediğin kadar hücre düzenle, ama çıkmadan önce mutlaka “Kaydet”e bas.",
      section: "soru-takibi",
    },
    {
      id: "sure",
      nav: "Süre",
      title: "Çalışma süreni tut",
      route: "/ogrenci/kronometre",
      purpose:
        "Kronometre çalışırken saati tutar; unuttuğun oturumu manuel girişle sonradan eklersin. Koçun toplam süreni kendi ekranından izler.",
      highlights: [
        {
          label: "Özet kutuları",
          text: "Bugünkü, haftalık ve toplam çalışma süren ile çalışma serin sayfanın üstünde durur.",
        },
        {
          label: "Kronometre",
          text: "Dersi seç, sayacı başlat; mola verirken duraklat. Oturum bitince süre dakikaya yuvarlanıp bugüne kaydedilir.",
        },
        {
          label: "Manuel giriş",
          text: "Kronometreyi açmayı unuttuysan dersi, dakikayı ve günü elle yazarsın; istersen “Görsel seç” ile kanıt eklersin (en fazla 5 MB).",
        },
        {
          label: "Bugünkü oturumlar",
          text: "Günün tüm kayıtları kaynağıyla (Kronometre / Manuel) listelenir; yanlış kaydı buradan silersin.",
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
          label: "Süreyi ekle",
          does: "Manuel girdiğin süreyi seçtiğin güne kaydeder — geleceğe süre yazılamaz.",
        },
      ],
      tip: "Sayaç yalnız bu sayfada yaşar: kaydetmeden sekmeyi kapatırsan süre kaybolur. Uzun oturumlarda arada bir “Bitir” deyip yeni oturum açmak güvenlidir.",
      section: "kronometre",
    },
    {
      id: "denemeler",
      nav: "Denemeler",
      title: "Denemelerini kaydet",
      route: "/ogrenci/denemeler",
      purpose:
        "Girdiğin tüm denemeler burada listelenir. Yeni deneme eklerken ders ders doğru/yanlış/boş girersin; net satır satır canlı hesaplanır.",
      highlights: [
        {
          label: "Deneme listesi",
          text: "Her denemenin tarihi, yayınevi, adı, neti ve analiz durumu tek satırda görünür.",
        },
        {
          label: "Yeni deneme formu",
          text: "Bölüm, kapsam (tam deneme / branş denemesi), tarih ve yayınevi üstte; ders tablosunda D, Y, B sütunlarını doldurursun.",
        },
        {
          label: "Canlı net",
          text: "Net = doğru − yanlış ÷ bölen: LGS'de 3, YKS ve KPSS'de 4. Yazarken her dersin neti ve toplam anında güncellenir.",
        },
        {
          label: "Donmuş net",
          text: "Net, kaydedildiği anda hesaplanıp saklanır — formül sonradan değişse bile geçmiş netlerin asla değişmez.",
        },
      ],
      buttons: [
        {
          label: "Deneme ekle",
          does: "Yeni deneme formunu açar.",
        },
        {
          label: "Denemeyi kaydet",
          does: "Denemeyi kaydedip toplam neti bildirir; en az bir derse giriş yapmadan pasiftir.",
        },
      ],
      tip: "Ders adının yanındaki “/40” gibi sayı resmî soru sayısıdır — D+Y+B toplamını onunla karşılaştırıp giriş hatanı anında yakala.",
      section: "deneme-ekleme",
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
      purpose:
        "Netlerin, soru hacmin, çalışma süren ve otomatik içgörüler bir arada. Haftada bir buraya bakmak, gidişatı görmenin en kısa yolu.",
      highlights: [
        {
          label: "Özet kutuları",
          text: "Son tam deneme netin, toplam deneme sayın, bu haftaki ve tüm zamanlardaki soru sayın, doğruluk yüzden.",
        },
        {
          label: "Net grafiği",
          text: "Yalnız tam denemelerden çizilir; branş denemeleri listende durur ama bu grafiğe girmez. Eğilim yukarıysa yol doğru.",
        },
        {
          label: "Hacim ve süre",
          text: "Son 8 haftanın soru sayısı ile çalışma süresi grafikleri — bu haftayı öncekilerle karşılaştır.",
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
      title: "Kaynakların ve konu takibin",
      route: "/ogrenci/kaynaklar",
      purpose:
        "Çalıştığın kitap ve soru bankalarını buraya eklersin: her kaynaktan günde kaç soru çözdüğünü ve hangi konuyu hangi kaynakta bitirdiğini takip edersin.",
      highlights: [
        {
          label: "Kaynak listesi",
          text: "Ad, yazar, ders ve bağlantıyla kaynaklarını tutarsın. Biten kaynağı silme, arşivle — listen sade kalır, geçmişin korunur.",
        },
        {
          label: "Bugün kaynak başına soru",
          text: "Her kaynağın kutusuna bugünkü sayıyı yazarsın; kutudan çıkınca kaydolur, Kaydet düğmesi yoktur.",
        },
        {
          label: "Konu × kaynak takibi",
          text: "Ders seç, biten konu ile kaynağın kesişim hücresine dokun — yeşil tik anında kaydolur, tekrar dokununca kalkar.",
        },
        {
          label: "Ayrı sayaç",
          text: "Kaynak başına soru, Sorular sekmesindeki ders bazlı takipten ayrıdır ve ona otomatik yazılmaz — günlük toplamını yine soru takibine gir.",
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
      id: "icerik",
      nav: "İçerik",
      title: "Koçunun paylaştığı içerikler",
      route: "/ogrenci/icerik",
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
        "Verine dayanarak cevap veren yapay zekâ asistanını her ekrandan açabilirsin; profil ve tema üst bardadır. Tur burada bitiyor — gerisi pratik.",
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

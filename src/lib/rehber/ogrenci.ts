import type { Guide } from "@/lib/rehber/types";

export const ogrenciRehberi: Guide = {
  basePath: "/ogrenci/rehber",
  title: "Öğrenci rehberi",
  description:
    "Uygulamadaki her ekranı ve her butonu adım adım anlatır. Baştan sona okuyabilir ya da aradığın butonu arama kutusundan bulabilirsin.",
  sections: [
    /* ----------------------------- Başlangıç ----------------------------- */
    {
      id: "nasil-kullanilir",
      no: 1,
      chapter: "Başlangıç",
      title: "Bu rehber nasıl kullanılır",
      lead: "Rehber, uygulamadaki her ekranı ve her butonu anlatır. Sırayla okuman gerekmez — aradığını bul, oku, uygula.",
      keywords: ["rehber", "arama", "yardım", "kılavuz"],
      blocks: [
        {
          kind: "para",
          text: "Her bölüm tek bir ekranı ya da tek bir işi anlatır: önce ne işe yaradığı, sonra adım adım nasıl yapılacağı, en sonda o ekrandaki butonların listesi. Buton listelerindeki etiketler uygulamadakiyle birebir aynıdır.",
        },
        {
          kind: "steps",
          title: "Aradığını bulmak için",
          items: [
            "Bir butonun ne yaptığını merak ediyorsan üstteki arama kutusuna adını yaz (örn. “Koça gönder”).",
            "Bir ekranı baştan öğrenmek istiyorsan içindekilerden bölümünü aç.",
            "Bölüm başındaki “Ekrana git” bağlantısı seni doğrudan anlatılan ekrana götürür.",
          ],
        },
        {
          kind: "tip",
          text: "İlk haftanda 4, 5, 6 ve 11 numaralı bölümleri okuman yeter: Bugün ekranı, soru girişi ve görev işaretleme günlük rutinin tamamıdır.",
        },
      ],
    },
    {
      id: "hesap-ve-giris",
      no: 2,
      chapter: "Başlangıç",
      title: "Hesabını aç ve giriş yap",
      lead: "Telefon numaranla başlarsın. Sistem seni tanır: ilk kez geliyorsan PIN belirlersin, hesabın varsa PIN ile girersin.",
      where: "/katil",
      keywords: ["katıl", "giriş", "PIN", "telefon", "şifre", "aktivasyon"],
      blocks: [
        {
          kind: "para",
          text: "Giriş kimliğin telefon numarandır — koçunla paylaştığın numara. /katil sayfasına numaranı yazınca sistem durumuna göre yönlendirir: hesabın hazırsa PIN sorar, ilk girişinse PIN belirletir, numaran kayıtlı değilse kısa bir talep formu açar.",
        },
        {
          kind: "steps",
          title: "İlk giriş",
          items: [
            "/katil sayfasında telefon numaranı yaz ve “Devam et”e bas.",
            "İlk kez giriyorsan “PIN belirle” alanına 4-6 rakamlı bir PIN yaz, aynısını “PIN tekrar” alanına yaz.",
            "“Başlayalım”a bas — hesabın açılır ve doğrudan Bugün ekranına geçersin.",
            "Sonraki girişlerde aynı numara + PIN ile “Giriş yap”a basman yeter.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Devam et",
              where: "Telefon adımında, alanın altında",
              does: "Numaranı kontrol eder ve seni doğru adıma (giriş / PIN belirleme / talep formu) yönlendirir.",
            },
            {
              label: "Giriş yap",
              where: "PIN adımında, alanın altında",
              does: "Telefon + PIN ile oturum açar; öğrenciysen /ogrenci ekranına gidersin.",
            },
            {
              label: "Başlayalım",
              where: "PIN belirleme adımında, alanların altında",
              does: "Hesabını oluşturur, seçtiğin PIN ile otomatik giriş yapar.",
            },
            {
              label: "Talebi gönder",
              where: "Talep formunda, alanların altında",
              does: "Numaran kayıtlı değilse ad ve sınav bilgini koça iletir; koçun WhatsApp'tan döner.",
            },
            {
              label: "Farklı numara",
              where: "Her adımın en altında",
              does: "Telefon adımına geri döner; başka bir numarayla denersin.",
            },
          ],
        },
        {
          kind: "warning",
          text: "PIN 4-6 rakam olmalı. PIN'ini unutursan uygulamadan sıfırlayamazsın — koçuna WhatsApp'tan yaz, senin için sıfırlasın.",
        },
        {
          kind: "note",
          text: "Koçlar telefonla değil, e-posta adresiyle giriş yapar. /giris sayfasındaki alan ikisini de kabul eder; sen öğrenci olarak her zaman telefon numaranı kullan.",
        },
      ],
    },
    {
      id: "harita",
      no: 3,
      chapter: "Başlangıç",
      title: "Uygulamanın haritası",
      lead: "Alt barda 7 sekme var; birkaç ekran ise sadece bağlantılarla açılır. Bu bölüm hangi işin nerede olduğunu gösterir.",
      keywords: [
        "gezinme",
        "menü",
        "sekme",
        "alt bar",
        "üst bar",
        "harita",
        "nerede",
      ],
      blocks: [
        {
          kind: "para",
          text: "Ekranın altındaki bar her sayfadan erişebildiğin 7 sekmeyi taşır. Üst barda ise profil, tema ve çıkış duruyor. Sağ alttaki mor “Asistan” düğmesi her ekranda seninle gelir.",
        },
        {
          kind: "table",
          title: "Alt bardaki 7 sekme",
          head: ["Sekme", "Rota", "Ne için"],
          rows: [
            ["Bugün", "/ogrenci", "Günün özeti, görevler ve hızlı soru girişi"],
            ["Program", "/ogrenci/program", "Haftalık program — işaretleme ve kendi taslağın"],
            ["Sorular", "/ogrenci/soru-takibi", "Haftalık soru ızgarası (gün × ders)"],
            ["Süre", "/ogrenci/kronometre", "Kronometre ve manuel çalışma süresi"],
            ["Denemeler", "/ogrenci/denemeler", "Deneme sonuçların ve analizleri"],
            ["Gelişim", "/ogrenci/gelisim", "Net grafiği, soru hacmi, içgörüler"],
            ["Kaynaklar", "/ogrenci/kaynaklar", "Kaynakların, kaynak başına soru, konu takibi"],
          ],
        },
        {
          kind: "table",
          title: "Alt barda olmayan ekranlar",
          head: ["Ekran", "Rota", "Nereden açılır"],
          rows: [
            ["Eksik konular (Analiz)", "/ogrenci/analiz", "Gelişim'deki “Eksik konular ve kaynak takibi” kartından"],
            ["İçerik", "/ogrenci/icerik", "Bugün ekranındaki “İçerik” kartından"],
            ["Görüşmeler", "/ogrenci/gorusmeler", "Bugün ekranındaki görüşme kartından"],
            ["Ödemeler", "/ogrenci/odemeler", "Profil'deki “Ödemelerime git” düğmesinden"],
            ["Profil", "/ogrenci/profil", "Üst bardaki kişi simgesinden"],
            ["Asistan", "/ogrenci/asistan", "Bugün'deki “Asistana sor” kartından ya da sağ alttaki düğmeden"],
          ],
        },
        {
          kind: "buttons",
          title: "Üst bar",
          rows: [
            {
              label: "Profil",
              where: "Üst sağ, kişi simgesi",
              does: "Profil sayfanı açar (bilgilerini düzenlersin).",
            },
            {
              label: "Temayı değiştir",
              where: "Üst sağ, güneş/ay simgesi",
              does: "Açık ve koyu tema arasında geçiş yapar.",
            },
            {
              label: "Çıkış yap",
              where: "Üst sağ, en uçtaki simge",
              does: "Oturumu kapatır ve giriş sayfasına döner.",
            },
            {
              label: "Asistan",
              where: "Sağ alt, yüzen mor düğme",
              does: "Asistan sohbetini küçük bir panelde açar — sayfadan ayrılmadan soru sorarsın.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Logoya dokunmak seni her zaman Bugün ekranına döndürür.",
        },
      ],
    },
    {
      id: "bugun",
      no: 4,
      chapter: "Başlangıç",
      title: "Bugün ekranı",
      lead: "Günün karargâhı: seri, haftalık soru, son net, günün görevleri ve hızlı soru girişi tek ekranda.",
      where: "/ogrenci",
      keywords: ["bugün", "ana sayfa", "seri", "özet", "görevler"],
      blocks: [
        {
          kind: "para",
          text: "Uygulamayı açınca ilk burası gelir. Üstte dört kutu var: Seri (arka arkaya soru girdiğin gün sayısı), Bu hafta (haftalık soru toplamın), Son net (son tam denemen) ve Çalışma (bu haftaki süre — dokununca kronometreye gider). Altında günün program görevleri ve hızlı soru girişi sıralanır.",
        },
        {
          kind: "steps",
          title: "Günlük rutin",
          items: [
            "“Bugünün programı” listesinde günün görevlerini gör; bitirdiklerine dokunarak işaretle.",
            "Gün sonunda “Bugün kaç soru çözdün?” bölümüne ders ders sayılarını gir — kutudan çıktığın anda kendiliğinden kaydedilir.",
            "Yaklaşan görüşmen varsa kartında saati görürsün; görüşme saatinde “Katıl” ile bağlanırsın.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Katıl",
              where: "“Sonraki görüşme” kartında, sağda",
              does: "Görüşmenin video bağlantısını yeni sekmede açar (yalnız bağlantı tanımlıysa görünür).",
            },
            {
              label: "Görüşmelerini planla →",
              where: "“Sonraki görüşme” kartının altında",
              does: "Görüşmeler ekranını açar; planlı görüşmen varsa etiket “Yeniden planla →” olur.",
            },
            {
              label: "Asistana sor",
              where: "Kart listesinde",
              does: "Asistan sohbet ekranını açar.",
            },
            {
              label: "İçerik",
              where: "Kart listesinde",
              does: "Koçunun paylaştığı video, PDF ve notların listesini açar.",
            },
            {
              label: "Haftanın tamamını gör",
              where: "“Bugünün programı” listesinin altında",
              does: "Haftalık program ekranına gider.",
            },
            {
              label: "Tekrar dene",
              where: "Hızlı soru girişinin altındaki yapışkan barda, yalnız kayıt başarısızsa",
              does: "Kaydedilemeyen girişi yeniden gönderir (bağlantı koptuğunda çıkar).",
            },
          ],
        },
        {
          kind: "tip",
          text: "Ekranın üstünde “Görüşmelerini henüz planlamadın” uyarısı görüyorsan koçun takvimi hazır demektir — birkaç dakikanı ayırıp saat seç, uyarı kaybolur.",
        },
      ],
    },

    /* ---------------------------- Günlük döngü ---------------------------- */
    {
      id: "hizli-soru-girisi",
      no: 5,
      chapter: "Günlük döngü",
      title: "Hızlı soru girişi",
      lead: "Bugün ekranının altındaki bölüm: ders başına bugünkü soru sayını girersin, istersen doğru/yanlış/boş kırılımıyla.",
      where: "/ogrenci",
      keywords: ["soru girişi", "hızlı", "D/Y/B", "kaydet", "bugün"],
      blocks: [
        {
          kind: "para",
          text: "En kısa yol tek sayı yazmaktır: dersin kutusuna bugünkü toplam soru sayını gir. Daha fazlasını istiyorsan satırın sağındaki ok ile doğru/yanlış/boş alanlarını açarsın — üçünü de doldurunca toplam, net ve doğruluk otomatik hesaplanır.",
        },
        {
          kind: "steps",
          items: [
            "Dersin satırında sayı kutusuna toplamı yaz ya da + / − ile 5'er 5'er ayarla.",
            "Kırılım gireceksen ok'a dokun, Doğru / Yanlış / Boş alanlarının üçünü de doldur.",
            "Diğer dersler için aynısını yap; alttaki bar günün toplamını gösterir.",
            "Hepsi bu — Kaydet düğmesi yoktur: + / − dokunuşu anında, elle yazdığın sayı ise kutudan çıkınca kaydedilir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "−",
              where: "Ders satırında, sayı kutusunun solunda",
              does: "Toplamı 5 azaltır (kırılım açıksa doğru sayısını azaltır).",
            },
            {
              label: "+",
              where: "Ders satırında, sayı kutusunun sağında",
              does: "Toplamı 5 artırır (kırılım açıksa doğru sayısını artırır).",
            },
            {
              label: "Sayı kutusu",
              where: "Ders satırının ortasında",
              does: "Toplam soru sayısını elle yazarsın; kırılım doluyken kilitlenir ve D+Y+B'den hesaplanır.",
            },
            {
              label: "Ok (D/Y/B)",
              where: "Ders satırının en sağında",
              does: "Doğru / Yanlış / Boş alanlarını açıp kapatır.",
            },
            {
              label: "Tekrar dene",
              where: "Alt bar, yalnız kayıt başarısız olduğunda",
              does: "Kaydedilemeyen girişi yeniden gönderir; normalde alt barda “Kaydedildi” yazar.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Doğru/yanlış/boş alanlarından yalnız birini ya da ikisini doldurursan kayıt engellenir: ya üçünü birden doldur ya üçünü de boş bırakıp sadece toplamı yaz.",
        },
      ],
    },
    {
      id: "soru-takibi",
      no: 6,
      chapter: "Günlük döngü",
      title: "Haftalık soru ızgarası",
      lead: "Sorular sekmesi: haftanın 7 günü × derslerin tablosu. Unuttuğun günü sonradan doldurabilir, geçmiş haftalara dönebilirsin.",
      where: "/ogrenci/soru-takibi",
      keywords: ["soru takibi", "ızgara", "hafta", "hücre", "tablo"],
      blocks: [
        {
          kind: "para",
          text: "Hafta Pazartesi başlar, Pazar biter (Türkiye saatiyle). Her hücre bir ders-gün ikilisidir; dokununca alttan bir panel açılır ve doğru/yanlış/boş ya da sadece toplam girersin. Koçun da aynı tabloyu görür.",
        },
        {
          kind: "steps",
          items: [
            "Doldurmak istediğin hücreye dokun — alttan düzenleme paneli açılır.",
            "Doğru / Yanlış / Boş üçünü birden gir ya da hepsini boş bırakıp alttaki toplam alanını doldur.",
            "“Tamam” ile paneli kapat — hücre o anda kaydedilir.",
            "Sıradaki hücreye geç; ayrıca basılacak bir Kaydet düğmesi yoktur.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Önceki hafta",
              where: "Hafta başlığının solundaki ok",
              does: "Bir önceki haftanın tablosunu açar; geçmişe giriş serbesttir.",
            },
            {
              label: "Sonraki hafta",
              where: "Hafta başlığının sağındaki ok",
              does: "Bir sonraki haftaya geçer; bu haftadayken kapalıdır — geleceğe soru girilemez.",
            },
            {
              label: "Hücre",
              where: "Tabloda gün × ders kesişimi",
              does: "O günün o dersine ait düzenleme panelini açar.",
            },
            {
              label: "Temizle",
              where: "Hücre paneli, alt solda",
              does: "Hücredeki tüm değerleri siler ve paneli kapatır; silme anında kaydedilir.",
            },
            {
              label: "Tamam",
              where: "Hücre paneli, alt sağda",
              does: "Paneli kapatır ve hücreyi kaydeder. Panelin dışına dokunmak da aynı şeyi yapar.",
            },
            {
              label: "Tekrar dene",
              where: "Tablonun altında, yalnız kayıt başarısız olduğunda",
              does: "Kaydedilemeyen hücreyi yeniden gönderir; normalde orada “Kaydedildi” yazar.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Bir hücreye en fazla 2.000 soru yazılabilir. Doğru/yanlış/boş'tan yalnız birini doldurup paneli kapatırsan o giriş kaydedilmez — üçünü birden gir ya da üçünü de boş bırak.",
        },
        {
          kind: "tip",
          text: "Hücrenin altındaki ince mor çizgi, o hücreye doğru/yanlış/boş kırılımı girildiğini gösterir.",
        },
      ],
    },
    {
      id: "dogru-yanlis-bos",
      no: 7,
      chapter: "Günlük döngü",
      title: "Doğru, yanlış, boş: neden üçü birden?",
      lead: "Sadece toplam da geçerli. Ama D/Y/B girersen net ve doğruluk hesaplanır — ya üçü birden dolu ya üçü birden boş.",
      keywords: ["doğru", "yanlış", "boş", "kırılım", "doğruluk", "net"],
      blocks: [
        {
          kind: "para",
          text: "Soru sayın tek başına “ne kadar çalıştın” sorusunu cevaplar. Doğru/yanlış/boş kırılımı ise “ne kadarını bildin” sorusunu: sistem bundan net (doğru − yanlış ÷ bölen) ve doğruluk (doğru ÷ çözülen) hesaplar. Gelişim ekranındaki ders bazlı doğruluk tablosu yalnız kırılım girilen kayıtlardan beslenir.",
        },
        {
          kind: "table",
          head: ["Ne girdin", "Ne olur"],
          rows: [
            ["Sadece toplam", "Soru hacmine sayılır; net ve doğruluk hesaplanmaz."],
            ["Doğru + yanlış + boş (üçü de)", "Toplam otomatik D+Y+B olur; net ve doğruluk anında görünür."],
            ["Üçünden yalnız biri/ikisi", "Kayıt kabul edilmez — form seni uyarır."],
          ],
        },
        {
          kind: "tip",
          text: "Kırılım girdiğinde elle yazdığın toplam yok sayılır; toplam her zaman D+Y+B'den türetilir. Bu yüzden “toplam tutmuyor” diye uğraşma — üç sayıyı doğru gir, gerisi otomatik.",
        },
        {
          kind: "faq",
          items: [
            {
              q: "Boşları saymak zorunda mıyım?",
              a: "Kırılım gireceksen evet — boş sayısı olmadan toplam yanlış çıkar. Boş saymak istemiyorsan üç alanı da boş bırakıp sadece toplamı yaz.",
            },
            {
              q: "Doğruluk yüzdesine boşlar dahil mi?",
              a: "Hayır. Doğruluk = doğru ÷ (doğru + yanlış). Boş bıraktıkların paydaya girmez; bu, “işaretlediklerinin ne kadarını bildin” demektir.",
            },
          ],
        },
      ],
    },
    {
      id: "kronometre",
      no: 8,
      chapter: "Günlük döngü",
      title: "Kronometre ile çalışma süresi",
      lead: "Süre sekmesindeki kronometre çalışırken saati tutar; “Bitir” dediğinde süre bugüne kaydedilir. Koçun toplam süreni görür.",
      where: "/ogrenci/kronometre",
      keywords: ["kronometre", "süre", "sayaç", "çalışma", "dakika"],
      blocks: [
        {
          kind: "para",
          text: "Sayfanın üstünde bugünkü, haftalık ve toplam çalışma süren ile çalışma serin durur. Kronometre sekmesinde ders seçip sayacı başlatırsın; mola verirken duraklatır, oturum bitince “Bitir” ile kaydedersin.",
        },
        {
          kind: "steps",
          items: [
            "“Ders” listesinden çalıştığın dersi seç (karışık çalışıyorsan “Genel / karışık” kalsın).",
            "“Başla”ya bas ve çalışmaya koyul.",
            "Mola için “Duraklat”, dönünce “Devam”.",
            "Oturum bitince “Bitir” — süre dakikaya yuvarlanıp bugüne kaydedilir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Kronometre",
              where: "Sekme çubuğu, solda",
              does: "Canlı sayaç görünümünü açar.",
            },
            {
              label: "Manuel giriş",
              where: "Sekme çubuğu, sağda",
              does: "Süreyi elle yazdığın formu açar (bkz. bir sonraki bölüm).",
            },
            {
              label: "Başla",
              where: "Sayacın altında, solda",
              does: "Sayacı başlatır; duraklatılmışsa etiketi “Devam” olur.",
            },
            {
              label: "Duraklat",
              where: "Sayacın altında, solda (çalışırken)",
              does: "Sayacı durdurur; süre kaybolmaz.",
            },
            {
              label: "Sıfırla",
              where: "Sayacın altında, ortada",
              does: "Sayacı 0'a döndürür — kaydedilmemiş süre silinir.",
            },
            {
              label: "Bitir",
              where: "Sayacın altında, sağda",
              does: "Ölçülen süreyi bugüne kaydeder; 1 dakikadan kısaysa düğme pasiftir.",
            },
          ],
        },
        {
          kind: "warning",
          text: "En az 1 dakika çalışmadan “Bitir” çalışmaz. Ayrıca sayaç yalnız bu sayfada yaşar: kaydetmeden sekmeyi kapatır ya da sayfayı yenilersen süre kaybolur — uzun oturumlarda arada “Bitir” deyip yeni oturum açmak güvenlidir.",
        },
      ],
    },
    {
      id: "manuel-sure",
      no: 9,
      chapter: "Günlük döngü",
      title: "Manuel süre girişi, kanıt ve oturum kayıtları",
      lead: "Kronometreyi açmayı unuttuysan süreyi elle girersin; istersen kanıt olarak ekran görüntüsü eklersin.",
      where: "/ogrenci/kronometre",
      keywords: ["manuel", "süre", "kanıt", "görsel", "oturum", "sil"],
      blocks: [
        {
          kind: "para",
          text: "“Manuel giriş” sekmesi geçmişe dönük kayıt içindir: dersi, dakikayı ve günü yazarsın. Kanıt görseli (örn. dershane çıkış saati, çalışma uygulaması ekranı) eklemek isteğe bağlıdır. Günün tüm oturumları “Bugünkü oturumlar” kartında listelenir; yanlış kaydı oradan silersin.",
        },
        {
          kind: "steps",
          items: [
            "“Manuel giriş” sekmesine geç.",
            "Ders seç, “Süre (dakika)” alanına dakikayı yaz (örn. 90).",
            "“Gün” alanında bugünü ya da geçmiş bir günü seç — geleceğe süre yazılamaz.",
            "İstersen not yaz ve “Görsel seç” ile kanıt ekle.",
            "“Süreyi ekle”ye bas.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Görsel seç",
              where: "Formda, kanıt alanında",
              does: "Telefonundan kanıt görseli seçtirir (en fazla 5 MB).",
            },
            {
              label: "Süreyi ekle",
              where: "Formun altında",
              does: "Girdiğin süreyi seçtiğin güne kaydeder.",
            },
            {
              label: "Kanıt",
              where: "“Bugünkü oturumlar” listesinde, kaydın yanında",
              does: "Yüklediğin kanıt görselini yeni sekmede açar.",
            },
            {
              label: "Kaydı sil",
              where: "“Bugünkü oturumlar” listesinde, satırın sağındaki çöp simgesi",
              does: "O çalışma kaydını siler; toplamlardan düşer.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Kanıt görseli en fazla 5 MB olabilir; daha büyük dosyada yükleme reddedilir. Ekran görüntüsünü göndermeden önce kırpmak genelde yeter.",
        },
        {
          kind: "note",
          text: "Listede her kaydın yanında kaynağı yazar: “Kronometre” sayaçla tutulan, “Manuel” elle girilen süredir. Koçun ikisini de görür.",
        },
      ],
    },

    /* ------------------------------ Program ------------------------------ */
    {
      id: "program-nedir",
      no: 10,
      chapter: "Program",
      title: "Haftalık program nedir",
      lead: "Program sekmesi haftanın konu planıdır: koçun yayınladığı programı işaretlersin ya da kendi taslağını hazırlarsın.",
      where: "/ogrenci/program",
      keywords: ["program", "plan", "hafta", "motto", "koç notu"],
      blocks: [
        {
          kind: "para",
          text: "Bir haftanın programı üç durumda olabilir: koçunun kurduğu program (görevleri işaretlersin), senin kendi taslağın (düzenleyip koça gönderirsin) ya da henüz program yok. Koçun o haftaya ilk konuyu ekler eklemez program sana açılır; “Program henüz hazır değil” yazısı o hafta henüz boş demektir.",
        },
        {
          kind: "steps",
          items: [
            "Üstteki oklarla haftalar arasında gez; başlığın altında “Bu hafta / Geçmiş hafta / Gelecek hafta” yazar.",
            "Açılmış programda “Hafta · ders” ve “Gün” görünümleri arasında geçiş yap.",
            "Varsa haftanın mottosunu ve koç notunu en üstte oku — koçun sana o haftaki stratejiyi orada anlatır.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Önceki hafta",
              where: "Hafta başlığının solundaki ok",
              does: "Önceki haftanın programını açar.",
            },
            {
              label: "Sonraki hafta",
              where: "Hafta başlığının sağındaki ok",
              does: "Sonraki haftaya geçer — programda gelecek hafta açıktır (soru takibinin aksine).",
            },
            {
              label: "Hafta · ders",
              where: "Görünüm anahtarı, solda",
              does: "Programı ders sütunları hâlinde gösterir (mobilde ders başına açılır kart).",
            },
            {
              label: "Gün",
              where: "Görünüm anahtarı, sağda",
              does: "Programı gün gün kontrol listesi olarak gösterir; bugün en üstte durur.",
            },
          ],
        },
        {
          kind: "note",
          text: "Bir konu güne atanmamışsa “bu haftanın genel konusu”dur: haftanın herhangi bir gününde yapabilirsin, Gün görünümünde gün başlığı olmadan listelenir.",
        },
      ],
    },
    {
      id: "gorev-isaretleme",
      no: 11,
      chapter: "Program",
      title: "Görevleri işaretleme",
      lead: "Sana açılmış programda konuya dokunmak yeter: işaret anında kaydolur, tekrar dokununca geri alınır.",
      where: "/ogrenci/program",
      keywords: ["görev", "işaretle", "tamamla", "tik", "ilerleme"],
      blocks: [
        {
          kind: "para",
          text: "Burada da Kaydet düğmesi yoktur: bir göreve dokunduğun anda işaret sunucuya yazılır. Yanlışlıkla işaretlediysen tekrar dokun, geri alınır. Koçun tamamlanma oranını kendi ekranında görür.",
        },
        {
          kind: "steps",
          items: [
            "“Hafta · ders” görünümünde dersin kartını aç, bitirdiğin konuya dokun — yeşil tik düşer.",
            "“Gün” görünümünde bugünün listesinden görevlere dokunarak ilerle.",
            "Üstteki “Haftalık ilerleme” çubuğu (Gün görünümünde) yüzdeyi canlı gösterir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Görev satırı / konu hücresi",
              where: "Program listesinde her görev",
              does: "Dokununca tamamlandı işaretler; tekrar dokununca işareti kaldırır. Anında kaydolur.",
            },
            {
              label: "Haftanın tamamını gör",
              where: "Bugün ekranındaki görev listesinin altında",
              does: "Bugünün kısa listesinden bu program ekranına getirir.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Görevleri Bugün ekranından da işaretleyebilirsin — ikisi aynı kaydı günceller, hangisi elindeyse onu kullan.",
        },
      ],
    },
    {
      id: "kendi-programin",
      no: 12,
      chapter: "Program",
      title: "Kendi programını oluştur",
      lead: "Koçun o hafta için henüz konu eklemediyse kendi planını kurar, hazır olunca koçuna gönderirsin.",
      where: "/ogrenci/program",
      keywords: ["taslak", "kendi programın", "konu ekle", "koça gönder"],
      blocks: [
        {
          kind: "para",
          text: "Bu hafta ya da gelecek hafta için program yoksa ekranda “Kendi programını oluştur” kartı belirir. Konu eklemeye başladığın anda taslağın oluşur; “Bu senin taslağın” kutusu durumu gösterir. Taslağın, koçun onayına kadar yalnız plandır — koç düzenleyip onaylayınca işaretlenebilir programa dönüşür.",
        },
        {
          kind: "steps",
          items: [
            "Ders kolonunun altındaki “Konu” (mobilde “Konu ekle”) düğmesine bas.",
            "“Konu / açıklama” alanına ne yapacağını yaz (örn. “Üslü Sayılar — konu tekrarı + 30 soru”).",
            "İstersen gün, hedef soru ve kaynak seç; gün seçmezsen haftanın genel konusu olur.",
            "“Konu ekle” ile kaydet; tüm konular bitince “Koça gönder”e bas.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Konu",
              where: "Masaüstünde ders kolonunun altındaki kesikli düğme",
              does: "O derse yeni konu ekleme penceresini açar.",
            },
            {
              label: "Konu ekle",
              where: "Mobilde ders kartının altında; ayrıca pencerenin kaydet düğmesi",
              does: "Yeni konu penceresini açar / penceredeki konuyu taslağa ekler.",
            },
            {
              label: "Konuyu düzenle",
              where: "Konu hücresinde kalem simgesi",
              does: "Konunun açıklamasını, dersini, gününü, hedefini değiştirirsin; “Konuyu kaydet” ile biter.",
            },
            {
              label: "Konuyu sil",
              where: "Konu hücresinde çöp simgesi",
              does: "Konuyu taslaktan kaldırır (onay sormaz).",
            },
            {
              label: "Koça gönder",
              where: "Izgaranın altında, sağda",
              does: "Taslağını koçuna iletir; koç inceleyip onaylar. Sonradan değiştirirsen “Tekrar gönder” olur.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Geçmiş haftaya kendi programını yazamazsın — taslak yalnız bu hafta ve gelecek haftalar için açılır. Konu silmenin geri alması yoktur.",
        },
      ],
    },
    {
      id: "ai-oneri",
      no: 13,
      chapter: "Program",
      title: "AI ile konu öner ve koça gönder",
      lead: "Yapay zekâ verine bakıp haftalık konu taslağı önerir. Sen onaylamadan hiçbir şey yazılmaz.",
      where: "/ogrenci/program",
      keywords: ["AI", "yapay zeka", "öneri", "taslak", "otomatik program"],
      blocks: [
        {
          kind: "para",
          text: "Soru girişlerin, denemelerin ve eksik konuların üzerinden yapay zekâ sana bir haftalık konu listesi önerir. Öneriler tek tek seçilebilir: beğenmediklerinin işaretini kaldırırsın, kalanlar taslağına eklenir. Eklendikten sonra normal konular gibi düzenlenebilir.",
        },
        {
          kind: "steps",
          items: [
            "Program ekranında “AI ile konu öner” düğmesine bas (hiç taslak yoksa kartta “AI ile program oluştur” yazar).",
            "İstersen “Odak” alanına bu haftanın önceliğini yaz (örn. “matematik ve paragraf ağırlıklı”).",
            "“Taslak öner”e bas ve önerilerin gelmesini bekle.",
            "Eklemek istemediğin konuların kutusundaki işareti kaldır.",
            "Alttaki “… konuyu ekle” düğmesine bas; sonra taslağını düzenleyip “Koça gönder”.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "AI ile konu öner",
              where: "Taslağının üstünde, sağda",
              does: "Öneri penceresini açar (taslağın varken görünen etiket).",
            },
            {
              label: "AI ile program oluştur",
              where: "“Kendi programını oluştur” kartının içinde",
              does: "Aynı öneri penceresini açar (henüz taslak yokken görünen etiket).",
            },
            {
              label: "Taslak öner",
              where: "Pencerede, odak alanının altında",
              does: "Yapay zekâdan konu listesi ister; birkaç saniye sürer.",
            },
            {
              label: "Yeniden öner",
              where: "Öneri listesinin altında, solda",
              does: "Listeyi atıp baştan öneri ister; odak metnini de sıfırlar.",
            },
            {
              label: "… konuyu ekle",
              where: "Öneri listesinin altında, sağda (örn. “5 konuyu ekle”)",
              does: "Seçili önerileri taslağına yazar — bu ana kadar hiçbir şey kaydedilmemiştir.",
            },
          ],
        },
        {
          kind: "note",
          text: "Öneri sadece başlangıç noktasıdır: eklenen konuları silebilir, düzenleyebilir, kendi konularını ekleyebilirsin. Son söz koçundadır — taslağını o onaylar.",
        },
      ],
    },

    /* ----------------------------- Denemeler ----------------------------- */
    {
      id: "deneme-ekleme",
      no: 14,
      chapter: "Denemeler",
      title: "Deneme ekleme",
      lead: "Deneme bittiğinde ders ders doğru/yanlış/boş sayılarını girersin; net satır satır ve toplamda canlı hesaplanır.",
      where: "/ogrenci/denemeler/yeni",
      keywords: ["deneme", "yeni", "D/Y/B", "yayınevi", "branş", "tam"],
      blocks: [
        {
          kind: "para",
          text: "Denemeler sekmesindeki “Deneme ekle” düğmesi bu forma getirir. Üstte denemenin kimliği (bölüm, kapsam, tarih, yayınevi, ad), altta ders tablosu vardır. Yazarken her dersin neti ve alttaki toplam net anında güncellenir.",
        },
        {
          kind: "steps",
          items: [
            "“Bölüm” seç (örn. TYT/AYT gibi sınav bölümün) ve “Kapsam”ı belirle: “Tam deneme” ya da “Branş denemesi”.",
            "“Tarih”i seç — gelecek tarih seçilemez.",
            "“Yayınevi” ve “Deneme adı” alanlarını doldur; sonradan listede denemeyi bunlarla tanırsın.",
            "Tabloda her ders için D, Y ve B sütunlarını doldur; girmediğin dersler kaydedilmez.",
            "“Denemeyi kaydet”e bas — listeye dönersin.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Deneme ekle",
              where: "Denemeler listesinin üst sağında",
              does: "Bu yeni deneme formunu açar.",
            },
            {
              label: "Denemeler",
              where: "Formun üstünde, geri oku",
              does: "Kaydetmeden deneme listesine döner.",
            },
            {
              label: "D / Y / B hücreleri",
              where: "Ders tablosunda",
              does: "Dersin doğru/yanlış/boş sayısını alır; satır neti sağda canlı görünür.",
            },
            {
              label: "Denemeyi kaydet",
              where: "Tablonun altında, sağda",
              does: "Denemeyi kaydeder ve toplam neti bildirir; en az bir derse giriş yapmadan pasiftir.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Ders adının yanındaki “/40” gibi küçük sayı o dersin resmî soru sayısıdır — D+Y+B toplamını onunla karşılaştırarak giriş hatanı hemen yakalarsın.",
        },
      ],
    },
    {
      id: "net-hesabi",
      no: 15,
      chapter: "Denemeler",
      title: "Net nasıl hesaplanır",
      lead: "Net = doğru − yanlış ÷ bölen. Bölen LGS'de 3, YKS ve KPSS'de 4. Net, yazıldığı anda dondurulur.",
      keywords: ["net", "bölen", "hesap", "LGS", "YKS", "KPSS", "formül"],
      blocks: [
        {
          kind: "para",
          text: "Her yanlış, doğrularından pay götürür: LGS'de 3 yanlış 1 doğruyu, YKS ve KPSS'de 4 yanlış 1 doğruyu siler. Boşlar neti etkilemez. Sistem tüm net hesaplarında bu tek formülü kullanır — deneme formunda, soru takibindeki önizlemede ve grafiklerde.",
        },
        {
          kind: "table",
          title: "Örnek",
          head: ["Sınav", "Doğru", "Yanlış", "Hesap", "Net"],
          rows: [
            ["LGS (bölen 3)", "15", "3", "15 − 3 ÷ 3", "14,00"],
            ["YKS/KPSS (bölen 4)", "30", "8", "30 − 8 ÷ 4", "28,00"],
            ["YKS/KPSS (bölen 4)", "22", "5", "22 − 5 ÷ 4", "20,75"],
          ],
        },
        {
          kind: "note",
          text: "Net, kaydedildiği anda o günkü formülle hesaplanıp saklanır. İleride formül ya da bölen değişse bile geçmiş netlerin asla değişmez — grafiklerin her zaman o günün gerçeğini gösterir.",
        },
        {
          kind: "tip",
          text: "Bazı alt dersler (örn. geometri, mantık) ayrı girilir ama net hesabında ana derse (matematik) toplanır. Bu yüzden deneme tablosunda alt derslerin kendi net sütunu boş kalabilir — netleri ana derste birikir.",
        },
      ],
    },
    {
      id: "deneme-analizi",
      no: 16,
      chapter: "Denemeler",
      title: "Deneme analizi: hangi konudan kaçırdın",
      lead: "Deneme kaydetmek yetmez — hangi konudan kaç soru kaçırdığını da girersen eksik haritası oluşur.",
      where: "/ogrenci/denemeler",
      keywords: ["analiz", "eksik", "konu", "deneme analizi", "kaçırılan"],
      blocks: [
        {
          kind: "para",
          text: "Deneme listesinde her denemenin durumu görünür: analizi girilmişse yeşil “Analiz yapıldı” rozeti, girilmemişse “Analiz gir →” bağlantısı. Analiz ekranında dersler konu konu listelenir; her konuya o denemede kaçırdığın soru sayısını (yanlış + boş) yazarsın.",
        },
        {
          kind: "steps",
          items: [
            "Denemeler listesinde denemenin “Analiz gir →” bağlantısına (ya da net sayısına) dokun.",
            "Deneme kitapçığını aç, yanlış ve boşlarını konularına ayır.",
            "Her konunun kutusuna kaçırdığın soru sayısını yaz; hiç kaçırmadığın konulara dokunma.",
            "Alttaki “Analizi kaydet”e bas — deneme “Analiz yapıldı” olarak işaretlenir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Analiz gir →",
              where: "Deneme satırında, rozetlerin yanında",
              does: "O denemenin konu-eksik giriş ekranını açar.",
            },
            {
              label: "Net sayısı",
              where: "Deneme satırının sağında",
              does: "Aynı analiz ekranını açar — analiz yapılmış denemede girdiklerini gösterir.",
            },
            {
              label: "Konu kutusu",
              where: "Analiz ekranında her konunun sağında",
              does: "O konudan kaçırdığın soru sayısını alır; 0 yazmak satırı analizden siler.",
            },
            {
              label: "Analizi kaydet",
              where: "Alt barda, sağda",
              does: "Tüm eksikleri kaydeder ve seni Eksik konular ekranına götürür.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Eksik = yanlış + boş. Boş bıraktığın soru da o konuyu bilmediğinin işaretidir; ikisini birlikte say.",
        },
      ],
    },
    {
      id: "analiz-ekrani",
      no: 17,
      chapter: "Denemeler",
      title: "Eksik konular ekranı",
      lead: "Tüm deneme analizlerin tek yerde toplanır: en çok kaçırdığın konular ve deneme deneme ısı haritası.",
      where: "/ogrenci/analiz",
      keywords: ["eksik konular", "ısı haritası", "öncelik", "zayıf konu"],
      blocks: [
        {
          kind: "para",
          text: "Bu ekran alt barda yoktur; Gelişim ekranındaki karttan ya da analiz kaydettikten sonra otomatik açılır. Üç bölümü vardır: “Ders ders eksikler” her dersten en çok kaçırdığın 5 konuyu ayrı ayrı gösterir (üstteki çiplerden tek derse de odaklanabilirsin) — böylece güçlü olduğun dersteki zayıf konu, baskın dersin altında kaybolmaz. “Toplam eksik sıralaması” ders ayırmadan tek sıralama verir; çalışma önceliğin budur. “Konu ısı haritası” ise eksikleri deneme deneme gösterir: koyulaşan hücre, aynı konudan tekrar tekrar kaçırdığın anlamına gelir.",
        },
        {
          kind: "steps",
          title: "Nasıl okunur",
          items: [
            "Sıralamanın tepesindeki 2-3 konuyu haftalık programına al.",
            "Isı haritasında satırı sürekli koyu olan konu “tesadüf değil, gerçek eksik” demektir.",
            "Son denemelerde açılan (rengi solan) konular kapanıyor demektir — emeğin işe yarıyor.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Kaynak takibi",
              where: "Sayfanın altındaki kart",
              does: "Kaynaklar ekranına götürür — eksik konularını hangi kaynaktan kapattığını orada işaretlersin.",
            },
          ],
        },
        {
          kind: "note",
          text: "Buradaki veri yalnız senin girdiğin deneme analizlerinden gelir. Analiz girmediğin deneme bu ekranı beslemez — bu yüzden her denemenin analizini girmek önemli.",
        },
      ],
    },
    {
      id: "gelisim",
      no: 18,
      chapter: "Denemeler",
      title: "Gelişim ekranı",
      lead: "Netlerin, soru hacmin, çalışma süren ve otomatik içgörülerin bir arada — büyük resme buradan bakarsın.",
      where: "/ogrenci/gelisim",
      keywords: ["gelişim", "grafik", "net grafiği", "doğruluk", "içgörü"],
      blocks: [
        {
          kind: "para",
          text: "Üstteki kutular özetini verir: son tam deneme netin, toplam deneme sayın, bu haftaki ve tüm zamanlardaki soru sayın, kırılım girdiğin kayıtlardan hesaplanan doğruluk yüzden. Altında dört grafik/tablo sıralanır: net gelişimi, haftalık soru hacmi (son 8 hafta), çalışma süresi ve ders ders soru-doğruluk tablosu. En altta sistemin verinden çıkardığı içgörüler yazar.",
        },
        {
          kind: "steps",
          title: "Haftalık kontrol",
          items: [
            "Haftada bir kez net grafiğine bak: eğilim yukarıysa yol doğru.",
            "Soru hacmi grafiğinde bu haftayı önceki haftalarla karşılaştır.",
            "Ders tablosunda doğruluğu düşük dersleri not et; programında onlara yer aç.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Eksik konular ve kaynak takibi",
              where: "Kutuların altındaki kart",
              does: "Eksik konular ekranını açar (sıralama + ısı haritası).",
            },
          ],
        },
        {
          kind: "tip",
          text: "Net grafiği yalnız tam denemelerden çizilir; branş denemeleri listende durur ama bu grafiğe girmez. Doğruluk yüzdesi de yalnız D/Y/B girdiğin kayıtlardan hesaplanır — kırılım girmeye değmesinin bir sebebi daha.",
        },
      ],
    },

    /* ----------------------------- Kaynaklar ----------------------------- */
    {
      id: "kaynak-yonetimi",
      no: 19,
      chapter: "Kaynaklar",
      title: "Kaynak ekleme, düzenleme, arşivleme",
      lead: "Çalıştığın kitap ve soru bankalarını sisteme eklersin; soru sayıları ve konu takibi bu kaynaklar üstünden yürür.",
      where: "/ogrenci/kaynaklar",
      keywords: ["kaynak", "kitap", "soru bankası", "arşiv", "ekle"],
      blocks: [
        {
          kind: "para",
          text: "Kaynak; kitap, fasikül ya da soru bankasıdır. Bir kaynağı ekleyince hem “bugün bu kaynaktan kaç soru çözdüm” sayacı hem de konu × kaynak takibi açılır. Kaynağı bitirince silmek yerine arşivlersin — geçmiş kayıtların korunur.",
        },
        {
          kind: "steps",
          items: [
            "“Kaynak ekle” düğmesine bas.",
            "“Kaynak adı” yaz (örn. “3D Türkçe Soru Bankası”); istersen yazar/hoca, ders, not ve bağlantı ekle.",
            "Ders seçersen kaynak konu takibinde yalnız o derste görünür; “Genel (tüm dersler)” bırakırsan her derste.",
            "“Kaynağı ekle” ile kaydet.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Kaynak ekle",
              where: "Kaynak listesinin üst sağında",
              does: "Yeni kaynak penceresini açar.",
            },
            {
              label: "Kaynağı ekle",
              where: "Pencerenin altında",
              does: "Formdaki kaynağı listene kaydeder.",
            },
            {
              label: "Kaynağı düzenle",
              where: "Kaynak satırında kalem simgesi",
              does: "Ad, yazar, ders, not ve bağlantıyı değiştirirsin; “Kaydet” ile biter.",
            },
            {
              label: "Kaynağı arşivle",
              where: "Kaynak satırında kutu simgesi",
              does: "Kaynağı pasife alır: “Arşiv” rozeti alır, günlük soru listesinden çıkar ama geçmişi silinmez.",
            },
            {
              label: "Kaynağı geri al",
              where: "Arşivli kaynak satırında",
              does: "Arşivden çıkarır, kaynak yeniden aktif olur.",
            },
            {
              label: "Bağlantıyı aç",
              where: "Kaynak satırında ok simgesi (bağlantı girildiyse)",
              does: "Kaynağın linkini (örn. video oynatma listesi) yeni sekmede açar.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Kaynağı bitirdiğinde arşivle — liste sade kalır, istatistikler bozulmaz. Koçun da kaynak listeni kendi ekranından görür ve düzenleyebilir.",
        },
      ],
    },
    {
      id: "kaynak-soru",
      no: 20,
      chapter: "Kaynaklar",
      title: "Kaynak başına günlük soru",
      lead: "“Bugün kaynak başına soru” kartında her kaynaktan bugün kaç soru çözdüğünü yazarsın — kutudan çıkınca kaydolur.",
      where: "/ogrenci/kaynaklar",
      keywords: ["kaynak soru", "günlük", "sayaç", "kaynak takibi"],
      blocks: [
        {
          kind: "para",
          text: "Bu kart “hangi kaynaktan ne kadar çözüyorsun” sorusunu cevaplar. Her kaynağın satırında bugünkü sayıyı yazarsın; satırın altında o kaynaktan tüm zamanlarda çözdüğün toplam görünür. Koçun kaynak kaynak ilerlemeni izler.",
        },
        {
          kind: "steps",
          items: [
            "Kaynağın satırındaki kutuya bugün o kaynaktan çözdüğün toplam soru sayısını yaz.",
            "Kutudan çık (başka yere dokun) — sayı o anda kaydedilir, Kaydet düğmesi yoktur.",
            "Gün içinde tekrar çözersen yeni toplamı yaz; eski değerin üzerine yazılır.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Sayı kutusu",
              where: "Her kaynak satırının sağında",
              does: "Bugünkü soru sayısını alır; kutudan çıkınca otomatik kaydeder (üst sınır 5.000).",
            },
          ],
        },
        {
          kind: "warning",
          text: "Bu sayaç, Sorular sekmesindeki ders bazlı soru takibinden ayrıdır ve ona otomatik yazılmaz. Günlük ders toplamını yine soru takibine (ya da Bugün ekranına) girmeyi unutma.",
        },
      ],
    },
    {
      id: "konu-kaynak-matrisi",
      no: 21,
      chapter: "Kaynaklar",
      title: "Konu × kaynak takibi",
      lead: "Hangi konuyu hangi kaynakta bitirdiğini işaretlersin: ders seç, hücreye dokun, “Bitti”.",
      where: "/ogrenci/kaynaklar",
      keywords: ["konu takibi", "matris", "bitti", "konu kaynak"],
      blocks: [
        {
          kind: "para",
          text: "Tablo satırlarda konuları, sütunlarda kaynaklarını gösterir. Bir konuyu bir kaynaktan bitirince kesişim hücresine dokunursun — yeşil tik düşer ve anında kaydolur. Satır sonundaki sayaç konunun kaç kaynakta bittiğini söyler.",
        },
        {
          kind: "steps",
          items: [
            "“Ders seç” listesinden dersi seç — konu listesi ona göre değişir.",
            "Bitirdiğin konu ile kaynağın kesiştiği hücreye dokun.",
            "Yanlış işaretlediysen tekrar dokun; işaret kalkar.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Ders seç",
              where: "Tablonun üstünde, solda",
              does: "Tabloyu seçtiğin dersin konularına ve o derse uygun kaynaklara filtreler.",
            },
            {
              label: "Hücre (tik)",
              where: "Konu satırı × kaynak sütunu kesişimi",
              does: "“Bitti” işaretini koyar/kaldırır; anında kaydedilir, Kaydet düğmesi yoktur.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Bir derste hiç kaynak görünmüyorsa o derse (ya da “Genel”e) kaynak eklememişsin demektir — önce yukarıdan “Kaynak ekle”.",
        },
      ],
    },

    /* ------------------------------ Koçunla ------------------------------ */
    {
      id: "gorusmeler",
      no: 22,
      chapter: "Koçunla",
      title: "Görüşme planlama",
      lead: "Koçunun takviminden uygun saati seçer, planladığını onaylarsın. Yaklaşan ve geçmiş görüşmelerin de burada listelenir.",
      where: "/ogrenci/gorusmeler",
      keywords: ["görüşme", "randevu", "takvim", "planla", "katıl"],
      blocks: [
        {
          kind: "para",
          text: "“Görüşme saatini seç” kartında koçunun takvimi gömülü açılır: gün ve saat seçip randevunu alırsın. Saat işini bitirdikten sonra alttaki onay düğmesine basarsın ki sistem planladığını bilsin ve Bugün ekranındaki uyarı kapansın. “Görüşmelerim” kartı yaklaşan ve geçmiş görüşmelerini durum rozetleriyle listeler.",
        },
        {
          kind: "steps",
          items: [
            "Takvimden uygun bir gün ve saat seç, randevuyu tamamla.",
            "Kartın altındaki “Görüşmemi planladım” düğmesine bas.",
            "Görüşme saatinde “Görüşmelerim” listesindeki “Katıl” düğmesiyle bağlan.",
            "Saatin değişmesi gerekirse aynı takvimden yeniden planla.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Görüşmemi planladım",
              where: "Takvim kartının altında",
              does: "Planladığını sisteme bildirir; kart “Planlandı ✓” durumuna geçer.",
            },
            {
              label: "Katıl",
              where: "“Görüşmelerim” listesinde, planlı görüşmenin sağında",
              does: "Görüşmenin video bağlantısını yeni sekmede açar.",
            },
            {
              label: "Takvim açılmıyorsa buradan planla →",
              where: "Gömülü takvimin altında",
              does: "Aynı takvimi yeni sekmede açar — gömülü görünüm yüklenmezse kurtarıcın.",
            },
            {
              label: "Görüşme takvimini aç",
              where: "Takvim gömülü açılamayan durumda kartın içinde",
              does: "Koçunun randevu sayfasını yeni sekmede açar.",
            },
          ],
        },
        {
          kind: "table",
          title: "Görüşme durum rozetleri",
          head: ["Rozet", "Anlamı"],
          rows: [
            ["Planlandı", "Görüşme ileri bir tarihte, saati belli."],
            ["Yapıldı", "Görüşme gerçekleşti."],
            ["Gelmedi", "Planlanan saatte katılım olmadı."],
            ["İptal", "Görüşme iptal edildi."],
          ],
        },
        {
          kind: "note",
          text: "Kartta “Koçun görüşme takvimini yakında paylaşacak” yazıyorsa koçun henüz takvim bağlamamıştır — o hazır olduğunda buradan randevu alabileceksin.",
        },
      ],
    },
    {
      id: "icerik",
      no: 23,
      chapter: "Koçunla",
      title: "Koçunun paylaştığı içerikler",
      lead: "Video, PDF ve notlar burada birikir. İzlediklerini işaretlersin; koçun kimin neyi izlediğini görür.",
      where: "/ogrenci/icerik",
      keywords: ["içerik", "video", "PDF", "not", "izledim"],
      blocks: [
        {
          kind: "para",
          text: "Bu ekrana Bugün'deki “İçerik” kartından girersin. Başlığın altında kaç içerik olduğu ve kaçını izlediğin yazar. Videolarda kapak görseline dokununca video yeni sekmede açılır; notların metni doğrudan kartta durur. “Sana özel” rozetli içerikler koçunun özellikle sana atadıklarıdır — önceliğin onlar olsun.",
        },
        {
          kind: "steps",
          items: [
            "Karttaki kapak görseline ya da “İçeriği aç” bağlantısına dokunarak içeriği aç.",
            "İzleyip bitirince “İzledim işaretle” düğmesine bas.",
            "Yanlışlıkla işaretlediysen “İzlendi” düğmesine tekrar bas, işaret kalkar.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "İçeriği aç",
              where: "Kartın alt solunda (video harici bağlantılı içerikte)",
              does: "İçeriğin bağlantısını (PDF, sayfa vb.) yeni sekmede açar.",
            },
            {
              label: "İzledim işaretle",
              where: "Kartın alt sağında",
              does: "İçeriği izlendi olarak işaretler; anında kaydolur.",
            },
            {
              label: "İzlendi",
              where: "İşaretlenmiş içeriğin alt sağında",
              does: "Dokununca işareti geri alır.",
            },
          ],
        },
        {
          kind: "tip",
          text: "İşaretleme senin için de faydalı: listenin başındaki “izlendi” sayacı, birikmiş içerik olup olmadığını tek bakışta gösterir.",
        },
      ],
    },
    {
      id: "asistan",
      no: 24,
      chapter: "Koçunla",
      title: "Asistan",
      lead: "Gelişimin hakkında soru sorabildiğin yapay zekâ sohbeti. Cevaplar yalnız senin verine dayanır.",
      where: "/ogrenci/asistan",
      keywords: ["asistan", "sohbet", "yapay zeka", "soru sor"],
      blocks: [
        {
          kind: "para",
          text: "Asistan; soru girişlerini, denemelerini, çalışma sürelerini ve eksik konularını bilir. “Matematik netim nasıl gidiyor?”, “Bu hafta neye ağırlık vermeliyim?” gibi sorulara verinden cevap verir. Sağ alttaki yüzen düğmeyle her ekrandan, tam ekran hâliyle de /ogrenci/asistan adresinden açılır.",
        },
        {
          kind: "steps",
          items: [
            "Sağ alttaki “Asistan” düğmesine (ya da Bugün'deki “Asistana sor” kartına) dokun.",
            "Hazır öneri sorularından birine dokun ya da alttaki kutuya kendi sorunu yaz.",
            "Gönder düğmesine bas (klavyede Enter da gönderir); cevap birkaç saniyede gelir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Asistan",
              where: "Sağ alt köşe, yüzen mor düğme",
              does: "Sohbet panelini açar; sayfadan ayrılmadan konuşursun.",
            },
            {
              label: "Öneri çipleri",
              where: "Boş sohbetin ortasında",
              does: "Hazır soruyu tek dokunuşla gönderir (örn. “En zayıf konularım neler?”).",
            },
            {
              label: "Gönder",
              where: "Yazı kutusunun sağındaki ok",
              does: "Yazdığın soruyu asistana iletir.",
            },
            {
              label: "Kapat",
              where: "Yüzen panelin üst sağında",
              does: "Paneli gizler; sohbetin kaybolmaz, tekrar açınca kaldığın yerdesin.",
            },
          ],
        },
        {
          kind: "note",
          text: "Asistan koçunun yerini tutmaz: veri sorularında hızlıdır ama strateji, moral ve önemli kararlar için koçunla konuş. Asistan yalnız senin verini görür, başka öğrencilerinkini göremez.",
        },
      ],
    },

    /* ------------------------------- Hesap ------------------------------- */
    {
      id: "odemeler",
      no: 25,
      chapter: "Hesap",
      title: "Ödemeler ve ödeme bildirimi",
      lead: "Bakiyeni ve faturalarını görürsün; gönderdiğin ödemeyi “Ödeme bildir” ile haber verirsin. Onayı koçun verir.",
      where: "/ogrenci/odemeler",
      keywords: ["ödeme", "fatura", "bakiye", "bildir", "havale", "dekont"],
      blocks: [
        {
          kind: "para",
          text: "Bu ekrana Profil'deki “Ödemelerime git” düğmesinden girersin. Üstte kalan bakiyen ve bugüne kadar ödediğin toplam durur; altında ücret planın, faturaların, bekleyen bildirimlerin ve ödeme geçmişin listelenir.",
        },
        {
          kind: "steps",
          title: "Ödeme bildirme",
          items: [
            "Havale/EFT'yi bankadan gönder — uygulama para transferi yapmaz.",
            "“Ödeme bildir”e bas (belirli bir fatura içinse satırındaki “Bildir” düğmesi tutarı otomatik doldurur).",
            "Tutarı, gönderim tarihini ve yöntemi (Havale / EFT, Nakit, Kart, Diğer) gir; istersen dekont numarasını nota yaz.",
            "“Bildirimi gönder”e bas — bildirim “Onay bekliyor” durumuna düşer.",
            "Koçun dekontu kontrol edip onaylayınca tutar bakiyenden düşer ve ödeme geçmişine geçer.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Ödeme bildir",
              where: "Sayfanın üst sağında",
              does: "Bildirim formunu açar; fatura seçersen tutar kalan bakiyeyle dolar.",
            },
            {
              label: "Bildir",
              where: "Açık fatura satırının sağında",
              does: "Aynı formu o fatura seçili ve tutar dolu hâlde açar.",
            },
            {
              label: "Bildirimi gönder",
              where: "Formun altında",
              does: "Bildirimi koçunun onayına yollar.",
            },
          ],
        },
        {
          kind: "warning",
          text: "“Ödeme bildir” gerçek bir ödeme kaydı değildir — parayı sen bankadan gönderirsin, bildirim sadece haber verir. Koçun onaylayana kadar bakiyen değişmez; bildirimin “Onay bekliyor” rozetiyle bekler.",
        },
        {
          kind: "table",
          title: "Bildirim durumları",
          head: ["Rozet", "Anlamı"],
          rows: [
            ["Onay bekliyor", "Koçun henüz incelemedi; bakiyen değişmedi."],
            ["Onaylandı", "Ödemen işlendi, bakiyenden düştü."],
            ["Reddedildi", "Bildirim işlenmedi — koçunla konuş, gerekirse doğru bilgiyle yeniden bildir."],
          ],
        },
      ],
    },
    {
      id: "profil-ve-hesap",
      no: 26,
      chapter: "Hesap",
      title: "Profil, tema ve çıkış",
      lead: "İletişim ve okul bilgilerini profilden güncellersin; tema ve çıkış üst bardadır.",
      where: "/ogrenci/profil",
      keywords: ["profil", "tema", "çıkış", "telefon", "veli", "hedef"],
      blocks: [
        {
          kind: "para",
          text: "Profil sayfası üst bardaki kişi simgesinden açılır. Ad-soyad, telefon, veli telefonu, e-posta, hedef, sınıf, okul gibi bilgilerini burada güncellersin — koçun bu bilgileri görür, o yüzden güncel tut. Sayfanın altında Ödemeler ekranına kısayol vardır.",
        },
        {
          kind: "steps",
          items: [
            "Üst bardaki kişi simgesine dokun.",
            "Değişen bilgini düzelt (örn. yeni veli telefonu).",
            "“Kaydet”e bas — “Profil güncellendi” bildirimini gör.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Kaydet",
              where: "Profil formunun altında",
              does: "Bilgilerindeki değişiklikleri kaydeder.",
            },
            {
              label: "Ödemelerime git",
              where: "“Ödemelerim” kartının içinde",
              does: "Ödemeler ekranını açar.",
            },
            {
              label: "Temayı değiştir",
              where: "Üst barda, güneş/ay simgesi",
              does: "Açık ve koyu tema arasında geçiş yapar.",
            },
            {
              label: "Çıkış yap",
              where: "Üst barda, en sağdaki simge",
              does: "Oturumu kapatır; tekrar girmek için telefon + PIN gerekir.",
            },
          ],
        },
        {
          kind: "note",
          text: "Profildeki telefon alanı iletişim numarandır — burayı değiştirmek giriş numaranı değiştirmez. Giriş numaran ya da PIN'inle ilgili bir değişiklik gerekiyorsa koçuna yaz.",
        },
      ],
    },

    /* --------------------------------- Ek --------------------------------- */
    {
      id: "sorun-giderme",
      no: 0,
      chapter: "Ek",
      title: "Bir şey ters gittiğinde",
      lead: "En sık karşılaşılan durumlar ve çözümleri. Burada yoksa koçuna WhatsApp'tan yaz.",
      keywords: [
        "sorun",
        "hata",
        "kaydolmadı",
        "PIN unuttum",
        "görünmüyor",
        "yardım",
      ],
      blocks: [
        {
          kind: "para",
          text: "Çoğu “kayboldu” vakası aslında yanlış haftaya ya da yanlış ekrana bakmaktan olur. Aşağıdaki liste sık soruları toplar.",
        },
        {
          kind: "faq",
          items: [
            {
              q: "Soru girdim ama kaybolmuş.",
              a: "Soru girişi artık kendiliğinden kaydedilir; alt barda “Kaydedildi” yazısını gördüysen veri sunucudadır. Kırmızı “Kaydedilemedi” uyarısı çıktıysa bağlantın kopmuş demektir — “Tekrar dene”ye bas. Bir de doğru haftaya baktığını kontrol et; hafta Pazartesi başlar.",
            },
            {
              q: "Hücre kaydetmiyor / “Tamam” basılamıyor.",
              a: "Doğru/yanlış/boş üçlüsünden yalnız birini ya da ikisini doldurmuşsundur. Ya üçünü birden doldur ya üçünü de silip sadece toplamı yaz. Bir hücrenin üst sınırı 2.000'dir.",
            },
            {
              q: "Soru takibinde ileri ok neden basılmıyor?",
              a: "Gelecek haftaya soru girilemez; ileri ok bu haftadayken bilerek kapalıdır. Programda ise gelecek hafta açıktır — plan ileriye yazılır, çözülen soru yazılmaz.",
            },
            {
              q: "Program ekranı boş, “Program henüz hazır değil” diyor.",
              a: "Koçun o haftaya henüz konu eklememiş — hafta boş olduğu sürece burada bir şey görünmez. İstersen beklerken kendi taslağını oluşturup koçuna gönderebilirsin (bu hafta ya da gelecek hafta için).",
            },
            {
              q: "PIN'imi unuttum.",
              a: "Uygulamadan sıfırlama yok; koçuna WhatsApp'tan yaz, PIN'ini sıfırlasın. Sonra /katil'den yeni PIN belirlersin.",
            },
            {
              q: "Kronometrede “Bitir” basılmıyor.",
              a: "En az 1 dakika çalışmış olman gerekir; 60 saniyeden önce düğme pasiftir.",
            },
            {
              q: "Kanıt görselim yüklenmiyor.",
              a: "Görsel 5 MB'tan büyük olabilir — ekran görüntüsünü kırp ya da daha düşük çözünürlükte kaydet ve tekrar dene.",
            },
            {
              q: "Ödeme bildirdim ama bakiyem değişmedi.",
              a: "Normal: bildirim koçun onayına düşer ve “Onay bekliyor” rozetiyle bekler. Onaylanınca bakiyen güncellenir. Uzun sürdüyse koçuna hatırlat.",
            },
            {
              q: "Yanlış güne soru/süre girdim.",
              a: "Soru için: Sorular sekmesinde ilgili haftaya git, yanlış hücreyi açıp “Temizle” de, sonra doğru hücreyi doldur — ikisi de kapanınca kaydedilir. Süre için: yanlış kaydı “Bugünkü oturumlar”dan sil, manuel girişte doğru günü seçerek yeniden ekle.",
            },
            {
              q: "Denemeyi yanlış girdim, nasıl düzeltirim?",
              a: "Deneme sonuçlarını öğrenci ekranından düzenleme yok — koçuna söyle, kendi ekranından düzeltsin ya da silsin.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Bir ekran tuhaf görünüyorsa önce sayfayı yenile; sorun sürerse çıkıp tekrar gir. Hâlâ düzelmediyse ekran görüntüsüyle koçuna yaz.",
        },
      ],
    },
    {
      id: "sozluk",
      no: 0,
      chapter: "Ek",
      title: "Sözlük",
      lead: "Uygulamada ve koçunla konuşurken geçen terimlerin kısa sözlüğü.",
      keywords: ["sözlük", "terim", "net", "seri", "branş", "eksik", "dönem"],
      blocks: [
        {
          kind: "table",
          head: ["Terim", "Anlamı"],
          rows: [
            [
              "Net",
              "Doğru − yanlış ÷ bölen. Sınav puanının ham karşılığı; yazıldığı anda dondurulur.",
            ],
            [
              "Bölen",
              "Kaç yanlışın 1 doğruyu götürdüğü: LGS'de 3, YKS ve KPSS'de 4.",
            ],
            [
              "D/Y/B",
              "Doğru / Yanlış / Boş. Soru girişinde ya üçü birden dolu ya üçü birden boş olur.",
            ],
            [
              "Kırılım",
              "Toplam yerine D/Y/B ayrıntısıyla yapılan giriş; net ve doğruluk hesabını açar.",
            ],
            [
              "Doğruluk",
              "Doğru ÷ (doğru + yanlış). Boşlar hesaba girmez — işaretlediklerinin ne kadarını bildin.",
            ],
            [
              "Seri",
              "Arka arkaya kayıt girdiğin gün sayısı. Bir gün boş geçince sıfırlanır.",
            ],
            [
              "Tam deneme",
              "Bir bölümün tüm derslerini kapsayan deneme; net grafiği yalnız bunlardan çizilir.",
            ],
            [
              "Branş denemesi",
              "Tek derslik deneme; listende görünür ama net grafiğine girmez.",
            ],
            [
              "Eksik",
              "Bir denemede bir konudan kaçırdığın soru sayısı (yanlış + boş).",
            ],
            [
              "Isı haritası",
              "Eksiklerin deneme deneme tablosu; koyulaşan hücre tekrarlayan eksik demektir.",
            ],
            [
              "Kaynak",
              "Çalıştığın kitap, fasikül ya da soru bankası; soru sayacı ve konu takibi ona bağlanır.",
            ],
            [
              "Konu × kaynak",
              "Hangi konuyu hangi kaynakta bitirdiğini gösteren işaretleme tablosu.",
            ],
            [
              "Taslak",
              "Henüz onaylanmamış haftalık program; senin kurduğun plandır, koça gönderilir.",
            ],
            [
              "Yayınlanmış program",
              "Koçun onaylayıp açtığı program; görevlerini işaretleyebildiğin hâli.",
            ],
            [
              "Hedef soru",
              "Bir program konusuna iliştirilen çözülecek soru sayısı (örn. “30 soru”).",
            ],
            [
              "Motto",
              "Koçunun haftaya iliştirdiği kısa slogan; program ekranının en üstünde durur.",
            ],
            [
              "Kanıt",
              "Manuel süre girişine eklediğin ekran görüntüsü (en fazla 5 MB).",
            ],
            [
              "Ödeme bildirimi",
              "Gönderdiğin ödemenin haberi; koç onaylayana kadar bakiyeni değiştirmez.",
            ],
            [
              "Fatura / bakiye",
              "Fatura dönem borcunu, bakiye ödenmemiş kalanı gösterir.",
            ],
            [
              "Dönem",
              "Sınırlı kontenjanla açılan koçluk kayıt dönemi; yeni öğrenciler dönem açıkken katılır.",
            ],
            [
              "Kadro",
              "Derecenin Ruhu koç ekibi; her öğrenci kadrodan bir koça bağlıdır.",
            ],
          ],
        },
        {
          kind: "note",
          text: "Karşılaştığın terim burada yoksa asistana sorabilir ya da koçuna yazabilirsin.",
        },
      ],
    },
  ],
};

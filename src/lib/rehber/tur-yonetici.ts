import type { Tour } from "@/lib/rehber/tur-types";

/**
 * Yönetici ürün turu — yalnız yöneticiye açık ekranları gezinme sırasıyla
 * tanıtır. Buton etiketleri uygulamadaki dizelerle birebirdir; her adımın
 * `section` alanı yönetici rehberindeki ilgili bölüme bağlanır.
 */
export const yoneticiTuru: Tour = {
  id: "yonetici",
  title: "Yönetici turu",
  subtitle:
    "Yalnız sana açık ekranların uçtan uca turu: ekip, kadro, para ve site. Buradaki işlemlerin bir kısmı geri alınmaz — nerede dikkat gerektiğini adım adım gösterir.",
  guideBase: "/koc/rehber/yonetici",
  steps: [
    /* ————————————————— 1. Hoş geldin ————————————————— */
    {
      id: "hosgeldin",
      nav: "Tur",
      title: "Yönetici olarak elinde ne var",
      purpose:
        "Koçun yapabildiği her şeyi yaparsın; üstüne tüm kadroyu görür ve işletmeyi yöneten ekranlara erişirsin. Bu tur yalnız sana açık olan o ekranları baştan sona gezdirir.",
      highlights: [
        {
          label: "Görüş alanı",
          text: "Koç yalnız kendisine atanan öğrencileri görür; sen tüm kadroyu görür ve her öğrencinin kokpitine girebilirsin.",
        },
        {
          label: "Beş ek sayfa",
          text: "/koc/yonetim (ekip), /koc/ice-aktar (kadro CSV), /koc/muhasebe/mutabakat (banka ekstresi), /koc/basvurular (koç başvuruları) ve /koc/site (dönem ve site içeriği) yalnız yöneticiye açılır — koç girse bile geri yönlendirilir.",
        },
        {
          label: "Sayfa içi ek bloklar",
          text: "Öğrenciler sayfasındaki Koç sütunu, yinelenen kayıtlar paneli ve gizlenen öğrenciler bölümü ile Muhasebe'deki otomatik fatura düğmesi de yalnız sana görünür.",
        },
        {
          label: "Hesap sahibi",
          text: "İşletmenin sahibi olan tek hesap ayrıca korunur: rolünü yalnız kendisi değiştirebilir — başka bir yönetici bile değiştiremez.",
        },
        {
          label: "Turun tonu",
          text: "Bu ekranlardaki bazı işlemler (özellikle kayıt birleştirme) geri alınamaz. Tur boyunca nerede yavaşlaman gerektiği açıkça işaretli.",
        },
      ],
      tip: "Günlük koçluk akışı (program, görüşme, deneme) bu turda yok — o işler koç rehberinde anlatılır. Bu tur yalnız yönetici işlerine odaklanır.",
      section: "yonetici-farki",
    },

    /* ————————————————— 2. Ekip ————————————————— */
    {
      id: "yonetim",
      nav: "Yönetim",
      title: "Ekip: koç ve yönetici hesapları",
      route: "/koc/yonetim",
      purpose:
        "Ekibin tek ekranı: herkesin rolü, öğrenci sayısı ve katılım tarihi tabloda; yeni hesaplar alttaki iki karttan açılır.",
      highlights: [
        {
          label: "Ekip tablosu",
          text: "Ad, e-posta, rol rozeti (Yönetici / Koç), aktif öğrenci sayısı ve katılım tarihi tek bakışta. Kendi satırında “(sen)” yazar.",
        },
        {
          label: "Koç ekle kartı",
          text: "Ad Soyad, E-posta ve Geçici şifre zorunlu; telefon, Telegram, Instagram ve IBAN isteğe bağlı. Hesap anında açılır, koç bu e-posta ile giriş yapar.",
        },
        {
          label: "Rol değiştirme",
          text: "Tablonun son sütunundaki açılır seçim hesabı Koç ↔ Yönetici arasında anında çevirir; onay adımı yoktur.",
        },
        {
          label: "İki kilit",
          text: "“Son yönetici — rol kilitli”: sistemde her zaman en az bir yönetici kalmalıdır. “Hesap sahibi — yalnız kendisi değiştirebilir”: sahibin rolüne sen bile dokunamazsın. İkisi de sunucu tarafında ayrıca korunur.",
        },
      ],
      buttons: [
        {
          label: "Koç ekle",
          does: "Koç hesabını oluşturur; koç yalnız kendisine atanan öğrencileri görür.",
        },
        {
          label: "Yönetici ekle",
          does: "Yönetici hesabını oluşturur — tüm öğrencileri, muhasebeyi, siteyi ve ekibi yönetir.",
        },
        {
          label: "Rol değiştir",
          does: "Satırdaki açılır seçim; hesabı Koç ↔ Yönetici arasında çevirir. Kilitliyse nedeni seçimin altında yazar.",
        },
        {
          label: "Öğrenci atamaları",
          does: "Kadro listesine götürür — öğrenci → koç ataması bir sonraki adımda.",
        },
      ],
      tip: "Yönetici rolü her şeyi görür: tüm öğrenciler, para, site. Yalnız gerçekten gerekenlere ver; geçici şifreyi de mutlaka güvenli bir kanaldan ilet.",
      section: "ekip-yonetimi",
    },

    /* ————————————————— 3. Atama ————————————————— */
    {
      id: "atama",
      nav: "Öğrenciler",
      title: "Öğrenciyi koça atama",
      route: "/koc/ogrenciler",
      purpose:
        "Kadro tablosundaki Koç sütunu yalnız sana görünür; tekil atama satırdan, toplu atama seçim şeridinden yapılır.",
      highlights: [
        {
          label: "Koç sütunu",
          text: "Her satırda açılır seçim: öğrenciyi bir koça bağlar, “Atanmadı” seçilirse atama kalkar. Atama değişince geçmiş veri taşınmaz — veri öğrencinin kaydında durur.",
        },
        {
          label: "“Koça göre” filtresi",
          text: "Filtre çipleri listeyi koça göre daraltır; “Atanmamış” çipi koçu olmayan öğrencileri sayısıyla gösterir.",
        },
        {
          label: "Toplu seçim",
          text: "Satır başındaki onay kutularıyla öğrencileri seç; başlıktaki kutu görünen tüm satırları seçer — filtreyle birlikte kullanınca yalnız filtrelenenleri.",
        },
        {
          label: "Toplu atama şeridi",
          text: "Satır seçilince üstte şerit açılır: “Koç seç” listesinden hedefi belirle ve tek hamlede uygula; “Atamayı kaldır” da bir seçenektir.",
        },
      ],
      buttons: [
        {
          label: "Seçilenleri koça ata",
          does: "Seçilen tüm öğrencileri “Koç seç” listesindeki hedefe tek hamlede bağlar.",
        },
        {
          label: "Tümünü seç",
          does: "Tablo başlığındaki onay kutusu — görünen tüm satırları seçer.",
        },
        {
          label: "Atamayı kaldır",
          does: "“Koç seç” listesindeki seçenek; seçilen öğrencilerin koç atamasını kaldırır.",
        },
      ],
      tip: "Koçsuz öğrenci kimsenin panelinde görünmez ve takipsiz kalır. Haftalık rutinde “Atanmamış” çipine bak — sayı sıfır olmalı.",
      section: "koc-atamasi",
    },

    /* ————————————————— 4. Kadro bakımı ————————————————— */
    {
      id: "kadro-bakim",
      nav: "Öğrenciler",
      title: "Kadro bakımı: birleştirme ve gizleme",
      route: "/koc/ogrenciler",
      purpose:
        "Aynı ekranın bakım tarafı: yinelenen kayıtları birleştirir, ayrılan öğrencileri gizler ve gerekirse geri getirirsin. Buradaki birleştirme işlemi geri alınamaz.",
      highlights: [
        {
          label: "Yinelenen kayıtlar paneli",
          text: "Kadro listesinin altında yalnız sorun varken görünür. İki tür grup: aynı telefonlu kayıtlar (acil — telefon giriş kimliğidir, PIN yanlış kayda sıfırlanıp giriş kırılır) ve telefonsuz ama aynı adlı kayıtlar (muhtemel çift).",
        },
        {
          label: "Kalacak kaydı seçme",
          text: "Radyo düğmesiyle korunacak kaydı seç — varsayılan en çok verisi olandır. “hesabı var” rozetine özellikle dikkat et; emin değilsen adlara tıklayıp iki kokpiti karşılaştır.",
        },
        {
          label: "Birleştirme geri alınamaz",
          text: "Soru, deneme, plan ve ödeme verisi kalan kayda taşınır, giriş hesabı ona bağlanır, eski kayıt gizlenir. Veri silinmez ama hangi verinin hangi kayıttan geldiği bir daha ayrıştırılamaz.",
        },
        {
          label: "Gizleme silme değildir",
          text: "Kokpitin sağ üstündeki “Gizle” öğrenciyi tüm ekranlardan kaldırır ve açık oturumunu hemen kapatır; hiçbir verisi silinmez.",
        },
        {
          label: "Geri getirme",
          text: "Gizlenenler kadro listesinin altındaki “Gizlenen öğrenciler” bölümünde gizlenme tarihiyle bekler; dönen öğrenciyi geri getirmek yeni kayıt açmaktan her zaman daha doğrudur.",
        },
      ],
      buttons: [
        {
          label: "Seçileni koru, birleştir",
          does: "Onay diyaloğunu açar; ne taşınacağı özetlenir, henüz hiçbir şey değişmez.",
        },
        {
          label: "Birleştir",
          does: "Diyalogdaki kesin onay — taşımayı uygular. Bu adımdan sonra geri dönüş yoktur.",
        },
        {
          label: "Gizle",
          does: "Öğrenciyi tüm ekranlardan kaldırır ve oturumunu kapatır; verisi olduğu gibi durur.",
        },
        {
          label: "Geri getir",
          does: "Gizlenen öğrenciyi yeniden aktifleştirir; kaldığı yerden devam eder.",
        },
      ],
      tip: "Birleştirmeden önce yavaşla: yanlış kaydı korursan ayırmanın yolu yoktur. Silme ihtiyacı hissettiğinde ise cevap neredeyse her zaman gizlemektir.",
      section: "yinelenen-kayitlar",
    },

    /* ————————————————— 5. İçe aktarma ————————————————— */
    {
      id: "ice-aktar",
      nav: "İçe aktar",
      title: "Kadroyu CSV ile eşitleme",
      route: "/koc/ice-aktar",
      purpose:
        "Güncel öğrenci listesini yapıştır ya da yükle; telefon numarasına göre eşleştirilir ve kadro tek hamlede eşitlenir. Önizleme olmadan hiçbir şey yazılmaz.",
      highlights: [
        {
          label: "CSV biçimi",
          text: "İlk satır başlık: fullName,phone,examCode,trackCode,targetText,grade,status (Türkçe başlıklar da kabul edilir). examCode KPSS / YKS / LGS; YKS için trackCode zorunlu. Telefonsuz satır içe aktarılamaz.",
        },
        {
          label: "Eşitleme mantığı",
          text: "Yeni numaralar öğrenci olarak eklenir, mevcut numaraların bilgileri güncellenir ve listede OLMAYAN aktif öğrenciler pasife alınır — en riskli kısım budur. Sistemdeki telefonsuz öğrencilere dokunulmaz.",
        },
        {
          label: "Önizleme sayaçları",
          text: "“Önizle” kuru çalıştırmadır: Yeni öğrenci, Güncellenen, Pasife alınan, Telefonsuz (dokunulmadı), Tekrar (son geçerli) ve Hatalı satır sayaçlarını gösterir, hiçbir şey yazmaz.",
        },
        {
          label: "Güvenlik kilitleri",
          text: "Hatalı satır varken aktarım düğmesi kapalıdır; CSV'yi değiştirirsen önizleme geçersiz olur ve baştan önizlemen gerekir.",
        },
      ],
      buttons: [
        {
          label: "CSV dosyası seç",
          does: "Bilgisayardan .csv yükler — metin kutusuna yapıştırmakla aynı.",
        },
        {
          label: "Önizle",
          does: "Kuru çalıştırma: ne olacağını sayılarla gösterir, hiçbir şey yazmaz.",
        },
        {
          label: "İçe aktar ve eşitle",
          does: "Onay diyaloğunu açar; yalnız geçerli bir önizleme varken ve hata yokken aktiftir.",
        },
        {
          label: "Onayla ve aktar",
          does: "Aktarımı uygular ve sonucu bildirimle özetler.",
        },
      ],
      tip: "Eksik bir liste yüklersen listede olmayan herkes pasife alınır. Aktarımdan önce “Pasife alınacaklar” örneklerini satır satır oku — adlar gerçekten ayrılanlar mı?",
      section: "ice-aktarma",
    },

    /* ————————————————— 6. Otomatik faturalar ————————————————— */
    {
      id: "otomatik-fatura",
      nav: "Muhasebe",
      title: "Otomatik faturaları çalıştırma",
      route: "/koc/muhasebe",
      purpose:
        "Muhasebe ekranını koçlar da kullanır; üst şeritteki “Otomatik faturalar” ve “Ekstre mutabakatı” düğmeleri ise yalnız sana görünür. Vadesi gelen faturaları tek dokunuşla kesersin.",
      highlights: [
        {
          label: "Fatura motoru",
          text: "Ücret planı tanımlı öğrencilerde vadesi gelen dönemleri tarar, eksik faturaları keser ve sonucu bildirir. Kesilen faturalar öğrencinin Ödemeler ekranına düşer.",
        },
        {
          label: "İdempotent çalışır",
          text: "İstediğin sıklıkta basabilirsin — kesilmiş dönem için ikinci fatura oluşmaz. “Vadesi gelen fatura yok” da normal bir sonuçtur.",
        },
        {
          label: "Para kuruş saklanır",
          text: "Tüm tutarlar sistemde tam sayı kuruş olarak tutulur ve TL biçiminde gösterilir; yuvarlama hatası oluşmaz.",
        },
        {
          label: "Devamı aynı ekranda",
          text: "Kesilenleri “Faturalar” sayfasından gözden geçir; “Gecikmiş ödemeler” kartından vadesi geçenlere tek dokunuşla WhatsApp hatırlatması gönder.",
        },
      ],
      buttons: [
        {
          label: "Otomatik faturalar",
          does: "Vadesi gelen tüm planlar için faturaları üretir; kaç fatura kesildiği bildirimde özetlenir.",
        },
        {
          label: "Ekstre mutabakatı",
          does: "Banka ekstresi mutabakat ekranını açar — turun bir sonraki adımı.",
        },
      ],
      tip: "Ay başında bir kez bas, bildirimi oku, gecikmişleri hatırlat — aylık para turunun ilk yarısı bu kadar.",
      section: "otomatik-faturalar",
    },

    /* ————————————————— 7. Mutabakat ————————————————— */
    {
      id: "mutabakat",
      nav: "Muhasebe",
      title: "Banka ekstresi mutabakatı",
      route: "/koc/muhasebe/mutabakat",
      purpose:
        "Havaleyle ödeyenleri tek tek işlemek yerine ekstreyi topluca okutursun: gelen havaleler gönderen adına göre öğrencilerle eşleştirilir. Sen onaylamadan hiçbir ödeme yazılmaz.",
      highlights: [
        {
          label: "İki kaynak modu",
          text: "“CSV / tablo” bankanın verdiği düzenli dökümler için; “Serbest metin (AI)” banka uygulamasından kopyalanan karışık hareket listesi için — gelen havaleler yapay zekâ ile ayrıştırılır.",
        },
        {
          label: "Eşleştirme = öneri",
          text: "“Eşleştir” yalnız bir eşleşme tablosu üretir; bu aşamada hiçbir şey kaydedilmez. Tabloyu düzeltmek tamamen senin elinde.",
        },
        {
          label: "Tabloyu düzeltme",
          text: "“belirsiz” rozetli satırlarda öğrenciyi elle doğrula, eşleşmeyenlere “— öğrenci seç —” listesinden ata, tarihleri düzelt, kaydedilmeyecek satırların işaretini kaldır.",
        },
        {
          label: "Yineleme koruması",
          text: "Aynı gün + aynı tutar + aynı öğrenci için kayıt zaten varsa satır atlanır — aynı ekstreyi iki kez işlemek çift ödeme yaratmaz.",
        },
      ],
      buttons: [
        {
          label: "Eşleştir",
          does: "Ekstreyi okur ve gelen havaleleri öğrencilerle eşleştirir; henüz hiçbir şey kaydetmez.",
        },
        {
          label: "Dosya seç",
          does: ".csv veya .txt dosyası yükler — yapıştırmakla aynı.",
        },
        {
          label: "Ödemeleri kaydet",
          does: "Onay diyaloğunu açar; yalnız işaretli ve öğrencisi seçili satırlar sayılır (sayı parantez içinde yazar).",
        },
        {
          label: "Onayla ve kaydet",
          does: "Seçili havaleleri havale ödemesi olarak yazar ve öğrencinin açık faturasına bağlar.",
        },
      ],
      tip: "Asıl risk çift kayıt değil, yanlış öğrenciye kayıttır — “belirsiz” rozetli satırları onaylamadan önce mutlaka elle doğrula.",
      section: "mutabakat",
    },

    /* ————————————————— 8. Başvurular ————————————————— */
    {
      id: "basvurular",
      nav: "Başvurular",
      title: "Koç başvurularını inceleme",
      route: "/koc/basvurular",
      purpose:
        "Sitedeki /koc-basvuru formundan gelen başvurular burada birikir — koçlar bu sayfayı göremez. Durum akışıyla ilerletir, uygun adayı koça çevirirsin.",
      highlights: [
        {
          label: "Başvuru kartı",
          text: "Adayın adı, branşı, telefonu, e-postası, deneyimi ve mesajı tek kartta; bağlantı bıraktıysa “CV / Profil” düğmesi de görünür.",
        },
        {
          label: "Durum akışı",
          text: "Yeni → İnceleniyor → Görüşme → Kabul / Ret. Üstteki filtre çipleri (Tümü, Yeni, İnceleniyor, Görüşme, Kabul, Ret) her durumu sayısıyla listeler.",
        },
        {
          label: "Görüşme daveti",
          text: "“WhatsApp” düğmesi adaya hazır görüşme davet mesajıyla sohbet açar — mesajı gönderip göndermemek sende.",
        },
        {
          label: "“Koça çevir” hesap açmaz",
          text: "Yalnız /koc/yonetim'deki koç ekleme formunu adayın ad ve e-postasıyla ön-doldurur. Hesap, sen geçici şifre belirleyip “Koç ekle” düğmesine basınca açılır.",
        },
      ],
      buttons: [
        {
          label: "WhatsApp",
          does: "Adaya hazır görüşme davet mesajıyla sohbet açar.",
        },
        {
          label: "CV / Profil",
          does: "Adayın bıraktığı bağlantıyı yeni sekmede açar.",
        },
        {
          label: "Koça çevir",
          does: "/koc/yonetim'e götürür ve koç ekleme formunu ön-doldurur; hesap açmaz, başvuruyu kapatmaz.",
        },
      ],
      tip: "Adayı koça çevirdikten sonra başvurunun durumunu elle Kabul'e çekmeyi unutma — form ön-dolumu durumu değiştirmez.",
      section: "basvurular",
    },

    /* ————————————————— 9. Site: Dönem ————————————————— */
    {
      id: "site-donem",
      nav: "Site",
      title: "Dönem sekmesi: kontenjan ve kayıt durumu",
      route: "/koc/site",
      purpose:
        "İşletmenin tamamı için tek bir aktif dönem vardır ve sitedeki “sınırlı kontenjan” konumlandırmasının tek kaynağı burasıdır. Kaydettiğin anda yayına yansır — ayrı yayımlama adımı yoktur.",
      highlights: [
        {
          label: "Durum seçenekleri",
          text: "“Açık — kayıt alıyor”, “Son kontenjan”, “Dolu — bekleme listesi” ve “Kapalı”. Dolu veya Kapalı seçilince sitedeki tüm kayıt düğmeleri bekleme listesi formuna döner.",
        },
        {
          label: "Gösterilen sayılar pazarlama değeridir",
          text: "“Gösterilen kontenjan” ve “Gösterilen dolu” sitede yayımlanan değerlerdir — gerçek kapasite değil. Formun üstündeki gerçek aktif öğrenci sayısı yalnız sana görünen bir referanstır ve hiçbir herkese açık sayfaya çıkmaz.",
        },
        {
          label: "Kapanış geri sayımı",
          text: "“Kayıt kapanış tarihi” girildiğinde site sakin bir “kayıtlar … içinde kapanıyor” geri sayımı gösterir. Kontenjan alanını boş bırakırsan sayı yerine yalnız “sınırlı kontenjan” yazısı çıkar.",
        },
        {
          label: "Site geneli kapatma anahtarı",
          text: "“Kontenjan/dönem mesajları sitede görünsün” kutusunun işaretini kaldırınca tüm kıtlık mesajları (rozet, bant, geri sayım) birden gizlenir.",
        },
      ],
      buttons: [
        {
          label: "Dönem ayarını kaydet",
          does: "Tüm dönem ayarlarını kaydeder; değişiklik anında yayına geçer.",
        },
        {
          label: "Kontenjan/dönem mesajları sitede görünsün",
          does: "Kıtlık mesajlarının site genelindeki açma/kapatma anahtarı.",
        },
        {
          label: "Bekleme listesi başvuru alsın",
          does: "/bekleme-listesi formunun başvuru kabul etmesini açar/kapatır — Dolu/Kapalı durumdayken kapatma, talebi kaybedersin.",
        },
      ],
      tip: "Doluluk arttıkça “Gösterilen dolu” değerini kademeli yükselt; tek hamlede büyük sıçramalar inandırıcılığı bozar. Kıtlık sakin ve gerçek kalmalı.",
      section: "donem",
    },

    /* ————————————————— 10. Site: İçerik ————————————————— */
    {
      id: "site-icerik",
      nav: "Site",
      title: "Site içeriği: iletişim, yorumlar, paketler, kaynaklar, SSS",
      route: "/koc/site",
      purpose:
        "Aynı ekranın diğer sekmeleri sitenin tüm içeriğini besler: yüzen WhatsApp düğmesi ve sosyal ikonlardan fiyat paketlerine ve SSS'ye kadar. Her kayıt anında yayına yansır.",
      highlights: [
        {
          label: "İletişim & Sosyal",
          text: "WhatsApp numarası ve hazır mesaj sitedeki yüzen düğmeyi besler — “Bağlantıyı test et” ile yayımlamadan dene. Instagram, TikTok ve YouTube alanları boşsa koddaki varsayılan adresler kullanılır.",
        },
        {
          label: "Yorumlar ve derece vitrini",
          text: "Sitede ad + soyadın ilk harfi kullanılır (ör. “Merve K.”). “Öğrenci yayın izni verdi” işaretlenmeden yorum vitrine çıkamaz — izni gerçekten almış olmak senin sorumluluğun; belge görselindeki TC kimlik gibi alanları yüklemeden önce kırp.",
        },
        {
          label: "Paketler",
          text: "Fiyatı ₺ olarak girersin, sistem kuruş cinsinden saklar. Özellikleri her satıra bir madde yaz.",
        },
        {
          label: "Kaynaklar ve SSS",
          text: "Kaynaklar /kaynaklar dizinini besler — yalnız resmî kurumlara bağlantı ver; kırılan adresi buradan deploy'suz düzeltirsin. SSS'de “Eksik hazır soruları ekle” yalnız eksikleri getirir, mevcut cevapları ezmez.",
        },
        {
          label: "Ortak düzen",
          text: "Her kayıtta “Sitede” / “Gizli” rozeti, sıra alanı ve düzenle/sil simgeleri var. Silinen kayıt geri gelmez — mevsimlik içerikte silmek yerine “Sitede görünsün” işaretini kaldır.",
        },
      ],
      buttons: [
        {
          label: "Bağlantıyı test et",
          does: "Girdiğin numara ve mesajla WhatsApp bağlantısını yeni sekmede dener.",
        },
        {
          label: "Yorum ekle",
          does: "Yeni öğrenci yorumu için düzenleme diyaloğunu açar.",
        },
        {
          label: "Paket ekle",
          does: "Yeni fiyat paketi diyaloğunu açar; fiyat ₺ girilir, kuruş saklanır.",
        },
        {
          label: "Eksik hazır soruları ekle",
          does: "Kodda tanımlı olup sitede olmayan SSS sorularını ekler; mevcut cevaplara dokunmaz.",
        },
      ],
      tip: "Tur burada bitiyor. Ayrıntı gerektiğinde yönetici rehberinde ara; işlerin hangi sırayla birbirine bağlandığını görmek için Akış sayfasına bak.",
      section: "site-icerik",
    },
  ],
};

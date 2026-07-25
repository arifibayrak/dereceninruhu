import type { Guide } from "@/lib/rehber/types";

export const yoneticiRehberi: Guide = {
  basePath: "/koc/rehber/yonetici",
  title: "Yönetici rehberi",
  description:
    "Yalnız yöneticilere açık ekranlar: ekip yönetimi, kadro içe aktarma, mutabakat, koç başvuruları ve site içeriği.",
  sections: [
    /* ————————————————————— Kapsam ————————————————————— */
    {
      id: "yonetici-farki",
      no: 1,
      chapter: "Kapsam",
      title: "Yönetici olarak ne değişir",
      lead: "Yönetici, koçun yapabildiği her şeyi yapar; üstüne tüm kadroyu görür ve beş ek sayfayı yönetir.",
      keywords: ["admin", "yetki", "rol", "hesap sahibi", "owner", "fark"],
      blocks: [
        {
          kind: "para",
          text: "Koç yalnız kendisine atanan öğrencileri görür; yönetici tüm kadroyu görür ve her öğrencinin kokpitine girebilir. Buna ek olarak beş sayfa yalnız yöneticiye açılır: /koc/yonetim (ekip), /koc/ice-aktar (kadro CSV), /koc/site (site içeriği ve dönem), /koc/basvurular (koç başvuruları) ve /koc/muhasebe/mutabakat (banka ekstresi). Yetki sunucu tarafında denetlenir — koç bu adreslere girse bile geri yönlendirilir.",
        },
        {
          kind: "steps",
          title: "Yalnız yöneticiye açık alanlar",
          items: [
            "/koc/yonetim — koç ve yönetici hesapları, rol değiştirme.",
            "/koc/ice-aktar — kadroyu CSV ile içe aktarma ve eşitleme.",
            "/koc/site — dönem, iletişim, yorumlar, paketler, kaynaklar, SSS.",
            "/koc/basvurular — siteden gelen koç başvurularını inceleme.",
            "/koc/muhasebe/mutabakat — banka ekstresini ödemelerle eşleştirme.",
            "Sayfa içi bloklar: Öğrenciler'de Koç sütunu, yinelenen kayıtlar ve gizlenen öğrenciler paneli; Muhasebe'de otomatik fatura düğmesi.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Öğrenci atamaları",
              where: "/koc/yonetim sağ üst",
              does: "Kadro listesine götürür; öğrenci → koç ataması oradaki Koç sütunundan yapılır.",
            },
            {
              label: "Ekstre mutabakatı",
              where: "/koc/muhasebe üst şerit (yalnız yönetici)",
              does: "Banka ekstresi mutabakat ekranını açar.",
            },
            {
              label: "Otomatik faturalar",
              where: "/koc/muhasebe üst şerit (yalnız yönetici)",
              does: "Vadesi gelen otomatik faturaları hemen üretir.",
            },
          ],
        },
        {
          kind: "note",
          text: "Bir de hesap sahibi (owner) kavramı var: işletmenin sahibi olan tek hesap. Hesap sahibinin rolünü yalnız kendisi değiştirebilir — başka bir yönetici bile değiştiremez. Ayrıntı 2. bölümde.",
        },
        {
          kind: "link",
          href: "/koc/rehber",
          label: "Günlük koçluk akışının tamamı için koç rehberine bak",
        },
      ],
    },

    /* ————————————————————— Ekip ————————————————————— */
    {
      id: "ekip-yonetimi",
      no: 2,
      chapter: "Ekip",
      title: "Ekip yönetimi: koç ve yönetici ekleme, rol değiştirme",
      lead: "Ekip tablosunda herkesin rolü, öğrenci sayısı ve katılım tarihi görünür; yeni hesaplar alttaki iki formdan açılır.",
      where: "/koc/yonetim",
      keywords: ["koç ekle", "yönetici ekle", "rol", "ekip", "şifre", "owner"],
      blocks: [
        {
          kind: "para",
          text: "Yeni koç, e-posta ve geçici şifreyle giriş yapar ve yalnız kendisine atanan öğrencileri görür. Yeni yönetici ise tüm öğrencileri görür, ekibi ve atamaları yönetir. Rol değiştirme, tablodaki satırın sağındaki açılır seçimle anında yapılır.",
        },
        {
          kind: "steps",
          title: "Koç eklemek",
          items: [
            "“Koç ekle” kartında Ad Soyad, E-posta ve Geçici şifre alanlarını doldur (telefon, Telegram, Instagram, IBAN isteğe bağlı).",
            "“Koç ekle” düğmesine bas — hesap hemen açılır, koç bu e-posta ile giriş yapabilir.",
            "Geçici şifreyi koça güvenli bir kanaldan ilet; ilk girişte değiştirmesini söyle.",
            "Öğrenci ataması için sağ üstteki “Öğrenci atamaları” ile kadro listesine geç (3. bölüm).",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Koç ekle",
              where: "“Koç ekle” kartının altı",
              does: "Koç hesabını oluşturur; koç yalnız kendisine atanan öğrencileri görür.",
            },
            {
              label: "Yönetici ekle",
              where: "“Yönetici ekle” kartının altı",
              does: "Yönetici hesabını oluşturur; tüm öğrencileri görür, ekip ve site ayarlarını yönetir.",
            },
            {
              label: "Rol değiştir",
              where: "Ekip tablosunun son sütunu (açılır seçim)",
              does: "Hesabı Koç ↔ Yönetici arasında çevirir. Kilitliyse nedeni seçimin altında yazar.",
            },
            {
              label: "Öğrenci atamaları",
              where: "Sayfanın sağ üstü",
              does: "Öğrenci → koç atamasının yapıldığı kadro listesine götürür.",
            },
          ],
        },
        {
          kind: "warning",
          text: "İki kilit var. Son yönetici koça çevrilemez — sistemde her zaman en az bir yönetici kalmak zorundadır; önce başka bir yönetici ekle. Hesap sahibinin rolünü ise yalnız kendisi değiştirebilir; satırda “Hesap sahibi — yalnız kendisi değiştirebilir” yazıyorsa seçim sana kapalıdır. Her iki kural sunucu tarafında da ayrıca korunur.",
        },
        {
          kind: "faq",
          items: [
            {
              q: "Yönetici yaptığım kişi neyi görür?",
              a: "Her şeyi: tüm öğrenciler, muhasebe, site içeriği, ekip yönetimi. Yönetici rolünü yalnız gerçekten gereken kişilere ver.",
            },
            {
              q: "Bir koçu yönetici yaparsam öğrencileri ne olur?",
              a: "Atamaları değişmez; sadece görüş alanı genişler. Tekrar koça çevirirsen yine yalnız kendi öğrencilerini görür.",
            },
            {
              q: "Koç şifresini unuttu, ne yapayım?",
              a: "Personel hesapları e-posta + şifre ile girer; şifre sıfırlama akışı öğrenci PIN sıfırlamadan ayrıdır. Gerekirse giriş sayfasındaki şifre sıfırlamayı kullanmasını söyle.",
            },
          ],
        },
      ],
    },
    {
      id: "koc-atamasi",
      no: 3,
      chapter: "Ekip",
      title: "Öğrenciyi koça atama (tekil ve toplu)",
      lead: "Atama, kadro tablosundaki Koç sütunundan yapılır; birden çok öğrenciyi seçip tek hamlede aynı koça bağlayabilirsin.",
      where: "/koc/ogrenciler",
      keywords: ["atama", "koç ata", "toplu", "atanmamış", "kadro"],
      blocks: [
        {
          kind: "para",
          text: "Koç sütunu yalnız yöneticiye görünür. Atama öğrencinin aktif kaydını (enrollment) koça bağlar: koç o andan itibaren öğrenciyi panelinde görür, sen atamayı her an değiştirebilir ya da kaldırabilirsin. Atama değişince geçmiş veri taşınmaz — veriler öğrencinin kaydında durur.",
        },
        {
          kind: "steps",
          title: "Toplu atama",
          items: [
            "Gerekirse önce filtrele: sınav çipleri (KPSS/YKS/LGS) ve “Koça göre” çipleri listeyi daraltır.",
            "Satır başındaki onay kutularıyla öğrencileri seç; başlıktaki “Tümünü seç” görünen tüm satırları seçer.",
            "Üstte açılan şeritte “Koç seç” listesinden hedefi seç — “Atamayı kaldır” da bir seçenek.",
            "“Seçilenleri koça ata” ile uygula; sonuç bildirimde özetlenir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Koç ata",
              where: "Tablodaki Koç sütunu (her satırda açılır seçim)",
              does: "Öğrenciyi seçilen koça bağlar; “Atanmadı” seçilirse atama kalkar.",
            },
            {
              label: "Tümünü seç",
              where: "Tablo başlığındaki onay kutusu",
              does: "Görünen tüm satırları seçer — filtreyle birlikte kullanınca yalnız filtrelenenleri.",
            },
            {
              label: "Seçilenleri koça ata",
              where: "Satır seçilince üstte açılan şerit",
              does: "Seçilen tüm öğrencileri “Koç seç” listesindeki hedefe tek hamlede bağlar.",
            },
            {
              label: "Atanmamış",
              where: "“Koça göre” filtre çipleri",
              does: "Koçu olmayan öğrencileri listeler; sayısı çipin üzerinde görünür.",
            },
          ],
        },
        {
          kind: "tip",
          text: "Haftalık rutinde “Atanmamış” çipine bir bak: koçsuz öğrenci kimsenin panelinde görünmez ve takipsiz kalır. Sayı sıfır olmalı.",
        },
        {
          kind: "link",
          href: "/koc/rehber#bolum-yeni-ogrenci",
          label: "Öğrenci ekleme ve davet akışı için koç rehberine bak",
        },
      ],
    },

    /* ————————————————————— Kadro bakımı ————————————————————— */
    {
      id: "yinelenen-kayitlar",
      no: 4,
      chapter: "Kadro bakımı",
      title: "Yinelenen kayıtları birleştirme",
      lead: "Aynı öğrenciye ait birden çok kayıt varsa kadro listesinin altında uyarı paneli çıkar; kalacak kaydı seçip diğerlerini içine katarsın.",
      where: "/koc/ogrenciler",
      keywords: [
        "yinelenen",
        "çift kayıt",
        "birleştir",
        "duplicate",
        "merge",
        "PIN",
      ],
      blocks: [
        {
          kind: "para",
          text: "Telefon numarası giriş kimliğidir; aynı numarada iki kayıt varsa öğrencinin verisi ikiye bölünür ve PIN yanlış kayda sıfırlanabildiği için giriş kırılır. Panel iki tür grubu gösterir: aynı telefonlu kayıtlar (acil) ve telefonsuz ama aynı adlı kayıtlar (muhtemel çift). Birleştirmede tek kayıt kalır, diğerlerinin her şeyi ona taşınır.",
        },
        {
          kind: "steps",
          title: "Birleştirme",
          items: [
            "Grupta kalacak kaydı radyo düğmesiyle seç — varsayılan, en çok verisi olandır; emin değilsen adlara tıklayıp iki kokpiti karşılaştır.",
            "“Seçileni koru, birleştir” düğmesine bas; onay diyaloğu ne taşınacağını özetler.",
            "Diyalogdaki “Birleştir” ile uygula. Soru, deneme, plan ve ödeme verisi kalan kayda taşınır; giriş hesabı da ona bağlanır.",
            "Eski kayıt(lar) gizlenir — silinmez; kadroda artık tek satır görürsün.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Seçileni koru, birleştir",
              where: "“Yinelenen kayıtlar” panelinde her grubun altı",
              does: "Onay diyaloğunu açar; henüz hiçbir şey değişmez.",
            },
            {
              label: "Birleştir",
              where: "Onay diyaloğu",
              does: "Taşımayı uygular: veri ve giriş hesabı kalan kayda geçer, eski kayıt gizlenir.",
            },
            {
              label: "Vazgeç",
              where: "Onay diyaloğu",
              does: "Hiçbir değişiklik yapmadan kapatır.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Birleştirme geri alınamaz. Veri silinmez ama hangi verinin hangi kayıttan geldiği ayrıştırılamaz; yanlış kaydı korursan ayırmanın yolu yoktur. Basmadan önce kalan kaydın doğru olduğundan emin ol — özellikle “hesabı var” rozetine dikkat et.",
        },
      ],
    },
    {
      id: "ogrenci-gizleme",
      no: 5,
      chapter: "Kadro bakımı",
      title: "Öğrenciyi gizleme ve geri getirme",
      lead: "Gizleme silme değildir: öğrenci tüm ekranlardan kalkar ve giremez, ama verisi olduğu gibi durur ve tek tuşla geri gelir.",
      where: "/koc/ogrenciler",
      keywords: [
        "gizle",
        "geri getir",
        "sil",
        "pasif",
        "soft delete",
        "ayrılan",
      ],
      blocks: [
        {
          kind: "para",
          text: "Ayrılan ya da yanlışlıkla açılmış öğrenciler için gizlemeyi kullan. Gizlenen öğrenci tüm koç ekranlarından kalkar, sisteme giremez ve açık oturumu hemen kapanır. Soru, deneme, ödeme — hiçbir verisi silinmez; kadro listesinin altındaki “Gizlenen öğrenciler” bölümünde bekler.",
        },
        {
          kind: "steps",
          title: "Gizleme ve geri getirme",
          items: [
            "Öğrencinin kokpitine gir (/koc/ogrenciler → ada tıkla).",
            "Sağ üstteki kırmızı “Gizle” düğmesine bas; onay diyaloğu sonucu özetler.",
            "Diyalogdaki “Gizle” ile onayla — kadro listesine dönersin.",
            "Geri almak için kadro listesinin altındaki “Gizlenen öğrenciler” bölümünde “Geri getir” düğmesine bas; öğrenci yeniden aktifleşir ve tekrar giriş yapabilir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Gizle",
              where: "Öğrenci kokpitinin sağ üstü (yalnız yönetici)",
              does: "Onay diyaloğunu açar; diyalogdaki “Gizle” öğrenciyi tüm ekranlardan kaldırır ve oturumunu kapatır.",
            },
            {
              label: "Geri getir",
              where: "/koc/ogrenciler altındaki “Gizlenen öğrenciler” bölümü",
              does: "Öğrenciyi yeniden aktifleştirir; verisi hiç silinmediği için kaldığı yerden devam eder.",
            },
          ],
        },
        {
          kind: "note",
          text: "“Gizlenen öğrenciler” bölümü yalnız gizli kayıt varken görünür ve her satırda gizlenme tarihi yazar. Ödeme geçmişi gibi kayıtlar durduğu için, dönen bir öğrenciyi gizleyip geri getirmek yeni kayıt açmaktan her zaman daha doğrudur.",
        },
      ],
    },
    {
      id: "ice-aktarma",
      no: 6,
      chapter: "Kadro bakımı",
      title: "Kadroyu CSV ile içe aktarma ve eşitleme",
      lead: "Güncel öğrenci listesini CSV olarak yapıştır ya da yükle; telefon numarasına göre eşleştirilir ve kadro tek hamlede eşitlenir.",
      where: "/koc/ice-aktar",
      keywords: [
        "csv",
        "içe aktar",
        "eşitle",
        "import",
        "toplu ekleme",
        "pasif",
      ],
      blocks: [
        {
          kind: "para",
          text: "İlk satır başlık olmalı: fullName,phone,examCode,trackCode,targetText,grade,status (Türkçe başlıklar da kabul edilir). Eşleştirme telefon numarasıyla yapılır: listedeki yeni numaralar öğrenci olarak eklenir, mevcut numaraların bilgileri güncellenir ve listede OLMAYAN aktif öğrenciler pasife alınır. Telefonu olmayan satır içe aktarılamaz; sistemdeki telefonsuz öğrencilere de dokunulmaz.",
        },
        {
          kind: "steps",
          title: "Güvenli aktarım sırası",
          items: [
            "CSV'yi metin kutusuna yapıştır ya da “CSV dosyası seç” ile yükle.",
            "“Önizle” ile kuru çalıştır — hiçbir şey yazılmaz, yalnız ne olacağı sayılarla gösterilir.",
            "Özeti dikkatle oku: özellikle “Pasife alınacaklar” listesindeki adlar gerçekten ayrılanlar mı?",
            "Hatalı satır varsa düzelt ve yeniden önizle — hata varken aktarım düğmesi kapalıdır.",
            "“İçe aktar ve eşitle” → diyalogda “Onayla ve aktar” ile uygula. CSV'yi sonradan değiştirirsen önizleme geçersiz olur, baştan önizlemen gerekir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "CSV dosyası seç",
              where: "Metin kutusunun altı",
              does: "Bilgisayardan .csv dosyası yükler (yapıştırmakla aynı).",
            },
            {
              label: "Önizle",
              where: "Metin kutusunun altı",
              does: "Kuru çalıştırma: yeni / güncellenecek / pasife alınacak sayılarını ve hataları gösterir, hiçbir şey yazmaz.",
            },
            {
              label: "İçe aktar ve eşitle",
              where: "Metin kutusunun altı (yeşil)",
              does: "Onay diyaloğunu açar; yalnız geçerli bir önizleme varken ve hatalı satır yokken aktiftir.",
            },
            {
              label: "Onayla ve aktar",
              where: "Onay diyaloğu",
              does: "Aktarımı uygular ve sonucu bildirimle özetler.",
            },
          ],
        },
        {
          kind: "table",
          title: "Önizleme sayaçları",
          head: ["Sayaç", "Anlamı"],
          rows: [
            [
              "Yeni öğrenci",
              "Sistemde olmayan numara — öğrenci olarak eklenecek.",
            ],
            [
              "Güncellenen",
              "Numara eşleşti — ad/sınav/hedef bilgileri güncellenecek.",
            ],
            [
              "Pasife alınan",
              "Sistemde aktif ama listede yok — pasife alınacak. Bu listeyi mutlaka kontrol et.",
            ],
            [
              "Telefonsuz (dokunulmadı)",
              "Sistemde telefonu olmayan öğrenci — eşleştirilemez, aktif kalır.",
            ],
            [
              "Tekrar (son geçerli)",
              "CSV'de aynı numara birden çok kez — son satır geçerli.",
            ],
            [
              "Hatalı satır",
              "Düzeltilmeden aktarım yapılamaz; satır numarasıyla listelenir.",
            ],
          ],
        },
        {
          kind: "warning",
          text: "Eksik bir liste yüklersen listede olmayan herkes pasife alınır — bu, kadronun yarısını yanlışlıkla pasifleştirmenin en kolay yoludur. Aktarımdan önce “Pasife alınacaklar” örneklerini satır satır oku. Pasif kayıtlar korunur ama toplu bir yanlışı elle geri açmak zahmetlidir.",
        },
        {
          kind: "note",
          text: "examCode KPSS / YKS / LGS olmalı; YKS için trackCode (SAY / EA / SOZ) zorunlu. status boşsa “aktif” sayılır ve grade (sınıf) alanı durumu belirlemez — “mezun” yazan sınıf öğrenciyi pasife almaz.",
        },
      ],
    },

    /* ————————————————————— Para ————————————————————— */
    {
      id: "otomatik-faturalar",
      no: 7,
      chapter: "Para",
      title: "Otomatik faturaları çalıştırma",
      lead: "Ücret planı tanımlı öğrenciler için vadesi gelen faturaları tek düğmeyle üretirsin; motor idempotenttir, aynı fatura iki kez kesilmez.",
      where: "/koc/muhasebe",
      keywords: ["fatura", "otomatik", "billing", "vade", "kuruş", "muhasebe"],
      blocks: [
        {
          kind: "para",
          text: "Öğrencilerin ücret planları (aylık / paket) vadesi geldiğinde faturaya dönüşür. “Otomatik faturalar” düğmesi bu motoru elle tetikler: vadesi gelmiş tüm planları tarar, eksik faturaları keser ve sonucu bildirir. Motor idempotent olduğu için istediğin sıklıkta basabilirsin — kesilmiş dönem için ikinci fatura oluşmaz.",
        },
        {
          kind: "steps",
          title: "Aylık fatura turu",
          items: [
            "Ay başında /koc/muhasebe'ye gir ve “Otomatik faturalar” düğmesine bas.",
            "Bildirimi oku: kaç plan işlendi, kaç fatura kesildi. “Vadesi gelen fatura yok — her şey güncel.” de normal bir sonuçtur.",
            "“Faturalar” sayfasından kesilenleri gözden geçir; “Gecikmiş ödemeler” kartından vadesi geçenlere WhatsApp hatırlatması gönder.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Otomatik faturalar",
              where: "/koc/muhasebe üst şerit (yalnız yönetici)",
              does: "Vadesi gelen tüm planlar için faturaları üretir; sonuç bildirimde özetlenir.",
            },
            {
              label: "Ekstre mutabakatı",
              where: "/koc/muhasebe üst şerit (yalnız yönetici)",
              does: "Banka ekstresi mutabakat ekranını açar (8. bölüm).",
            },
          ],
        },
        {
          kind: "note",
          text: "Tüm tutarlar sistemde tam sayı kuruş olarak saklanır ve TL biçiminde gösterilir — yuvarlama hatası oluşmaz. Ücret planı tanımlama, elle fatura kesme ve ödeme alma her koçun yapabildiği işlerdir; bu rehberde tekrar edilmez.",
        },
        {
          kind: "link",
          href: "/koc/rehber#bolum-muhasebe",
          label:
            "Temel muhasebe akışı (plan, fatura, ödeme) için koç rehberine bak",
        },
      ],
    },
    {
      id: "mutabakat",
      no: 8,
      chapter: "Para",
      title: "Banka ekstresi mutabakatı",
      lead: "Banka ekstreni yapıştır; gelen havaleler gönderen adına göre öğrencilerle eşleştirilir ve onayladıkların ödeme olarak kaydedilir.",
      where: "/koc/muhasebe/mutabakat",
      keywords: [
        "mutabakat",
        "ekstre",
        "banka",
        "havale",
        "eşleştir",
        "reconcile",
      ],
      blocks: [
        {
          kind: "para",
          text: "Havaleyle ödeyen öğrencileri tek tek işlemek yerine ekstreyi topluca işlersin. İki kaynak modu var: “CSV / tablo” bankanın verdiği düzenli dökümler için, “Serbest metin (AI)” banka uygulamasından kopyalanan karışık hareket listesi için — gelen havaleler yapay zekâ ile ayrıştırılır. Eşleştirme öneridir: tabloyu incelemeden hiçbir şey yazılmaz.",
        },
        {
          kind: "steps",
          title: "Mutabakat turu",
          items: [
            "Kaynak modunu seç, ekstreyi yapıştır ya da “Dosya seç” ile yükle.",
            "“Eşleştir” ile okut — gelen havaleler listelenir, gönderen adı kadrodaki öğrencilerle eşleştirilir.",
            "Tabloyu düzelt: “belirsiz” rozetli satırlarda öğrenciyi elle doğrula, eşleşmeyenlere “— öğrenci seç —” listesinden ata, tarihleri gerekirse düzelt, kaydedilmeyecek satırların işaretini kaldır.",
            "“Ödemeleri kaydet” düğmesine bas (seçili sayı parantez içinde yazar) ve diyalogda “Onayla ve kaydet” ile bitir.",
            "Kaydedilenler havale ödemesi olarak yazılır ve öğrencinin açık faturasına bağlanır; sonuç bildirimde özetlenir.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "CSV / tablo",
              where: "Kaynak seçimi sekmesi",
              does: "Düzenli banka CSV'si / tablo dökümü için ayrıştırma modu.",
            },
            {
              label: "Serbest metin (AI)",
              where: "Kaynak seçimi sekmesi",
              does: "Banka uygulamasından kopyalanan serbest metni yapay zekâ ile ayrıştırır.",
            },
            {
              label: "Dosya seç",
              where: "Metin kutusunun altı",
              does: ".csv veya .txt dosyası yükler.",
            },
            {
              label: "Eşleştir",
              where: "Metin kutusunun altı",
              does: "Ekstreyi okur, gelen havaleleri gönderen adına göre öğrencilerle eşleştirir; henüz hiçbir şey kaydetmez.",
            },
            {
              label: "Ödemeleri kaydet",
              where: "Eşleşme tablosunun altı (yeşil)",
              does: "Onay diyaloğunu açar; yalnız işaretli ve öğrencisi seçili satırlar sayılır.",
            },
            {
              label: "Onayla ve kaydet",
              where: "Onay diyaloğu",
              does: "Seçili havaleleri havale ödemesi olarak kaydeder.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Onaylamadan hiçbir ödeme yazılmaz — “Eşleştir” yalnız öneri üretir. Yinelenen havaleler de korunur: aynı gün + aynı tutar + aynı öğrenci için kayıt zaten varsa satır atlanır; yani aynı ekstreyi iki kez işlemek çift ödeme yaratmaz. Asıl risk yanlış öğrenciye kayıttır — “belirsiz” rozetli satırları onaylamadan önce mutlaka elle doğrula.",
        },
      ],
    },

    /* ————————————————————— Talepler ————————————————————— */
    {
      id: "basvurular",
      no: 9,
      chapter: "Talepler",
      title: "Koç başvurularını inceleme",
      lead: "Sitedeki /koc-basvuru formundan gelen başvurular burada birikir; durum akışıyla ilerletir, uygun olanı koça çevirirsin.",
      where: "/koc/basvurular",
      keywords: ["başvuru", "koç adayı", "koça çevir", "işe alım", "görüşme"],
      blocks: [
        {
          kind: "para",
          text: "Bu sayfa yalnız yöneticiye açıktır — koçlar başvuruları göremez. Her kartta adayın adı, branşı, telefonu, deneyimi ve mesajı yer alır. Durum akışı beş adımdır: Yeni → İnceleniyor → Görüşme → Kabul / Ret; üstteki filtre çipleri (Tümü, Yeni, İnceleniyor, Görüşme, Kabul, Ret) sayılarıyla birlikte listeler.",
        },
        {
          kind: "steps",
          title: "Başvuru akışı",
          items: [
            "“Yeni” filtresinden bekleyenleri aç; deneyim ve varsa “CV / Profil” bağlantısını incele.",
            "Kartın sağındaki durum seçiminden ilerlet: İnceleniyor → Görüşme.",
            "“WhatsApp” düğmesiyle hazır görüşme davet mesajını gönder.",
            "Uygun bulursan durumu Kabul yap ve “Koça çevir” ile devam et.",
            "Açılan /koc/yonetim sayfasında koç ekleme formu ad/e-posta ile ön-dolu gelir — geçici şifre belirleyip “Koç ekle” ile hesabı sen oluşturursun.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Başvuru durumu",
              where: "Başvuru kartının sağ üstündeki açılır seçim",
              does: "Durumu Yeni / İnceleniyor / Görüşme / Kabul / Ret arasında değiştirir.",
            },
            {
              label: "WhatsApp",
              where: "Kartın altı",
              does: "Adaya hazır görüşme davet mesajıyla sohbet açar.",
            },
            {
              label: "CV / Profil",
              where: "Kartın altı (aday bağlantı bıraktıysa)",
              does: "Adayın verdiği bağlantıyı yeni sekmede açar.",
            },
            {
              label: "Koça çevir",
              where: "Kartın altı (Ret dışındaki durumlarda)",
              does: "/koc/yonetim'e götürür ve koç ekleme formunu adayın ad/e-postasıyla doldurur.",
            },
          ],
        },
        {
          kind: "warning",
          text: "“Koça çevir” hesap AÇMAZ ve başvuruyu kapatmaz — yalnız ekleme formunu ön-doldurur. Hesap, sen /koc/yonetim'de geçici şifre belirleyip “Koç ekle” düğmesine basınca açılır; ayrıca başvurunun durumunu elle Kabul'e çekmeyi unutma.",
        },
        {
          kind: "link",
          href: "/koc/rehber#bolum-leadler-bekleme",
          label:
            "Öğrenci talepleri (leadler ve bekleme listesi) koç rehberinde",
        },
      ],
    },

    /* ————————————————————— Site ————————————————————— */
    {
      id: "donem",
      no: 10,
      chapter: "Site",
      title: "Dönem ayarı: kontenjan ve kayıt durumu",
      lead: "İşletmenin tamamı için tek bir aktif dönem vardır; adı, durumu ve kontenjan mesajı /koc/site → Dönem sekmesinden yönetilir.",
      where: "/koc/site",
      keywords: [
        "dönem",
        "kontenjan",
        "kayıt",
        "cohort",
        "bekleme listesi",
        "kapanış",
      ],
      blocks: [
        {
          kind: "para",
          text: "Dönem, sitedeki “sınırlı kontenjan” konumlandırmasının tek kaynağıdır: ana sayfadaki bant, fiyat sayfasındaki rozet ve kayıt düğmelerinin davranışı hep buradan beslenir. Kaydettiğin anda yayına yansır — ayrı bir yayımlama adımı yoktur.",
        },
        {
          kind: "steps",
          title: "Dönem güncelleme",
          items: [
            "/koc/site → Dönem sekmesini aç.",
            "Dönem adını (ör. “2026 Güz Dönemi”) ve durumu seç.",
            "Gösterilen kontenjan / dolu sayılarını ve kayıt kapanış tarihini belirle (11. bölüm).",
            "“Dönem ayarını kaydet” ile yayımla; siteyi gizli sekmede açıp mesajları kontrol et.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Durum *",
              where: "Dönem sekmesindeki açılır seçim",
              does: "Dönemin site genelindeki halini belirler; seçenekler alttaki tabloda.",
            },
            {
              label: "Bekleme listesi başvuru alsın",
              where: "Formun altındaki onay kutusu",
              does: "/bekleme-listesi formunun başvuru kabul etmesini açar/kapatır.",
            },
            {
              label: "Dönem ayarını kaydet",
              where: "Formun altı",
              does: "Tüm dönem ayarlarını kaydeder; değişiklik anında yayına geçer.",
            },
          ],
        },
        {
          kind: "table",
          title: "Durum seçenekleri",
          head: ["Durum", "Sitedeki etkisi"],
          rows: [
            ["Açık — kayıt alıyor", "Kayıt düğmeleri normal çalışır."],
            ["Son kontenjan", "Kayıt açık; aciliyet vurgusu güçlenir."],
            [
              "Dolu — bekleme listesi",
              "Kayıt düğmeleri bekleme listesi formuna döner.",
            ],
            [
              "Kapalı",
              "Kayıt tamamen kapalı; düğmeler bekleme listesine döner.",
            ],
          ],
        },
        {
          kind: "warning",
          text: "“Dolu” veya “Kapalı” seçtiğinde sitedeki tüm kayıt çağrıları bekleme listesine dönmelidir — bu yüzden bu durumlarda “Bekleme listesi başvuru alsın” kutusunu kapatma; talebi kaybedersin.",
        },
      ],
    },
    {
      id: "donem-sayilari",
      no: 11,
      chapter: "Site",
      title: "Gösterilen sayılar ve kıtlık mesajları",
      lead: "Sitede görünen kontenjan ve doluluk, yayınlamayı senin seçtiğin pazarlama değerleridir; gerçek öğrenci sayısı hiçbir herkese açık sayfaya çıkmaz.",
      where: "/koc/site",
      keywords: [
        "kıtlık",
        "scarcity",
        "gösterilen kontenjan",
        "pazarlama",
        "gerçek sayı",
        "FOMO",
      ],
      blocks: [
        {
          kind: "para",
          text: "Dönem sekmesindeki “Gösterilen kontenjan” ve “Gösterilen dolu” alanları sitede yayımlanan pazarlama değerleridir — gerçek kapasite değil. Formun üstündeki bilgi kutusunda görünen gerçek aktif öğrenci sayısı yalnız senin referansındır; hiçbir zaman siteye gitmez. Sayılar sınırlı-erişim konumlandırmasını taşır: sakin ve inandırıcı kalmalı, pazarlıkçı görünmemeli.",
        },
        {
          kind: "steps",
          title: "Sayıları ayarlama",
          items: [
            "İnandırıcı bir kontenjan ve doluluk belirle; site farkı “son N kontenjan” olarak gösterir (form altında canlı önizlenir).",
            "Sayı vermek istemiyorsan “Gösterilen kontenjan” alanını boş bırak — sitede yalnız “sınırlı kontenjan” yazısı çıkar.",
            "Kayıt kapanış tarihi gir — site sakin bir “kayıtlar … içinde kapanıyor” geri sayımı gösterir.",
            "Dönem doldukça “Gösterilen dolu” değerini kademeli artır; tek hamlede büyük sıçramalar inandırıcılığı bozar.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Gösterilen kontenjan",
              where: "Dönem sekmesi",
              does: "Yayımlanan toplam kontenjan; boş bırakılırsa sayı yerine yalnız “sınırlı kontenjan” yazısı görünür.",
            },
            {
              label: "Gösterilen dolu",
              where: "Dönem sekmesi",
              does: "Yayımlanan doluluk; kontenjanla farkı sitede “son N kontenjan” olarak görünür.",
            },
            {
              label: "Kayıt kapanış tarihi",
              where: "Dönem sekmesi",
              does: "Girildiğinde sitede kapanış geri sayımı gösterilir.",
            },
            {
              label: "Kontenjan/dönem mesajları sitede görünsün",
              where: "Dönem sekmesindeki onay kutusu",
              does: "Site genelindeki kapatma anahtarı: işareti kaldırınca tüm kıtlık mesajları (rozet, bant, geri sayım) birden gizlenir.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Gerçek öğrenci sayısı ve gerçek kapasite ASLA herkese açık bir yüzeye çıkmaz — koda da, içeriğe de elle yazma. Formdaki referans sayısı yalnız yönetici ekranında durur; sitede görünen her sayı bilinçli seçtiğin yayın değeridir.",
        },
        {
          kind: "note",
          text: "Mesaj çerçevesi karışıktır ve bilinçlidir: fiyat yüzeylerinde oran (“Bu dönem için son N kontenjan” rozeti), ana sayfa ve bantlarda sayısız çerçeve (“Sınırlı kontenjan” + sakin kapanış geri sayımı). Agresif popup ya da yanıp sönen sayaç kullanılmaz — kıtlık gerçek ve zarif kalmalı.",
        },
      ],
    },
    {
      id: "site-iletisim",
      no: 12,
      chapter: "Site",
      title: "İletişim ve sosyal ayarları",
      lead: "Sitedeki yüzen WhatsApp düğmesi, sosyal ikonlar ve şeffaflık sayaçları İletişim & Sosyal sekmesinden yönetilir.",
      where: "/koc/site",
      keywords: [
        "whatsapp",
        "instagram",
        "tiktok",
        "youtube",
        "sosyal",
        "iletişim",
      ],
      blocks: [
        {
          kind: "para",
          text: "WhatsApp İşletme numarası sitedeki yüzen düğmeyi besler: ziyaretçi bastığında hazır mesaj WhatsApp'ta yazılı gelir, göndermeye kendisi karar verir. Numara boş bırakılırsa düğme hiç görünmez. Instagram, TikTok ve YouTube alanları üstbilgi/altbilgi ikonlarını besler; boş bırakılırlarsa koddaki varsayılan adresler kullanılır.",
        },
        {
          kind: "steps",
          title: "İletişim güncelleme",
          items: [
            "/koc/site → İletişim & Sosyal sekmesini aç.",
            "WhatsApp numarasını gir (+90 / 0 / boşluk serbest — kaydederken düzeltilir) ve hazır mesajı yaz.",
            "“Bağlantıyı test et” ile mesajın WhatsApp'ta doğru göründüğünü doğrula.",
            "Sosyal adresleri gir ya da varsayılanlar doğruysa boş bırak; “İletişim ayarını kaydet” ile yayımla.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Bağlantıyı test et",
              where: "Hazır mesaj alanının altı",
              does: "Girdiğin numara ve mesajla WhatsApp bağlantısını yeni sekmede açar — yayımlamadan dener.",
            },
            {
              label: "Yüzen WhatsApp butonu sitede görünsün",
              where: "Onay kutusu",
              does: "Numarayı silmeden düğmeyi geçici olarak gizlemeni sağlar.",
            },
            {
              label: "Başarılar sayfasında şeffaflık sayaçları görünsün",
              where: "Formun altındaki onay kutusu",
              does: "Toplam çözülen soru, girilen deneme ve net artış medyanını yayımlar.",
            },
            {
              label: "İletişim ayarını kaydet",
              where: "Formun altı",
              does: "Tüm iletişim ve sosyal ayarlarını kaydeder; anında yayına geçer.",
            },
          ],
        },
        {
          kind: "note",
          text: "Şeffaflık sayaçları yalnız çalışma hacmini gösterir: toplam soru, deneme ve net artışının medyanı. Öğrenci sayısı ve kontenjan bu sayaçlarda da asla gösterilmez — gösterilen sayılar politikası (11. bölüm) burada da geçerlidir.",
        },
      ],
    },
    {
      id: "site-icerik",
      no: 13,
      chapter: "Site",
      title: "Yorumlar, paketler, kaynaklar ve SSS",
      lead: "Ana sayfa, fiyatlar, başarılar ve SSS sayfalarını besleyen içerikler dört sekmeden yönetilir; her kayıt anında yayına yansır.",
      where: "/koc/site",
      keywords: ["yorum", "paket", "fiyat", "sss", "kaynak", "vitrin", "izin"],
      blocks: [
        {
          kind: "para",
          text: "Dört sekme de aynı düzenle çalışır: listede her kaydın yanında “Sitede” / “Gizli” rozeti, kalem (düzenle) ve çöp (sil) simgeleri var; ekleme ve düzenleme diyalog içinde yapılır, “Kaydet” ile yayımlanır. “Sıra” alanında küçük sayı önce görünür; bir kaydı silmek yerine “Sitede görünsün” işaretini kaldırarak gizlemek çoğu zaman daha güvenlidir.",
        },
        {
          kind: "steps",
          title: "İçerik güncelleme",
          items: [
            "Yorumlar: sitede ad + soyadın ilk harfini kullan (ör. “Merve K.”); derece vitrini için sonuç belgesi ve varsa tavsiye videosu ekle.",
            "Paketler: fiyatı ₺ olarak gir — sistem kuruş cinsinden saklar; özellikleri her satıra bir madde yaz.",
            "Kaynaklar: /kaynaklar dizinini besler; yalnız resmî kurumlara (MEB, ÖSYM, YÖK) bağlantı ver, kırılan adresi buradan deploy'suz düzelt.",
            "SSS: /sss sayfası ve ana sayfa SSS bölümü buradan beslenir; koda yeni hazır soru eklendiyse “Eksik hazır soruları ekle” yalnız eksikleri getirir, mevcut cevapları ezmez.",
          ],
        },
        {
          kind: "buttons",
          rows: [
            {
              label: "Yorum ekle",
              where: "Yorumlar sekmesi",
              does: "Yeni öğrenci yorumu için düzenleme diyaloğunu açar.",
            },
            {
              label: "Öğrenci yayın izni verdi",
              where: "Yorum diyaloğu → Derece vitrini",
              does: "Yayın iznini işaretler; işaretlenmeden vitrin seçeneği kilitli kalır.",
            },
            {
              label: '"Derece yapan öğrencilerimiz" bölümünde göster',
              where: "Yorum diyaloğu → Derece vitrini",
              does: "Yorumu ana sayfadaki derece vitrinine taşır (yalnız izin işaretliyken).",
            },
            {
              label: "Paket ekle",
              where: "Paketler sekmesi",
              does: "Yeni fiyat paketi diyaloğunu açar; fiyat ₺ girilir, kuruş saklanır.",
            },
            {
              label: "Kaynak ekle",
              where: "Kaynaklar sekmesi",
              does: "/kaynaklar dizinine yeni bağlantı ekler.",
            },
            {
              label: "Hazır listeyi yükle",
              where: "Kaynaklar sekmesi (liste boşken)",
              does: "Koddaki hazır resmî kaynak listesini tek seferde ekler.",
            },
            {
              label: "Soru ekle",
              where: "SSS sekmesi",
              does: "Yeni SSS sorusu diyaloğunu açar.",
            },
            {
              label: "Eksik hazır soruları ekle",
              where: "SSS sekmesi",
              does: "Kodda tanımlı olup sitede olmayan hazır soruları ekler; mevcut cevapları değiştirmez.",
            },
          ],
        },
        {
          kind: "warning",
          text: "Sonuç belgesi ve sıralama kişisel veridir: “Öğrenci yayın izni verdi” işaretlenmeden yorum vitrine çıkamaz — sistem bunu zorlar ama izni gerçekten almış olmak senin sorumluluğun. Belge görselini yüklemeden önce TC kimlik numarası gibi alanları mutlaka kırp.",
        },
        {
          kind: "note",
          text: "Sildiğin kayıt geri gelmez; mevsimlik içerik (kampanya paketi, dönemlik yorum) için silmek yerine “Sitede görünsün” işaretini kaldır. Kayıt listede kalır, sırası ve içeriği korunur.",
        },
      ],
    },

    /* ————————————————————— Rutin ————————————————————— */
    {
      id: "yonetici-rutini",
      no: 14,
      chapter: "Rutin",
      title: "Haftalık ve aylık yönetici rutini",
      lead: "Yönetici işlerinin çoğu birikince pahalılaşır; kısa bir haftalık tur ve ay başı para turuyla hepsi kontrol altında kalır.",
      keywords: ["rutin", "haftalık", "aylık", "kontrol listesi", "checklist"],
      blocks: [
        {
          kind: "para",
          text: "Koçluk tarafının günlük ritmini koçlar taşır; yönetici rutini daha seyrek ama daha kritiktir. Haftalık tur talebi ve kadroyu temiz tutar, ay başı turu parayı kapatır. Aşağıdaki tablo neyi ne zaman kontrol edeceğini tek bakışta verir.",
        },
        {
          kind: "steps",
          title: "Önerilen ritim",
          items: [
            "Haftada bir (ör. pazartesi sabahı): başvurular, gecikmiş ödemeler, atanmamış öğrenciler ve bekleme listesi turu — 10 dakika.",
            "Ay başında: “Otomatik faturalar” + banka ekstresi mutabakatı — para turu.",
            "Dönem geçişlerinde: /koc/site → Dönem durumunu ve gösterilen sayıları güncelle.",
            "Uyarı paneli gördüğünde (yinelenen kayıtlar) bekletme — sorun büyümeden birleştir.",
          ],
        },
        {
          kind: "table",
          title: "Kontrol listesi",
          head: ["Sıklık", "Kontrol", "Nerede"],
          rows: [
            [
              "Haftada 1",
              "Bekleyen koç başvuruları (Yeni filtresi)",
              "/koc/basvurular",
            ],
            [
              "Haftada 1",
              "Gecikmiş ödemeler ve bekleyen ödeme bildirimleri",
              "/koc/muhasebe",
            ],
            [
              "Haftada 1",
              "Atanmamış öğrenciler (Koça göre → Atanmamış çipi)",
              "/koc/ogrenciler",
            ],
            [
              "Haftada 1",
              "Bekleme listesi kuyruğu ve sıcak tutma mesajları",
              "/koc/bekleme",
            ],
            [
              "Ayda 1 (ay başı)",
              "“Otomatik faturalar” düğmesi + kesilen faturaların kontrolü",
              "/koc/muhasebe",
            ],
            ["Ayda 1", "Banka ekstresi mutabakatı", "/koc/muhasebe/mutabakat"],
            [
              "Ayda 1",
              "Dönem durumu ve gösterilen sayılar hâlâ doğru mu",
              "/koc/site → Dönem",
            ],
            [
              "Gerektikçe",
              "Yinelenen kayıtlar paneli görünüyorsa hemen birleştir",
              "/koc/ogrenciler",
            ],
          ],
        },
        {
          kind: "tip",
          text: "İki sayıyı sıfırda tutmayı hedefle: atanmamış öğrenci sayısı ve yinelenen kayıt sayısı. İkisi de sıfırsa kadro sağlıklı demektir; gerisi takvim işidir.",
        },
        {
          kind: "link",
          href: "/koc/rehber",
          label: "Koçların günlük akışı için koç rehberine bak",
        },
      ],
    },
  ],
};

import Script from "next/script";

/** GTM kapsayıcı kimliği. Env ile ezilebilir (staging/preview'de boş bırakılabilir). */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-P89WBGHG";

/**
 * Google Tag Manager kapsayıcısı — kök layout'ta bir kez basılır.
 *
 * ⚠️ GA4 BU KAPSAYICIYA EKLENMEZ. `G-4M2KCVFW8T` zaten doğrudan gtag.js ile
 * yükleniyor (`@/components/app/google-analytics`). GTM'e bir "GA4
 * Yapılandırma" etiketi eklenirse aynı sayfa görüntülemesi İKİ KEZ sayılır ve
 * tüm GA4 raporları (kullanıcı, oturum, dönüşüm) şişer. Bu kapsayıcı yalnızca
 * YENİ etiketler içindir: Meta Pixel, Google Ads dönüşümü, Hotjar vb.
 * GA4'ü GTM'e taşımak istenirse önce `<GoogleAnalytics />` kaldırılmalı.
 *
 * `lazyOnload` (afterInteractive DEĞİL): gtm.js en az gtag.js kadar ağır ve
 * mobil bağlantıda tam LCP penceresinde bant genişliği yiyor — gerekçenin
 * tamamı `google-analytics.tsx`te. Etiket window load sonrası, tarayıcı boştayken
 * iner; ölçüm aynı şekilde yapılır, ilk boyamayla yarışmaz.
 *
 * Yan etki: snippet'in `gtm.start` damgası sayfa başı değil, load anıdır.
 * GTM'in kendi sayfa-yüklenme-süresi değişkenleri buna göre kayar; etiketlerin
 * tetiklenmesi etkilenmez. Tag Assistant / Önizleme kipi de çalışır, yalnız
 * kapsayıcı birkaç yüz ms geç bağlanır.
 *
 * Resmî snippet tek IIFE olarak olduğu gibi basılıyor: dataLayer'ı kendisi
 * kurar, `gtm.start`ı kendisi push'lar ve gtm.js'i kendisi enjekte eder —
 * böylece sıralama garanti altında, ayrı bir bootstrap script'i gerekmiyor.
 */
export function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <Script id="gtm-init" strategy="lazyOnload">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

/**
 * GTM'in JS kapalı tarayıcılar için <noscript> iframe'i — açılış <body>
 * etiketinin hemen ardına konur (Google'ın şartı).
 *
 * JS açık tarayıcılarda <noscript> içeriği hiç ayrıştırılmaz, hiç indirilmez:
 * gerçek kullanıcılara maliyeti sıfır, LCP'ye etkisi yok.
 */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}

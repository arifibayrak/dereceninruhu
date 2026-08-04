import Script from "next/script";

/** GA4 ölçüm kimliği. Env ile ezilebilir (staging/preview'de boş bırakılabilir). */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-4M2KCVFW8T";

/**
 * Google tag (gtag.js) — kök layout'ta bir kez basılır, sayfa başına tek etiket.
 *
 * `lazyOnload` (afterInteractive DEĞİL): gtag.js sayfadaki EN BÜYÜK betiktir
 * (~167KB, 67KB'ı kullanılmıyor). `afterInteractive` ile hidrasyonun hemen
 * ardından inmeye başlıyor ve mobil bağlantıda tam da LCP penceresinde bant
 * genişliği yiyordu; ayrıca next/script onun için `<link rel=preload>` basıp
 * yarışı büsbütün kızıştırıyordu. `lazyOnload` etiketi window load sonrasına
 * alır — ölçüm aynı şekilde yapılır, ilk boyamayla yarışmaz.
 *
 * App Router'da rota değişimleri client-side olduğu için sayfa görüntülemeleri
 * gtag'in kendi "enhanced measurement" (history change) özelliğiyle sayılır.
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="gtag-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}

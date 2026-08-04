import Script from "next/script";

/** GA4 ölçüm kimliği. Env ile ezilebilir (staging/preview'de boş bırakılabilir). */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "G-4M2KCVFW8T";

/**
 * Google tag (gtag.js) — kök layout'ta bir kez basılır, sayfa başına tek etiket.
 * `afterInteractive`: sayfa etkileşime hazır olduktan sonra yüklenir, LCP'yi bloklamaz.
 * App Router'da rota değişimleri client-side olduğu için sayfa görüntülemeleri
 * gtag'in kendi "enhanced measurement" (history change) özelliğiyle sayılır.
 */
export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}

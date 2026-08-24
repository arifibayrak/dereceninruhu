import { Suspense } from "react";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsappFabSlot } from "@/components/marketing/whatsapp-fab-slot";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { SOCIAL_FALLBACK } from "@/lib/seo";
import { getSocialUrls } from "@/lib/social";

/**
 * Pazarlama sitesi kabuğu (route group — uygulama chrome'unu miras almaz).
 *
 * Bu layout D1 OKUR (`site_settings`): sosyal bağlantılar yöneticinin
 * `/koc/site` panelinden deploy'suz değiştirebilmesi için DB'de tutuluyor. D1
 * `next build` sırasında BAĞLI DEĞİLDİR, bu yüzden kabuk istek başına render
 * edilmeli → `force-dynamic`.
 *
 * ⚠️ LAYOUT GÖVDESİNDE `await` YOK — BİLEREK. React, layout bileşeni geri
 * dönmeden `children`'a inemez; burada `await getSiteSettings()` beklendiğinde
 * kabuğun 1 D1 sorgusu ile sayfanın 5 paralel sorgusu İKİ SERİ DALGAYA
 * bölünüyordu (TTFB = 2 × D1 RTT). Promise `<Suspense>` sınırlarına geçilince
 * sayfa sorguları anında başlıyor. Yeni bir kabuk verisi eklerken bu deseni
 * bozma: promise'i geçir, `await` etme.
 *
 * Bilinçli ödünleşme: önceden kabuk D1 okumadığı için 4 pazarlama sayfası
 * (/iletisim, /nasil-calisir, /sayac, /koc-basvuru) statik kalabiliyordu;
 * artık onlar da dinamik render ediliyor.
 *
 * Site geneli varlıklar (Organization + WebSite JSON-LD) tüm public
 * sayfalarda bir kez yayınlanır — arama motoru ve LLM'ler markayı çözebilsin.
 */
export const dynamic = "force-dynamic";

/** Organization şeması `sameAs` için çözülmüş bağlantıları bekler. */
async function OrganizationJsonLd() {
  const social = await getSocialUrls();
  return <JsonLd data={[organizationSchema(social), websiteSchema()]} />;
}

async function FooterSlot() {
  return <SiteFooter social={await getSocialUrls()} />;
}

export default function PazarlamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // AWAIT YOK — promise aşağıdaki sınırlara geçiyor (bkz. dosya başı notu).
  const socialPromise = getSocialUrls();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Suspense fallback={null}>
        <OrganizationJsonLd />
      </Suspense>
      <SiteHeader social={socialPromise} />
      <main className="flex-1">{children}</main>
      <Suspense fallback={<SiteFooter social={SOCIAL_FALLBACK} />}>
        <FooterSlot />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsappFabSlot />
      </Suspense>
    </div>
  );
}

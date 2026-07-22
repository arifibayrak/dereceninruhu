import { getSiteSettings } from "@/db/queries/cms";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsappFab } from "@/components/marketing/whatsapp-fab";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { SOCIAL_LINKS } from "@/lib/seo";
import { buildWaLink } from "@/lib/whatsapp";

/**
 * Pazarlama sitesi kabuğu (route group — uygulama chrome'unu miras almaz).
 *
 * Bu layout ARTIK D1 OKUR (`site_settings`): yüzen WhatsApp butonunun numarası
 * ve sosyal bağlantılar yöneticinin `/koc/site` panelinden deploy'suz
 * değiştirebilmesi için DB'de tutuluyor. D1 `next build` sırasında BAĞLI
 * DEĞİLDİR, bu yüzden kabuk istek başına render edilmeli → `force-dynamic`.
 *
 * Bilinçli ödünleşme: önceden kabuk D1 okumadığı için 4 pazarlama sayfası
 * (/iletisim, /nasil-calisir, /sayac, /koc-basvuru) statik kalabiliyordu;
 * artık onlar da dinamik render ediliyor. Cloudflare Workers'ta her istek
 * zaten Worker'dan geçtiğinden ek maliyet tek bir D1 singleton okumasıdır ve
 * `getSiteSettings()` `cache()` ile sarılı olduğu için istek başına bir kez
 * çalışır. Diğer 13 pazarlama sayfası zaten `force-dynamic` idi.
 *
 * Site geneli varlıklar (Organization + WebSite JSON-LD) tüm public
 * sayfalarda bir kez yayınlanır — arama motoru ve LLM'ler markayı çözebilsin.
 */
export const dynamic = "force-dynamic";

export default async function PazarlamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSiteSettings();

  // DB boşsa `@/lib/seo` sabitine düş — site seed'siz de eksiksiz görünür.
  const social = {
    instagram: site.instagramUrl || SOCIAL_LINKS.instagram,
    tiktok: site.tiktokUrl || SOCIAL_LINKS.tiktok,
    youtube: site.youtubeUrl || SOCIAL_LINKS.youtube,
  };
  const waHref =
    site.whatsappVisible && site.whatsappPhone
      ? buildWaLink(site.whatsappPhone, site.whatsappMessage)
      : null;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <JsonLd data={[organizationSchema(social), websiteSchema()]} />
      <SiteHeader social={social} />
      <main className="flex-1">{children}</main>
      <SiteFooter social={social} />
      {waHref && <WhatsappFab href={waHref} />}
    </div>
  );
}

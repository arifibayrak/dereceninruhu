import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

/**
 * Pazarlama sitesi kabuğu (route group — uygulama chrome'unu miras almaz).
 * Bu layout D1 OKUMAZ; statik sayfalar (nasıl-çalışır, iletişim) statik
 * kalabilsin diye `dynamic` burada bildirilmez — D1 okuyan her sayfa kendi
 * `force-dynamic`'ini bildirir (bkz. AGENTS.md).
 */
export default function PazarlamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

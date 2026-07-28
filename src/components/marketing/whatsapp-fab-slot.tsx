import { WhatsappFab } from "@/components/marketing/whatsapp-fab";
import { getPublicCoach, getSiteSettings } from "@/db/queries/cms";
import { buildWaLink, DEFAULT_WA_PHONE } from "@/lib/whatsapp";

/**
 * Yüzen WhatsApp butonunun veri tarafı — tek yerde toplandı çünkü buton üç ayrı
 * kabuktan mount ediliyor: `(pazarlama)` layout'u, `/giris` ve `/katil`.
 *
 * `/ogrenci` ve `/koc`'a BİLEREK eklenmedi: oralarda `FloatingAssistant` zaten
 * `fixed bottom-6 right-6 z-50`'de oturuyor, üst üste binerdi.
 *
 * Numara `site_settings`'ten gelir, boşsa `DEFAULT_WA_PHONE`'a düşer. Tek kapatma
 * anahtarı `whatsappVisible`. Fotoğraf ve ad öne çıkan koçtan (`sort_order` en
 * düşük = Ahmet Hakan) okunur; her iki sorgu da `cache()`'li, istek başına bir kez.
 */
export async function WhatsappFabSlot() {
  const [site, coach] = await Promise.all([getSiteSettings(), getPublicCoach()]);
  if (!site.whatsappVisible) return null;

  const href = buildWaLink(
    site.whatsappPhone || DEFAULT_WA_PHONE,
    site.whatsappMessage,
  );

  return (
    <WhatsappFab
      href={href}
      name={coach.displayName}
      photoUrl={coach.photoUrl}
    />
  );
}

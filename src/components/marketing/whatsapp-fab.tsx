import { WhatsappIcon } from "@/components/brand/social-icons";
import { cn } from "@/lib/utils";

/**
 * Yüzen WhatsApp butonu — public sitenin sağ alt köşesi.
 *
 * Kurucu koçun yuvarlak fotoğrafı + köşesinde yeşil WhatsApp rozeti: tek tıkla
 * `wa.me`'ye gider. Fotoğraf "karşında gerçek bir insan var" sinyali, rozet ne
 * olduğunu anlatır — ikisi tek hedef, ayrı buton değil.
 *
 * Sunucu bileşeni: sayfa açılır açılmaz görünür (eskiden ilk 120px kaydırılana
 * kadar gizleyen bir scroll dinleyicisi vardı, "hep görünsün" kararıyla kalktı).
 * Geriye JS gerektiren hiçbir şey kalmadığı için `"use client"` de kalktı —
 * hover etiketi saf CSS (`group-hover`).
 *
 * Otomatik gönderim yok: kullanıcı WhatsApp'a hazır mesajla düşer, göndermeye
 * kendisi karar verir.
 */
export function WhatsappFab({
  href,
  name,
  photoUrl,
  label,
}: {
  href: string;
  /** Koçun adı — erişilebilir etiket ve fotoğraf yüklenmezse baş harfler. */
  name: string;
  photoUrl?: string | null;
  label?: string;
}) {
  const text = label ?? `${name}'a WhatsApp'tan yaz`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${text} (yeni sekmede WhatsApp'ta açılır)`}
      className={cn(
        // Public sitede alt gezinme çubuğu yok → sağ-alt köşe serbest.
        // (/ogrenci ve /koc'ta FloatingAssistant burada oturuyor; bu buton
        // oralara mount EDİLMEZ.)
        "group fixed right-4 bottom-4 z-50 flex items-center gap-2.5",
        "focus-visible:outline-none sm:right-6 sm:bottom-6",
      )}
    >
      {/* Yalnız görsel: ad zaten aria-label'da geçiyor, iki kez okunmasın. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none hidden rounded-full bg-card px-3 py-1.5 text-sm font-medium text-card-foreground",
          "opacity-0 shadow-md ring-1 ring-foreground/10 transition-opacity duration-200",
          "group-hover:opacity-100 group-focus-visible:opacity-100",
          "motion-reduce:transition-none sm:block",
        )}
      >
        {text}
      </span>

      <span
        className={cn(
          "relative shrink-0 rounded-full transition-transform duration-200",
          "group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none",
          "group-focus-visible:ring-2 group-focus-visible:ring-[#25D366] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
        )}
      >
        {photoUrl ? (
          // Bilerek düz <img>: `@/components/ui/avatar` (base-ui) görseli ancak
          // hydration'dan sonra takıyor, yani buton ilk boyamada baş harflerle
          // çıkıyordu. Butonun tüm amacı gerçek bir yüz göstermek olduğu için
          // görsel SSR HTML'inde hazır gelsin istiyoruz. next/image de değil:
          // sabit 56px'lik public varlığı, optimizasyona değmez.
          // eslint-disable-next-line @next/next/no-img-element -- bilinçli tercih, yukarı bak
          <img
            src={photoUrl}
            alt=""
            width={56}
            height={56}
            decoding="async"
            fetchPriority="low"
            className="size-14 rounded-full object-cover shadow-lg shadow-black/25 ring-2 ring-background"
          />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-black/25 ring-2 ring-background">
            {initials(name)}
          </span>
        )}
        <span
          aria-hidden
          className="absolute -right-0.5 -bottom-0.5 inline-flex size-6 items-center justify-center rounded-full bg-[#25D366] text-[#04310f] ring-2 ring-background"
        >
          <WhatsappIcon className="size-4" />
        </span>
      </span>
    </a>
  );
}

/** "Ahmet Hakan Almak" → "AA". Fotoğraf yüklenemezse rozetin altında durur. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toLocaleUpperCase("tr-TR");
}

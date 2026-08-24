import { cn } from "@/lib/utils";

/** "Ahmet Hakan Almak" → "AH". Türkçe büyütme (i → İ). */
function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toLocaleUpperCase("tr-TR"))
    .join("");
}

/**
 * Koç avatarı — SUNUCU bileşeni, düz `<img>`.
 *
 * `@/components/ui/avatar` (base-ui) BİLEREK kullanılmıyor: `AvatarImage` bir
 * client bileşeni ve `src`'yi ancak hydration'dan SONRA takıyor, yani fotoğraf
 * SSR HTML'inde HİÇ yer almıyordu. Bu bir GEO/SEO sorunu: Googlebot JS
 * çalıştırdığı için yakalayabilir ama GPTBot/ClaudeBot/PerplexityBot genelde
 * çalıştırmaz — koç sayfalarını görselsiz görüyorlardı. Google Görseller de
 * güvenilir indeksleyemiyordu. (Aynı gerekçe `marketing/whatsapp-fab.tsx`'te.)
 *
 * `next/image` de değil: bunlar `public/` altında zaten 320px'e indirilmiş
 * sabit varlıklar, en büyük render 112px. Workers'ta `/_next/image` bedava
 * değil ve burada kazandıracağı bir şey yok.
 */
export function CoachAvatar({
  photoUrl,
  name,
  className,
  fallbackClassName,
  priority = false,
}: {
  photoUrl?: string | null;
  name: string;
  /** Kök boyut + ring sınıfları (ör. "size-24 ring-2 ring-primary/25"). */
  className?: string;
  fallbackClassName?: string;
  /** Katlamanın üstündeyse `true` — lazy yükleme LCP'yi geciktirmesin. */
  priority?: boolean;
}) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 rounded-full select-none",
        "after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
        className,
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- bilinçli tercih, yukarı bak
        <img
          src={photoUrl}
          alt={name}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="aspect-square size-full rounded-full object-cover"
        />
      ) : (
        <span
          data-slot="avatar-fallback"
          className={cn(
            "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground",
            fallbackClassName,
          )}
        >
          {initialsOf(name)}
        </span>
      )}
    </span>
  );
}

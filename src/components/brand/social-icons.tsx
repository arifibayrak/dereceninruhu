import { cn } from "@/lib/utils";

/**
 * Marka (sosyal platform) ikonları — inline SVG.
 *
 * Lucide v1 marka ikonlarını (Instagram/YouTube/…) kaldırdı; TikTok ve
 * WhatsApp zaten hiç yoktu. Bu yüzden dört ikon burada elde tutuluyor.
 * API yüzeyi lucide ile aynı: `className` ile `size-*` verilir, renk
 * `currentColor`'dan gelir. Sunucu bileşeni — hook yok.
 */

type IconProps = { className?: string };

const base = "shrink-0";

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn(base, className)}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn(base, className)}
    >
      <path d="M16.5 2h-2.7v13.1a2.5 2.5 0 1 1-2.1-2.47V9.9a5.6 5.6 0 1 0 4.8 5.54V8.9a6.6 6.6 0 0 0 3.9 1.26V7.4a3.9 3.9 0 0 1-3.9-3.9V2Z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn(base, className)}
    >
      <rect x="2" y="5" width="20" height="14" rx="4.5" />
      <path d="M10.2 9.3v5.4l4.6-2.7-4.6-2.7Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsappIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn(base, className)}
    >
      <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.34-1.4a9.83 9.83 0 0 0 4.7 1.2h.01c5.43 0 9.85-4.42 9.85-9.86 0-2.63-1.02-5.11-2.88-6.97A9.79 9.79 0 0 0 12.04 2Zm0 1.85c2.14 0 4.15.84 5.67 2.35a7.96 7.96 0 0 1 2.35 5.66c0 4.42-3.6 8.01-8.02 8.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.02 8.02 0 0 1-1.23-4.28c0-4.42 3.6-8.01 8.02-8.01Zm-3.06 4.3c-.16-.36-.33-.37-.48-.38h-.4c-.15 0-.38.05-.58.28-.2.22-.76.74-.76 1.8s.78 2.09.89 2.23c.11.15 1.5 2.4 3.71 3.28 1.83.72 2.2.58 2.6.54.4-.04 1.28-.52 1.46-1.03.18-.5.18-.94.13-1.03-.06-.09-.2-.15-.43-.26-.22-.11-1.28-.63-1.48-.7-.2-.08-.34-.11-.48.1-.15.22-.56.7-.68.85-.13.15-.25.16-.47.06-.22-.12-.94-.35-1.79-1.11a6.7 6.7 0 0 1-1.23-1.54c-.13-.22-.02-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.08-.15.04-.28-.02-.39-.05-.11-.48-1.18-.66-1.61Z" />
    </svg>
  );
}

/** Kabuk (layout) tarafından çözülmüş sosyal profil URL'leri. */
export type SocialUrls = {
  instagram: string;
  tiktok: string;
  youtube: string;
};

export type SocialLink = {
  label: string;
  href: string;
  Icon: (props: IconProps) => React.ReactElement;
};

/**
 * Çözülmüş URL'leri render edilebilir bağlantı listesine çevirir; boş olanlar
 * elenir. Fallback mantığı kabukta (`(pazarlama)/layout.tsx`) çalışır — DB
 * değeri yoksa `@/lib/seo` içindeki SOCIAL_LINKS sabiti kullanılır.
 */
export function socialLinksOf(urls: SocialUrls): SocialLink[] {
  return (
    [
      { label: "Instagram", href: urls.instagram, Icon: InstagramIcon },
      { label: "TikTok", href: urls.tiktok, Icon: TiktokIcon },
      { label: "YouTube", href: urls.youtube, Icon: YoutubeIcon },
    ] satisfies SocialLink[]
  ).filter((l) => l.href.trim().length > 0);
}

/**
 * Sosyal ikon sırası — header ve footer aynı bileşeni kullanır (tek kaynak).
 * Dokunma hedefi 40px; tümü yeni sekmede açılır.
 */
export function SocialIconRow({
  urls,
  className,
}: {
  urls: SocialUrls;
  className?: string;
}) {
  const links = socialLinksOf(urls);
  if (links.length === 0) return null;
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label} (yeni sekmede açılır)`}
          className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon className="size-5" />
        </a>
      ))}
    </div>
  );
}

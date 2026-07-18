import { cn } from "@/lib/utils";

/**
 * Derecenin Ruhu — marka işareti.
 *
 * Hikaye: yükselen üç net çubuğu, en yükseğinin ucunda derecenin altın
 * kıvılcımı ("ruh"). Rozet, marka çividinin (indigo) degradesi.
 * Sunucu bileşeni — hook yok, her yerde kullanılabilir.
 */

type LogoMarkProps = {
  /** Kenar uzunluğu (px). */
  size?: number;
  className?: string;
};

export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Derecenin Ruhu"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient
          id="dr-badge"
          x1="0"
          y1="0"
          x2="48"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#6f46ea" />
          <stop offset="1" stopColor="#47219f" />
        </linearGradient>
        <linearGradient
          id="dr-sheen"
          x1="24"
          y1="0"
          x2="24"
          y2="24"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Rozet */}
      <rect width="48" height="48" rx="12" fill="url(#dr-badge)" />
      <rect width="48" height="48" rx="12" fill="url(#dr-sheen)" />
      {/* Yükselen netler */}
      <rect x="12" y="28" width="6" height="10" rx="3" fill="#ffffff" fillOpacity="0.38" />
      <rect x="21" y="22" width="6" height="16" rx="3" fill="#ffffff" fillOpacity="0.62" />
      <rect x="30" y="15" width="6" height="23" rx="3" fill="#ffffff" />
      {/* Derecenin ruhu — altın kıvılcım */}
      <path
        d="M33 4.5C33.85 7.9 34.9 8.95 38.5 9.5C34.9 10.05 33.85 11.1 33 14.5C32.15 11.1 31.1 10.05 27.5 9.5C31.1 8.95 32.15 7.9 33 4.5Z"
        fill="#f2c14e"
      />
    </svg>
  );
}

type LogoProps = {
  /** full = işaret + yazı, mark = yalnız işaret, wordmark = yalnız yazı. */
  variant?: "full" | "mark" | "wordmark";
  /**
   * inverse: koyu çivit zeminler için (yazı beyaz, "Ruhu" altın).
   * default: tema tokenlarını izler (açık + koyu modda çalışır).
   */
  tone?: "default" | "inverse";
  /** İşaretin kenar uzunluğu (px); yazı boyutu buna göre ölçeklenir. */
  size?: number;
  className?: string;
};

export function Logo({
  variant = "full",
  tone = "default",
  size = 32,
  className,
}: LogoProps) {
  if (variant === "mark") {
    return <LogoMark size={size} className={className} />;
  }

  const wordmark = (
    <span
      className="font-heading leading-none font-bold tracking-tight whitespace-nowrap"
      style={{ fontSize: Math.round(size * 0.56) }}
    >
      <span className={tone === "inverse" ? "text-white" : "text-foreground"}>
        Derecenin{" "}
      </span>
      <span className={tone === "inverse" ? "text-gold" : "text-primary"}>
        Ruhu
      </span>
    </span>
  );

  if (variant === "wordmark") {
    return <span className={cn("inline-flex", className)}>{wordmark}</span>;
  }

  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ gap: Math.round(size * 0.3) }}
    >
      <LogoMark size={size} />
      {wordmark}
    </span>
  );
}

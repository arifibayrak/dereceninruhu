"use client";

import { RouteIcon } from "lucide-react";

import { startTour, type TourId } from "@/lib/rehber/tour-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Turu başlatan düğme. Ayrı bir sayfaya gitmez — turu panelin üstünde açar,
 * ilk adımın sekmesine gider ve açıklama kartını gösterir.
 */
export function TourLauncher({
  tourId,
  label = "Paneli tanı",
  variant = "outline",
  className,
}: {
  tourId: TourId;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      className={cn(className)}
      onClick={() => startTour(tourId)}
    >
      <RouteIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}

/**
 * Başlıkta duran ikon düğmesi — tur her ekrandan başlatılabilsin diye.
 * Kartlar sayfanın altında kalabiliyor; buraya bakan herkes bulur.
 */
export function TourLauncherIcon({ tourId }: { tourId: TourId }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Tanıtım turunu başlat"
      title="Tanıtım turunu başlat"
      onClick={() => startTour(tourId)}
    >
      <RouteIcon />
    </Button>
  );
}

/** Kart görünümlü başlatıcı — öğrenci Bugün ekranındaki liste kartlarına uyar. */
export function TourLauncherCard({
  tourId,
  title,
  description,
}: {
  tourId: TourId;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => startTour(tourId)}
      className="flex w-full items-center gap-3 rounded-xl bg-card p-3.5 text-left ring-1 ring-foreground/10 hover:ring-foreground/20"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15">
        <RouteIcon className="size-4 text-gold" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

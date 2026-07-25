import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, RouteIcon } from "lucide-react";

import type { Tour } from "@/lib/rehber/tur-types";
import { Button } from "@/components/ui/button";
import { TourPlayer } from "@/components/rehber/tour-player";

/** Tur sayfası kabuğu — başlık, oynatıcı ve diğer rehber yüzeylerine köprü. */
/** `?adim=N` → 0 tabanlı adım indeksi. Geçersizse başa döner. */
export function parseStepParam(raw: unknown, total: number): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isInteger(n) || n < 1 || n > total) return 0;
  return n - 1;
}

export function TourPage({
  tour,
  flowHref,
  extra,
  initialStep = 0,
  shell = "koc",
}: {
  tour: Tour;
  /** Akış sayfası — turdan sonra bakılacak ikinci yüzey. */
  flowHref: string;
  /** Yöneticiye gösterilen ek bağlantı gibi isteğe bağlı içerik. */
  extra?: React.ReactNode;
  initialStep?: number;
  /** Hangi kabukta render ediliyor — yapışkan şeridin alt konumunu belirler. */
  shell?: "ogrenci" | "koc";
}) {
  // Öğrenci kabuğunda altta `fixed z-40` gezinme çubuğu (min-h-14 + safe-area)
  // var; şerit onun üstünde durmalı, yoksa arkasında kalıp görünmez oluyor.
  const bottomClass =
    shell === "ogrenci"
      ? "bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
      : "bottom-0";
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Tur
        </span>
        <h1 className="font-heading text-headline text-balance">
          {tour.title}
        </h1>
        <p className="max-w-prose text-sm text-pretty text-muted-foreground md:text-base">
          {tour.subtitle}
        </p>
      </header>

      {extra}

      <TourPlayer
        tour={tour}
        initialStep={initialStep}
        bottomClass={bottomClass}
      />

      <div className="flex flex-wrap gap-2 border-t pt-5">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={tour.guideBase} />}
        >
          <BookOpenIcon data-icon="inline-start" />
          Rehber — ekran ekran ayrıntı
        </Button>
        <Button variant="outline" size="sm" render={<Link href={flowHref} />}>
          <RouteIcon data-icon="inline-start" />
          Akış — baştan sona sıra
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

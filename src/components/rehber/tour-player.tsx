"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LightbulbIcon,
  ListIcon,
} from "lucide-react";

import type { Tour } from "@/lib/rehber/tur-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Ürün turu oynatıcısı.
 *
 * Rehber ara-bul-oku, akış sırayı anlatır; tur ise paneli baştan sona
 * gezdiren bir sunum. Tek adım ekranda durur, ok tuşlarıyla ilerlenir.
 * Adım numarası adres çubuğuna yazılır (`?adim=5`) — link paylaşılabilir ve
 * yenilendiğinde aynı adımda kalır.
 */
export function TourPlayer({
  tour,
  initialStep = 0,
  bottomClass = "bottom-0",
}: {
  tour: Tour;
  /**
   * Açılış adımı (0 tabanlı). `?adim=` sunucuda okunup buraya geçirilir —
   * efekt içinde setState yapılsaydı hem lint kuralı kırılır hem de ilk kare
   * yanlış adımda basılırdı.
   */
  initialStep?: number;
  /**
   * Yapışkan gezinme şeridinin alt konumu. Öğrenci kabuğunda ekranın altında
   * `fixed z-40` bir gezinme çubuğu var; şerit `bottom-0` bırakılırsa onun
   * arkasında kalıp görünmez oluyor.
   */
  bottomClass?: string;
}) {
  const [index, setIndex] = React.useState(initialStep);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const total = tour.steps.length;
  const step = tour.steps[index];

  const go = React.useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      setIndex(clamped);
      // router.replace kullanma: force-dynamic rotada tüm RSC yükünü yeniden çeker.
      const url = new URL(window.location.href);
      url.searchParams.set("adim", String(clamped + 1));
      window.history.replaceState(null, "", url);
      window.scrollTo({ top: 0 });
    },
    [total],
  );

  // Ok tuşlarıyla gezinme — input içindeyken devre dışı.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (el?.isContentEditable) return;
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Üst şerit: sayaç, ilerleme, adım listesi */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={<Button variant="ghost" size="sm" className="shrink-0" />}
            >
              <ListIcon data-icon="inline-start" />
              Adımlar
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm">
              <SheetHeader>
                <SheetTitle>{tour.title}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-0.5 overflow-y-auto px-4 pb-6">
                {tour.steps.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      go(i);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                      i === index
                        ? "bg-secondary font-medium text-secondary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className="w-5 shrink-0 text-[11px] tabular-nums opacity-60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  </button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* İlerleme çubuğu — her adım bir dilim */}
        <div className="flex gap-1" aria-hidden>
          {tour.steps.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= index ? "bg-gold" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Adım gövdesi */}
      <article className="flex min-h-[26rem] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-4xl bg-primary/12 px-2.5 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/25">
            {step.nav}
          </span>
          <h2 className="font-heading text-headline text-balance">
            {step.title}
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground md:text-base">
            {step.purpose}
          </p>
        </div>

        {step.highlights.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Bu ekranda ne var
            </h3>
            <ul className="flex flex-col divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
              {step.highlights.map((h) => (
                <li
                  key={h.label}
                  className="@container grid gap-1 px-4 py-3 @xl:grid-cols-[minmax(8rem,11rem)_1fr] @xl:gap-5"
                >
                  <span className="text-sm font-medium">{h.label}</span>
                  <span className="text-sm leading-relaxed text-pretty text-muted-foreground">
                    {h.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step.buttons && step.buttons.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              En çok kullandığın butonlar
            </h3>
            <ul className="flex flex-col gap-1.5 rounded-2xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              {step.buttons.map((b) => (
                <li
                  key={b.label}
                  className="flex flex-wrap items-baseline gap-2"
                >
                  <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.72rem] font-medium text-secondary-foreground">
                    {b.label}
                  </span>
                  <span className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground">
                    {b.does}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step.tip && (
          <p className="flex gap-3 rounded-2xl bg-success/8 px-4 py-3 text-sm leading-relaxed text-pretty ring-1 ring-success/25">
            <LightbulbIcon
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-success"
            />
            <span>{step.tip}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {step.route && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={step.route} />}
            >
              Ekranı aç
              <ArrowUpRightIcon data-icon="inline-end" />
            </Button>
          )}
          {step.section && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              render={<Link href={`${tour.guideBase}#bolum-${step.section}`} />}
            >
              Rehberde ayrıntısı
            </Button>
          )}
        </div>
      </article>

      {/* Alt gezinme */}
      <div
        className={cn(
          "sticky z-30 -mx-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6",
          bottomClass,
        )}
      >
        <Button
          variant="outline"
          size="sm"
          disabled={isFirst}
          onClick={() => go(index - 1)}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Geri
        </Button>

        <span className="hidden text-xs text-muted-foreground sm:block">
          ← → tuşlarıyla da gezinebilirsin
        </span>

        {isLast ? (
          <Button size="sm" render={<Link href={tour.guideBase} />}>
            Rehbere geç
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => go(index + 1)}>
            İleri
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}

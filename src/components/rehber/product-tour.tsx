"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";

import type { Tour, TourStep } from "@/lib/rehber/tur-types";
import {
  getTourServerSnapshot,
  getTourSnapshot,
  goToStep,
  stopTour,
  subscribeTour,
  type TourId,
} from "@/lib/rehber/tour-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Tur metni yalnız tur başlatıldığında indirilir. Statik import edilseydi
 * ~70 KB içerik her /koc ve /ogrenci sayfasının paketine girerdi.
 */
async function loadTour(id: TourId): Promise<Tour> {
  if (id === "koc") return (await import("@/lib/rehber/tur-koc")).kocTuru;
  if (id === "yonetici")
    return (await import("@/lib/rehber/tur-yonetici")).yoneticiTuru;
  return (await import("@/lib/rehber/tur-ogrenci")).ogrenciTuru;
}

/**
 * Adımın rotasına karşılık gelen gezinme öğesini bulur.
 *
 * Üç aşama: birebir eşleşme → en uzun önek (ör. `/koc/ogrenciler/yeni` için
 * "Öğrenciler" sekmesi) → açılır grup tetikleyicisi (Talepler, İçerik,
 * Ayarlar altındaki sayfaların kendi sekmesi yok).
 */
function findNavTarget(route: string): Element | null {
  const exact = document.querySelector(`[data-tour-nav="${route}"]`);
  if (exact) return exact;

  let best: { el: Element; len: number } | null = null;
  for (const el of document.querySelectorAll("[data-tour-nav]")) {
    const href = el.getAttribute("data-tour-nav");
    if (!href || href === "/koc" || href === "/ogrenci") continue;
    if (route.startsWith(href) && (!best || href.length > best.len)) {
      best = { el, len: href.length };
    }
  }
  if (best) return best.el;

  for (const el of document.querySelectorAll("[data-tour-nav-group]")) {
    const hrefs = el.getAttribute("data-tour-nav-group")?.split(" ") ?? [];
    if (hrefs.some((h) => h && route.startsWith(h))) return el;
  }
  return null;
}

/** Adımın hedef sekmesini ekranda bulup çevresine halka çizer. */
function useSpotlight(route: string | undefined, enabled: boolean) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useEffect(() => {
    if (!enabled || !route) return;

    let frame = 0;
    const measure = () =>
      setRect(findNavTarget(route)?.getBoundingClientRect() ?? null);
    // Gezinme sonrası hedef biraz geç boyanabiliyor; birkaç kare dene.
    // İlk ölçüm de kare içinde: efekt gövdesinde doğrudan setState yapmayalım.
    const tick = (n: number) => {
      measure();
      if (n > 0) frame = requestAnimationFrame(() => tick(n - 1));
    };
    frame = requestAnimationFrame(() => tick(8));

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [route, enabled]);

  // Kapalıyken eski ölçüm ekranda kalmasın — durum temizlemek yerine türet.
  return enabled && route ? rect : null;
}

function StepCard({
  tour,
  step,
  index,
  onPrev,
  onNext,
  onExit,
}: {
  tour: Tour;
  step: TourStep;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const total = tour.steps.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div
      role="dialog"
      aria-label={`Tur adımı ${index + 1}/${total}: ${step.title}`}
      className="pointer-events-auto flex w-full flex-col gap-3 rounded-2xl border bg-popover/98 p-4 shadow-2xl backdrop-blur sm:max-w-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-primary uppercase tabular-nums">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")} · {step.nav}
          </span>
          <h2 className="font-heading text-base leading-snug font-medium text-balance">
            {step.title}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Turdan çık"
          title="Turdan çık (Esc)"
          onClick={onExit}
          className="shrink-0"
        >
          <XIcon />
        </Button>
      </div>

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

      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
        {step.purpose}
      </p>

      {step.highlights.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {step.highlights.slice(0, 3).map((h) => (
            <li key={h.label} className="flex gap-2 text-xs leading-relaxed">
              <span
                aria-hidden
                className="mt-1.5 size-1 shrink-0 rounded-full bg-gold"
              />
              <span>
                <span className="font-medium text-foreground">{h.label}: </span>
                <span className="text-muted-foreground">{h.text}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {step.buttons && step.buttons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {step.buttons.slice(0, 4).map((b) => (
            <span
              key={b.label}
              title={b.does}
              className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[0.7rem] font-medium text-secondary-foreground"
            >
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <Button
          variant="ghost"
          size="sm"
          disabled={isFirst}
          onClick={onPrev}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Geri
        </Button>
        <Button size="sm" onClick={isLast ? onExit : onNext}>
          {isLast ? "Turu bitir" : "İleri"}
          {!isLast && <ChevronRightIcon data-icon="inline-end" />}
        </Button>
      </div>
    </div>
  );
}

/**
 * Uygulama içi ürün turu.
 *
 * Ayrı bir anlatım sayfası değil: adım değiştikçe gerçek sekmeye gider,
 * o sekmeyi halkayla işaretler ve ekranın üstünde açıklama kartı gösterir.
 * Her iki kabuğun yerleşiminde durur, bu yüzden gezinme sırasında yaşamaya
 * devam eder.
 */
export function ProductTour() {
  const router = useRouter();
  const pathname = usePathname();
  const active = React.useSyncExternalStore(
    subscribeTour,
    getTourSnapshot,
    getTourServerSnapshot,
  );

  // Yüklenen turu kimliğiyle birlikte tut; hangi turun yüklendiğini bilmeden
  // durum temizlemek gerekirdi, bu da efekt içinde setState demek olurdu.
  const [loaded, setLoaded] = React.useState<{ id: TourId; tour: Tour } | null>(
    null,
  );

  React.useEffect(() => {
    if (!active || loaded?.id === active.tourId) return;
    let cancelled = false;
    loadTour(active.tourId).then((tour) => {
      if (!cancelled) setLoaded({ id: active.tourId, tour });
    });
    return () => {
      cancelled = true;
    };
  }, [active, loaded]);

  // Açık tur ile yüklenen tur eşleşmiyorsa henüz hazır değiliz.
  const tour = active && loaded?.id === active.tourId ? loaded.tour : null;
  const step = tour && active ? tour.steps[active.step] : undefined;

  // Adımın ekranı açık değilse oraya git — turun "panel üzerinden" yürümesi bu.
  React.useEffect(() => {
    if (!step?.route || step.route === pathname) return;
    router.push(step.route);
  }, [step?.route, pathname, router]);

  const spotlight = useSpotlight(step?.route, Boolean(step));

  const next = React.useCallback(() => {
    if (!active || !tour) return;
    if (active.step >= tour.steps.length - 1) stopTour();
    else goToStep(active.step + 1);
  }, [active, tour]);

  const prev = React.useCallback(() => {
    if (!active) return;
    goToStep(Math.max(0, active.step - 1));
  }, [active]);

  // Klavye: ← → adım, Esc çıkış.
  React.useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (el?.isContentEditable) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") stopTour();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, next, prev]);

  if (!active || !tour || !step) return null;

  return (
    <>
      {/*
        Karartma + delik. Dev bir `box-shadow` ekranın tamamını karartır,
        elemanın kendi alanı delik olarak kalır — böylece yalnız ilgili yer
        aydınlık görünür. Hedef bulunamazsa (ör. sekmesi olmayan ekran)
        ekranın tamamı eşit karartılır.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[45] transition-opacity duration-200"
      >
        {spotlight ? (
          <span
            className="absolute rounded-lg ring-2 ring-gold transition-all duration-200"
            style={{
              top: spotlight.top - 4,
              left: spotlight.left - 4,
              width: spotlight.width + 8,
              height: spotlight.height + 8,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.62)",
            }}
          />
        ) : (
          <span className="absolute inset-0 bg-black/45" />
        )}
      </div>

      {/* Kart ekranın altında durur; arkadaki panel kullanılabilir kalır. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+4.75rem)] sm:justify-end sm:px-4 sm:pr-4 sm:pb-4">
        <StepCard
          tour={tour}
          step={step}
          index={active.step}
          onPrev={prev}
          onNext={next}
          onExit={stopTour}
        />
      </div>
    </>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CalendarCheckIcon,
  CalendarPlusIcon,
  CheckIcon,
  FlameIcon,
  ListChecksIcon,
  SparklesIcon,
  StarIcon,
  TimerIcon,
  UserCheckIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ---------------------- Slayt 1: görüşme notu (AI) ----------------------- */

/**
 * `transcript-review.tsx` ekranının minyatürü: konuşmadan çıkan öneriler,
 * her birinin altında birebir alıntı ve güven yüzdesi. Kaydeden koçtur.
 */
const NOTE_PROPOSALS = [
  {
    icon: ListChecksIcon,
    label: "Soru takibi",
    detail: "Matematik · 320 soru",
    conf: "%94",
  },
  {
    icon: CalendarPlusIcon,
    label: "Program görevi",
    detail: "Türev · 40 soru · Salı",
    conf: "%88",
  },
] as const;

function GorusmeNotuSlide() {
  return (
    <SlideCard>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">
          Görüşme kaydı · 42 dk
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2 py-1 text-xs font-semibold text-info">
          <SparklesIcon className="size-3.5" />
          AI önerdi
        </span>
      </div>

      <p className="rounded-lg bg-muted/50 px-3 py-2 text-[13px] leading-snug text-muted-foreground">
        &ldquo;Bu hafta matematikten 320 soru çözdüm ama{" "}
        <span className="font-medium text-foreground">türevde</span> hâlâ
        takılıyorum.&rdquo;
      </p>

      <ul className="flex flex-col gap-2">
        {NOTE_PROPOSALS.map((p) => (
          <li
            key={p.label}
            className="flex items-center gap-2.5 rounded-lg bg-card px-3 py-2 ring-1 ring-foreground/10"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <p.icon className="size-3.5" />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="text-xs font-medium">{p.label}</span>
              <span className="truncate text-[11px] text-muted-foreground tabular-nums">
                {p.detail}
              </span>
            </span>
            <span className="ml-auto text-[11px] font-semibold text-success tabular-nums">
              {p.conf}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
          <UserCheckIcon className="size-3.5" />
          Koç onayladı
        </span>
        Onaylanmadan hiçbir şey kaydedilmez.
      </div>
    </SlideCard>
  );
}

/* ------------------- Slayt 2: AI haftalık program taslağı ---------------- */

/**
 * `plan-ai-draft.tsx` minyatürü: taslak gelir, işaretlenenler programa yazılır.
 * Seçim kutuları bilerek karışık — kararın insanda olduğunu gösterir.
 */
const DRAFT_ROWS = [
  { day: "Pzt", text: "Matematik · Türev", target: "40 soru", picked: true },
  { day: "Çar", text: "Türkçe · Paragraf", target: "30 soru", picked: true },
  {
    day: "Cmt",
    text: "Fizik · Kuvvet tekrarı",
    target: "25 soru",
    picked: false,
  },
] as const;

function AiProgramSlide() {
  return (
    <SlideCard>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">
          Haftalık program taslağı
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          <SparklesIcon className="size-3.5" />
          Tek tuşla
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {DRAFT_ROWS.map((row) => (
          <li
            key={row.text}
            className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-sm"
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-[5px]",
                row.picked
                  ? "bg-primary text-primary-foreground"
                  : "ring-1 ring-foreground/25",
              )}
            >
              {row.picked && <CheckIcon className="size-3" />}
            </span>
            <span className="w-8 shrink-0 text-[11px] font-semibold text-muted-foreground">
              {row.day}
            </span>
            <span
              className={cn(
                "min-w-0 truncate",
                !row.picked && "text-muted-foreground",
              )}
            >
              {row.text}
            </span>
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {row.target}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 rounded-lg bg-gold/10 px-3 py-2">
        <span className="text-xs font-medium text-gold-foreground dark:text-gold">
          Zayıf konuların ve son 4 haftan hesaba katıldı
        </span>
        <span className="text-[11px] text-muted-foreground">
          Yalnız işaretlediklerin programa yazılır.
        </span>
      </div>
    </SlideCard>
  );
}

/* -------------------------- Slayt 3: birebir koçluk ----------------------- */

const PLAN_ROWS = [
  { text: "Matematik · 40 soru · Türev", done: true },
  { text: "Paragraf · 30 soru", done: true },
  { text: "Deneme çöz · TYT-14", done: false },
];

function KoclukSlide() {
  return (
    <SlideCard>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">
          Koçunun onayladığı hafta
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          <CalendarCheckIcon className="size-3.5" />
          Koçun onayladı
        </span>
      </div>
      <div className="flex items-center gap-2.5 rounded-lg bg-info/10 px-3 py-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-info/15 text-sm font-bold text-info">
          AH
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-xs font-medium">Sonraki görüşme</span>
          <span className="text-[11px] text-muted-foreground">
            Cumartesi 20:00 · birebir görüşme
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {PLAN_ROWS.map((row) => (
          <li
            key={row.text}
            className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-sm"
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full",
                row.done
                  ? "bg-success text-success-foreground"
                  : "ring-1 ring-foreground/25",
              )}
            >
              {row.done && <CheckIcon className="size-3" />}
            </span>
            <span className={cn(row.done && "text-muted-foreground line-through")}>
              {row.text}
            </span>
          </li>
        ))}
      </ul>
    </SlideCard>
  );
}

/* --------------------------- Slayt 4: günlük takip ------------------------ */

function DisiplinSlide() {
  return (
    <SlideCard>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">
          Bugünkü disiplin
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-1 text-xs font-semibold text-gold">
          <FlameIcon className="size-3.5" />
          14 gün seri
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            Çözülen soru
          </span>
          <span className="font-heading text-2xl font-bold tabular-nums">
            1.240
          </span>
          <span className="text-[11px] font-semibold text-success tabular-nums">
            +18% geçen haftaya göre
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl bg-muted/50 p-3.5">
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <TimerIcon className="size-3" />
            Çalışma süresi
          </span>
          <span className="font-heading text-2xl font-bold tabular-nums">
            12s 30dk
          </span>
          <span className="text-[11px] text-muted-foreground">
            Kronometreyle ölçüldü
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon key={i} className="size-3 fill-gold text-gold" />
          ))}
        </span>
        Her gün ölçülen, görünen ilerleme.
      </div>
    </SlideCard>
  );
}

/* ------------------------------- Kabuk / motor ---------------------------- */

function SlideCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-xl shadow-primary/10 ring-1 ring-foreground/10">
      {children}
    </div>
  );
}

type Slide = { key: string; label: string; render: () => ReactNode };

const SLIDES: Slide[] = [
  { key: "gorusme", label: "AI görüşme notu", render: () => <GorusmeNotuSlide /> },
  { key: "program", label: "AI haftalık program", render: () => <AiProgramSlide /> },
  { key: "kocluk", label: "Birebir koçluk", render: () => <KoclukSlide /> },
  { key: "disiplin", label: "Günlük takip", render: () => <DisiplinSlide /> },
];

// 4 slayt × 4,2 sn ≈ 17 sn tam tur. Daha uzun aralıkta son slaytlar ilk
// kaydırmadan önce hiç görülmüyor; 4 sn'nin altı ise okumaya yetmiyor.
const AUTOPLAY_MS = 4200;

/**
 * Ana sayfa kahraman karuseli — ürünün dört sütununu (AI görüşme notu, AI
 * haftalık program taslağı, birebir koçluk, günlük disiplin) otomatik döngüyle
 * gösterir. Slaytlar gerçek panel ekranlarının minyatürü olduğu için metin
 * bilerek sola hizalı. Motion ile yumuşak geçiş; hover/focus'ta durur;
 * azaltılmış-hareket tercihine saygılı.
 */
export function HeroCarousel() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;

  useEffect(() => {
    if (reduce || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [reduce, paused, count]);

  const slide = SLIDES[index];
  const offset = reduce ? 0 : 28;

  return (
    <div
      className="relative mx-auto w-full max-w-md lg:max-w-none"
      role="group"
      aria-roledescription="carousel"
      aria-label="Öne çıkan özellikler"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Arka ışıltılar */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-10 left-1/2 h-56 w-[26rem] max-w-full -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -right-6 bottom-0 size-36 rounded-full bg-gold/20 blur-2xl" />
      </div>

      <div className="relative flex min-h-[344px] items-center sm:min-h-[360px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.key}
            className="w-full"
            initial={{ opacity: 0, x: offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -offset }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {slide.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Noktalar — görsel çubuk küçük, dokunma hedefi 24px (WCAG 2.2 §2.5.8). */}
      <div
        className="mt-5 flex items-center justify-center gap-0.5"
        aria-hidden={false}
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${s.label} slaytını göster`}
            aria-current={i === index ? "true" : undefined}
            className="group flex h-6 min-w-6 items-center justify-center px-1"
          >
            <span
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-foreground/20 group-hover:bg-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

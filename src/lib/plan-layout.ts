/**
 * Haftalık ders düzeni — "Pazartesi = Türkçe + Matematik, Salı = Coğrafya…".
 *
 * Düzen haftadan haftaya DEĞİŞMEZ: koç bir kez kurar, program kurucusu her
 * hafta bu iskeleti render eder ve koç yalnız konuları yazar. Pure — DB yok.
 *
 * Renk gün kimliğidir (ders kimliği değil): bir günün tüm dersleri aynı rengi
 * paylaşır, böylece Pazartesi ile Salı bir bakışta ayrılır.
 */

/** 1 = Pazartesi … 7 = Pazar — `@/lib/dates` trWeekday ile aynı taban. */
export const LAYOUT_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

export type DayColorKey =
  | "gul"
  | "amber"
  | "zumrut"
  | "gok"
  | "menekse"
  | "turkuaz"
  | "kiremit";

/**
 * Gün rengi paleti. Tailwind v4 kaynak taraması yaptığı için sınıflar TAM
 * literal olmak zorunda — `bg-${x}-500` gibi kurgular derlemeye girmez.
 */
export const DAY_COLORS: Record<
  DayColorKey,
  { label: string; dot: string; chip: string; card: string; bar: string }
> = {
  gul: {
    label: "Gül",
    dot: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    card: "ring-rose-500/25 bg-rose-500/[0.04]",
    bar: "bg-rose-500",
  },
  amber: {
    label: "Amber",
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    card: "ring-amber-500/25 bg-amber-500/[0.04]",
    bar: "bg-amber-500",
  },
  zumrut: {
    label: "Zümrüt",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    card: "ring-emerald-500/25 bg-emerald-500/[0.04]",
    bar: "bg-emerald-500",
  },
  gok: {
    label: "Gök",
    dot: "bg-blue-500",
    chip: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    card: "ring-blue-500/25 bg-blue-500/[0.04]",
    bar: "bg-blue-500",
  },
  menekse: {
    label: "Menekşe",
    dot: "bg-violet-500",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    card: "ring-violet-500/25 bg-violet-500/[0.04]",
    bar: "bg-violet-500",
  },
  turkuaz: {
    label: "Turkuaz",
    dot: "bg-cyan-500",
    chip: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    card: "ring-cyan-500/25 bg-cyan-500/[0.04]",
    bar: "bg-cyan-500",
  },
  kiremit: {
    label: "Kiremit",
    dot: "bg-orange-600",
    chip: "bg-orange-600/10 text-orange-700 dark:text-orange-300",
    card: "ring-orange-600/25 bg-orange-600/[0.04]",
    bar: "bg-orange-600",
  },
};

export const DAY_COLOR_KEYS = Object.keys(DAY_COLORS) as DayColorKey[];

/** Koç renk seçmediyse her gün farklı bir varsayılan alır (Pzt→gül…). */
export function defaultDayColor(day: number): DayColorKey {
  return DAY_COLOR_KEYS[(day - 1) % DAY_COLOR_KEYS.length];
}

export function isDayColorKey(v: string | null): v is DayColorKey {
  return v != null && v in DAY_COLORS;
}

/** Kayıtlı anahtar geçersizse/boşsa güne düşen varsayılana döner. */
export function dayColorOf(day: number, stored: string | null): DayColorKey {
  return isDayColorKey(stored) ? stored : defaultDayColor(day);
}

export function dayColorClasses(day: number, stored: string | null) {
  return DAY_COLORS[dayColorOf(day, stored)];
}

/**
 * `plan_day_layouts.subject_ids` JSON-encoded number[] tutar
 * (`subjects.track_codes` ile aynı desen). Bozuk/eksik veri boş diziye düşer —
 * düzen kozmetiktir, asla programı patlatmamalı.
 */
export function parseSubjectIds(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((n): n is number => Number.isInteger(n) && n > 0);
  } catch {
    return [];
  }
}

export function serializeSubjectIds(ids: readonly number[]): string {
  // Tekilleştir + sırayı koru: koçun sürüklediği sıra gösterim sırasıdır.
  return JSON.stringify([...new Set(ids.filter((n) => Number.isInteger(n) && n > 0))]);
}

/** Bir günün düzen satırı (UI + action ortak görünümü). */
export type DayLayoutEntry = {
  day: number;
  subjectIds: number[];
  color: DayColorKey;
};

/** 7 günü de kapsayan tam düzen — kayıtlı olmayan günler boş gelir. */
export function fillLayoutDays(
  rows: readonly { day: number; subjectIds: number[]; color: string | null }[],
): DayLayoutEntry[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return LAYOUT_DAYS.map((day) => {
    const row = byDay.get(day);
    return {
      day,
      subjectIds: row?.subjectIds ?? [],
      color: dayColorOf(day, row?.color ?? null),
    };
  });
}

/** Düzende hiç ders yoksa iskelet gösterilmez (kurulum çağrısı yapılır). */
export function layoutIsEmpty(entries: readonly DayLayoutEntry[]): boolean {
  return entries.every((e) => e.subjectIds.length === 0);
}

/**
 * Date helpers — Europe/Istanbul, Monday-start weeks.
 * Turkey has had NO DST since 2016, so a fixed +03:00 (TRT) offset is exact and
 * simpler than tz math for day/week bucketing. Display formatting uses Intl.
 * Stored day-columns hold the instant of TRT-midnight (see AGENTS.md).
 */

const TRT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The instant of 00:00 TRT for the day containing `d`. */
export function startOfTrtDay(d: Date = new Date()): Date {
  const shifted = new Date(d.getTime() + TRT_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - TRT_OFFSET_MS);
}

/** Add whole days (safe under fixed offset — no DST jumps). */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** TRT weekday: 1 = Pazartesi … 7 = Pazar. */
export function trWeekday(d: Date): number {
  const shifted = new Date(startOfTrtDay(d).getTime() + TRT_OFFSET_MS);
  const dow = shifted.getUTCDay(); // 0=Sun..6=Sat
  return dow === 0 ? 7 : dow;
}

/** 00:00 TRT of the Monday of `d`'s week. */
export function mondayOf(d: Date = new Date()): Date {
  return addDays(startOfTrtDay(d), 1 - trWeekday(d));
}

/** The 7 day-start Dates Mon..Sun for the week containing `d`. */
export function weekDays(d: Date = new Date()): Date[] {
  const mon = mondayOf(d);
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** Inclusive [monday, sundayEnd) range for the week containing `d`. */
export function weekRange(d: Date = new Date()): { start: Date; end: Date } {
  const start = mondayOf(d);
  return { start, end: addDays(start, 7) };
}

/** Whole TRT-days between two instants (b - a). */
export function daysBetween(a: Date, b: Date = new Date()): number {
  return Math.round(
    (startOfTrtDay(b).getTime() - startOfTrtDay(a).getTime()) / DAY_MS,
  );
}

export const DAY_NAMES_TR = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

export const DAY_NAMES_TR_SHORT = [
  "Pzt",
  "Sal",
  "Çar",
  "Per",
  "Cum",
  "Cmt",
  "Paz",
] as const;

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

/** "18 Temmuz 2026" */
export function formatTrDate(d: Date): string {
  return dateFmt.format(d);
}

/** "13 – 19 Tem" for a week (given any day in it). */
export function formatWeekLabel(d: Date): string {
  const start = mondayOf(d);
  const end = addDays(start, 6);
  return `${dayMonthFmt.format(start)} – ${dayMonthFmt.format(end)}`;
}

/** ISO yyyy-mm-dd of the TRT day (stable key for grids/URLs). */
export function trDayKey(d: Date): string {
  const shifted = new Date(startOfTrtDay(d).getTime() + TRT_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

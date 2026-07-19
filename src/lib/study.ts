/**
 * Çalışma süresi (kronometre) saf yardımcıları. Süre DAİMA tam sayı dakika
 * saklanır; toplamlar SUM(minutes) ile hesaplanır (bkz. schema studyLogs).
 */

/** Toplam dakika → "1s 30dk" / "2s" / "45dk". */
export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h && rem) return `${h}s ${rem}dk`;
  if (h) return `${h}s`;
  return `${rem}dk`;
}

/** Saniye → "01:23:45" (kronometre gösterimi). */
export function formatStopwatch(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export type StudySource = "timer" | "manual";

export const STUDY_SOURCE_LABELS: Record<StudySource, string> = {
  timer: "Kronometre",
  manual: "Manuel",
};

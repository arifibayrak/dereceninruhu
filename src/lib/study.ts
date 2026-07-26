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

/* -------------------------------- Kronometre ------------------------------- */

/**
 * Kronometrenin cihazda saklanan durumu. Geçen süre bir sayaçtan DEĞİL,
 * `startedAt` duvar saatinden türetilir: telefonda uygulamadan çıkılıp sayfa
 * bellekten atılsa bile dönüşte süre doğru kalır.
 */
export type TimerState = {
  /** Seçili ders (`"genel"` ya da subjectId metni). */
  subject: string;
  /** Duraklatmalar dahil, son başlatmaya kadar biriken saniye. */
  accumulated: number;
  /** Çalışıyorsa son başlatma anı (epoch ms); duraklatılmışsa null. */
  startedAt: number | null;
};

/** Unutulmuş kronometre tavanı — kayıt şeması da en fazla 24 saati kabul eder. */
export const MAX_TIMER_SEC = 24 * 60 * 60;
export const MAX_TIMER_MIN = MAX_TIMER_SEC / 60;

/** Saklanan durumdan `now` anındaki geçen süre (saniye), tavanla sınırlı. */
export function elapsedOf(state: TimerState | null, now: number): number {
  if (!state) return 0;
  const live = state.startedAt === null ? 0 : (now - state.startedAt) / 1000;
  return Math.min(MAX_TIMER_SEC, Math.max(0, state.accumulated + live));
}

/** localStorage metnini duruma çevirir; bozuk/eksik veri null döner. */
export function parseTimerState(
  raw: string | null,
  fallbackSubject: string,
): TimerState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TimerState>;
    const accumulated = Number(parsed.accumulated);
    if (!Number.isFinite(accumulated) || accumulated < 0) return null;
    return {
      subject:
        typeof parsed.subject === "string" ? parsed.subject : fallbackSubject,
      accumulated,
      startedAt:
        typeof parsed.startedAt === "number" && Number.isFinite(parsed.startedAt)
          ? parsed.startedAt
          : null,
    };
  } catch {
    return null;
  }
}

export type StudySource = "timer" | "manual";

export const STUDY_SOURCE_LABELS: Record<StudySource, string> = {
  timer: "Kronometre",
  manual: "Manuel",
};

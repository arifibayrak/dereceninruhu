/**
 * Auto-insights — the sheet-killer. Pure transforms over a student's tracking
 * data → a prioritized list of Turkish, human-readable insights shown on
 * /ogrenci/gelisim and the koç review screen. No DB access here; callers fetch.
 */
import { addDays, daysBetween, trDayKey } from "@/lib/dates";
import { formatDelta, formatInt, formatNet } from "@/lib/format";
import { formatMinutes } from "@/lib/study";

export type InsightTone = "positive" | "warning" | "neutral";

export type Insight = {
  id: string;
  tone: InsightTone;
  /** lucide-react icon name hint for the UI. */
  icon: string;
  title: string;
  detail?: string;
};

/**
 * Consecutive active days ending today (or yesterday if today is empty yet).
 * `activeDayKeys` are trDayKey() strings for days with any question logged.
 */
export function computeStreak(
  activeDayKeys: Iterable<string>,
  now: Date = new Date(),
): number {
  const set = activeDayKeys instanceof Set ? activeDayKeys : new Set(activeDayKeys);
  if (set.size === 0) return 0;
  // Anchor: today if active, else yesterday if active, else no streak.
  let cursor: Date;
  if (set.has(trDayKey(now))) cursor = now;
  else if (set.has(trDayKey(addDays(now, -1)))) cursor = addDays(now, -1);
  else return 0;

  let streak = 0;
  while (set.has(trDayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export type NetPoint = { takenOn: Date; net: number };

/** Latest net + delta vs the previous mock in a chronological series. */
export function netTrend(points: NetPoint[]): {
  latest: number | null;
  previous: number | null;
  delta: number | null;
  direction: "up" | "down" | "flat" | null;
} {
  if (points.length === 0)
    return { latest: null, previous: null, delta: null, direction: null };
  const sorted = [...points].sort(
    (a, b) => a.takenOn.getTime() - b.takenOn.getTime(),
  );
  const latest = sorted[sorted.length - 1].net;
  if (sorted.length === 1)
    return { latest, previous: null, delta: null, direction: null };
  const previous = sorted[sorted.length - 2].net;
  const delta = Math.round((latest - previous) * 100) / 100;
  return {
    latest,
    previous,
    delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

export type StudentInsightInput = {
  /** trDayKey() strings for days with any soru logged. */
  activeDayKeys: string[];
  /** Most recent activity instant (soru or deneme), or null. */
  lastActivity: Date | null;
  weekQuestionTotal: number;
  lastWeekQuestionTotal: number;
  /** Bu hafta / geçen hafta toplam çalışma dakikası (kronometre + manuel). */
  weekStudyMinutes?: number;
  lastWeekStudyMinutes?: number;
  /** Optional weekly soru target for the gap insight. */
  weeklyTarget?: number | null;
  /** Total net per FULL deneme, chronological. */
  netSeries: NetPoint[];
  /** TOPLAM EKSİK ranking (Faz 3+); empty until topic errors exist. */
  weakestTopics?: { topicName: string; errorCount: number }[];
  now?: Date;
};

/** Build the prioritized insight list (warnings first, then wins). */
export function buildStudentInsights(input: StudentInsightInput): Insight[] {
  const now = input.now ?? new Date();
  const out: Insight[] = [];

  // Staleness — highest priority nudge.
  if (input.lastActivity) {
    const stale = daysBetween(input.lastActivity, now);
    if (stale >= 3) {
      out.push({
        id: "stale",
        tone: "warning",
        icon: "AlarmClock",
        title: `${stale} gündür giriş yok`,
        detail: "Bugün birkaç soru çözüp kaydetmeye ne dersin?",
      });
    }
  } else {
    out.push({
      id: "no-activity",
      tone: "warning",
      icon: "AlarmClock",
      title: "Henüz kayıt yok",
      detail: "İlk soru girişini yaparak başlayalım.",
    });
  }

  // Weekly soru target gap.
  if (input.weeklyTarget && input.weeklyTarget > 0) {
    const gap = input.weekQuestionTotal - input.weeklyTarget;
    if (gap < 0) {
      out.push({
        id: "soru-gap-behind",
        tone: "warning",
        icon: "Target",
        title: `Bu hafta ${formatInt(-gap)} soru geride`,
        detail: `Hedef ${formatInt(input.weeklyTarget)} · şu an ${formatInt(input.weekQuestionTotal)}`,
      });
    } else {
      out.push({
        id: "soru-gap-ahead",
        tone: "positive",
        icon: "Target",
        title: `Haftalık hedefi geçtin 🎯`,
        detail: `${formatInt(input.weekQuestionTotal)} / ${formatInt(input.weeklyTarget)} soru`,
      });
    }
  }

  // Net trend.
  const trend = netTrend(input.netSeries);
  if (trend.delta !== null && trend.direction) {
    if (trend.direction === "up") {
      out.push({
        id: "net-up",
        tone: "positive",
        icon: "TrendingUp",
        title: `Netin ${formatDelta(trend.delta)} arttı`,
        detail: `Son deneme: ${formatNet(trend.latest!)} net`,
      });
    } else if (trend.direction === "down") {
      out.push({
        id: "net-down",
        tone: "warning",
        icon: "TrendingDown",
        title: `Netin ${formatDelta(trend.delta)} düştü`,
        detail: `Son deneme: ${formatNet(trend.latest!)} net — birlikte bakalım`,
      });
    }
  }

  // Streak.
  const streak = computeStreak(input.activeDayKeys, now);
  if (streak >= 3) {
    out.push({
      id: "streak",
      tone: "positive",
      icon: "Flame",
      title: `${streak} günlük seri 🔥`,
      detail: "Böyle devam!",
    });
  }

  // Weekly volume momentum.
  if (input.lastWeekQuestionTotal > 0) {
    const d = input.weekQuestionTotal - input.lastWeekQuestionTotal;
    if (d >= 50) {
      out.push({
        id: "volume-up",
        tone: "positive",
        icon: "ChartColumnIncreasing",
        title: `Geçen haftaya göre ${formatInt(d)} soru fazla`,
      });
    }
  }

  // Çalışma süresi momentumu (bu hafta vs geçen hafta dakika).
  if (input.weekStudyMinutes !== undefined && input.weekStudyMinutes > 0) {
    const cur = input.weekStudyMinutes;
    const prev = input.lastWeekStudyMinutes ?? 0;
    if (prev > 0) {
      const pct = Math.round(((cur - prev) / prev) * 100);
      if (pct >= 15) {
        out.push({
          id: "study-up",
          tone: "positive",
          icon: "Clock",
          title: `Çalışma süren %${pct} arttı`,
          detail: `Bu hafta ${formatMinutes(cur)} · geçen hafta ${formatMinutes(prev)}`,
        });
      } else if (pct <= -15) {
        out.push({
          id: "study-down",
          tone: "warning",
          icon: "Clock",
          title: `Çalışma süren %${Math.abs(pct)} düştü`,
          detail: `Bu hafta ${formatMinutes(cur)} · geçen hafta ${formatMinutes(prev)}`,
        });
      }
    } else {
      out.push({
        id: "study-week",
        tone: "positive",
        icon: "Clock",
        title: `Bu hafta ${formatMinutes(cur)} çalıştın`,
        detail: "Süreni tutmaya devam et.",
      });
    }
  }

  // Weakest topics (coaching action list).
  if (input.weakestTopics && input.weakestTopics.length > 0) {
    const top = input.weakestTopics.slice(0, 3).map((t) => t.topicName);
    out.push({
      id: "weak-topics",
      tone: "neutral",
      icon: "CircleAlert",
      title: "En çok eksik verdiğin konular",
      detail: top.join(" · "),
    });
  }

  return out;
}

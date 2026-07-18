import { and, asc, desc, eq, gt, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  examSections,
  mockExamResults,
  mockExams,
  questionLogs,
} from "@/db/schema";
import { addDays, mondayOf, trDayKey, weekRange } from "@/lib/dates";
import type { StudentInsightInput } from "@/lib/insights";

/* -------------------------------------------------------------------------- */
/*  Soru takibi                                                               */
/* -------------------------------------------------------------------------- */

/** Haftalık ızgara hücreleri: `${dayKey}:${subjectId}` → soru sayısı. */
export async function getWeekGrid(
  enrollmentId: number,
  anyDayOfWeek: Date,
): Promise<Record<string, number>> {
  const db = getDb();
  const { start, end } = weekRange(anyDayOfWeek);
  const rows = await db
    .select({
      logDate: questionLogs.logDate,
      subjectId: questionLogs.subjectId,
      questionCount: questionLogs.questionCount,
    })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gte(questionLogs.logDate, start),
        lt(questionLogs.logDate, end),
      ),
    );

  const grid: Record<string, number> = {};
  for (const r of rows) {
    grid[`${trDayKey(r.logDate)}:${r.subjectId}`] = r.questionCount;
  }
  return grid;
}

/** Bu haftanın toplam soru sayısı. */
export async function getWeekQuestionTotal(
  enrollmentId: number,
  anyDayOfWeek: Date = new Date(),
): Promise<number> {
  const db = getDb();
  const { start, end } = weekRange(anyDayOfWeek);
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${questionLogs.questionCount}), 0)`,
    })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gte(questionLogs.logDate, start),
        lt(questionLogs.logDate, end),
      ),
    );
  return Number(rows[0]?.total ?? 0);
}

/** Tüm zamanların toplam soru sayısı. */
export async function getTotalQuestions(enrollmentId: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${questionLogs.questionCount}), 0)`,
    })
    .from(questionLogs)
    .where(eq(questionLogs.enrollmentId, enrollmentId));
  return Number(rows[0]?.total ?? 0);
}

export type WeeklyVolumePoint = {
  /** Haftanın pazartesi günü (trDayKey). */
  weekKey: string;
  weekStart: Date;
  total: number;
};

/** Son N haftanın haftalık soru hacmi (boş haftalar 0 ile döner). */
export async function getWeeklyVolume(
  enrollmentId: number,
  weeks = 8,
  now: Date = new Date(),
): Promise<WeeklyVolumePoint[]> {
  const db = getDb();
  const thisMonday = mondayOf(now);
  const firstMonday = addDays(thisMonday, -7 * (weeks - 1));
  const rows = await db
    .select({
      logDate: questionLogs.logDate,
      questionCount: questionLogs.questionCount,
    })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gte(questionLogs.logDate, firstMonday),
      ),
    );

  const buckets = new Map<string, number>();
  for (const r of rows) {
    const key = trDayKey(mondayOf(r.logDate));
    buckets.set(key, (buckets.get(key) ?? 0) + r.questionCount);
  }

  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(firstMonday, i * 7);
    const weekKey = trDayKey(weekStart);
    return { weekKey, weekStart, total: buckets.get(weekKey) ?? 0 };
  });
}

/* -------------------------------------------------------------------------- */
/*  Denemeler                                                                 */
/* -------------------------------------------------------------------------- */

export type MockRow = {
  id: number;
  takenOn: Date;
  scope: "full" | "branch";
  publisher: string | null;
  name: string | null;
  analysisDone: boolean;
  sectionName: string;
  sectionCode: string;
  totalNet: number;
};

/** Deneme listesi (bölüm adı + toplam net ile), yeniden eskiye. */
export async function getMockList(enrollmentId: number): Promise<MockRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: mockExams.id,
      takenOn: mockExams.takenOn,
      scope: mockExams.scope,
      publisher: mockExams.publisher,
      name: mockExams.name,
      analysisDone: mockExams.analysisDone,
      sectionName: examSections.name,
      sectionCode: examSections.code,
      totalNet: sql<number>`coalesce(sum(${mockExamResults.net}), 0)`,
    })
    .from(mockExams)
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .leftJoin(mockExamResults, eq(mockExamResults.mockExamId, mockExams.id))
    .where(eq(mockExams.enrollmentId, enrollmentId))
    .groupBy(mockExams.id)
    .orderBy(desc(mockExams.takenOn), desc(mockExams.id));
  return rows.map((r) => ({ ...r, totalNet: Number(r.totalNet) }));
}

export type NetSeriesPoint = {
  mockExamId: number;
  takenOn: Date;
  label: string;
  net: number;
};

/** Tam (full) denemelerin toplam net serisi, eskiden yeniye. */
export async function getNetSeries(
  enrollmentId: number,
): Promise<NetSeriesPoint[]> {
  const db = getDb();
  const rows = await db
    .select({
      mockExamId: mockExams.id,
      takenOn: mockExams.takenOn,
      name: mockExams.name,
      publisher: mockExams.publisher,
      sectionCode: examSections.code,
      net: sql<number>`coalesce(sum(${mockExamResults.net}), 0)`,
    })
    .from(mockExams)
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .leftJoin(mockExamResults, eq(mockExamResults.mockExamId, mockExams.id))
    .where(
      and(eq(mockExams.enrollmentId, enrollmentId), eq(mockExams.scope, "full")),
    )
    .groupBy(mockExams.id)
    .orderBy(asc(mockExams.takenOn), asc(mockExams.id));
  return rows.map((r) => ({
    mockExamId: r.mockExamId,
    takenOn: r.takenOn,
    label: r.name?.trim() || r.publisher?.trim() || r.sectionCode,
    net: Number(r.net),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Insight girdisi                                                           */
/* -------------------------------------------------------------------------- */

/** buildStudentInsights için tüm ham veriyi tek seferde toplar. */
export async function getStudentInsightInput(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<StudentInsightInput> {
  const db = getDb();

  const activeDays = await db
    .select({ logDate: questionLogs.logDate })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gt(questionLogs.questionCount, 0),
      ),
    );
  const activeDayKeys = [...new Set(activeDays.map((r) => trDayKey(r.logDate)))];

  const [lastLog] = await db
    .select({ last: sql<number | null>`max(${questionLogs.logDate})` })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gt(questionLogs.questionCount, 0),
      ),
    );
  const [lastMock] = await db
    .select({ last: sql<number | null>`max(${mockExams.takenOn})` })
    .from(mockExams)
    .where(eq(mockExams.enrollmentId, enrollmentId));

  const lastSec = Math.max(Number(lastLog?.last ?? 0), Number(lastMock?.last ?? 0));
  const lastActivity = lastSec > 0 ? new Date(lastSec * 1000) : null;

  const thisWeek = await getWeekQuestionTotal(enrollmentId, now);
  const lastWeek = await getWeekQuestionTotal(enrollmentId, addDays(now, -7));

  const series = await getNetSeries(enrollmentId);

  return {
    activeDayKeys,
    lastActivity,
    weekQuestionTotal: thisWeek,
    lastWeekQuestionTotal: lastWeek,
    netSeries: series.map((p) => ({ takenOn: p.takenOn, net: p.net })),
    now,
  };
}

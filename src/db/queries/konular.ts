import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  resourceQuestionLogs,
  resources,
  subjects,
  topicResourceProgress,
} from "@/db/schema";
import { startOfTrtDay, weekRange } from "@/lib/dates";
import { getTopicGroupsForExam, type SubjectTopicGroup } from "./analiz";

/* -------------------------------------------------------------------------- */
/*  Kaynaklar                                                                 */
/* -------------------------------------------------------------------------- */

export type ResourceRow = {
  id: number;
  name: string;
  author: string | null;
  notes: string | null;
  url: string | null;
  subjectId: number | null;
  subjectName: string | null;
  isActive: boolean;
};

/** Kaydın tüm kaynakları (arşivlenenler dahil), ada göre. */
export async function listResources(
  enrollmentId: number,
): Promise<ResourceRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: resources.id,
      name: resources.name,
      author: resources.author,
      notes: resources.notes,
      url: resources.url,
      subjectId: resources.subjectId,
      subjectName: subjects.name,
      isActive: resources.isActive,
    })
    .from(resources)
    .leftJoin(subjects, eq(subjects.id, resources.subjectId))
    .where(eq(resources.enrollmentId, enrollmentId))
    .orderBy(asc(resources.name));
  return rows;
}

export type ResourceStatsRow = ResourceRow & {
  /** Bu kaynaktan çözülen toplam soru. */
  totalQuestions: number;
  /** Bu hafta çözülen soru. */
  weekQuestions: number;
  /** Bu kaynakta "Bitti" işaretlenen konu sayısı. */
  topicsDone: number;
};

/** Kaynaklar + per-kaynak soru toplamları + biten konu sayısı (koç/öğrenci). */
export async function listResourcesWithStats(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<ResourceStatsRow[]> {
  const db = getDb();
  const { start, end } = weekRange(now);
  const [base, totals, weekTotals, doneCounts] = await Promise.all([
    listResources(enrollmentId),
    db
      .select({
        resourceId: resourceQuestionLogs.resourceId,
        total: sql<number>`coalesce(sum(${resourceQuestionLogs.questionCount}), 0)`,
      })
      .from(resourceQuestionLogs)
      .where(eq(resourceQuestionLogs.enrollmentId, enrollmentId))
      .groupBy(resourceQuestionLogs.resourceId),
    db
      .select({
        resourceId: resourceQuestionLogs.resourceId,
        total: sql<number>`coalesce(sum(${resourceQuestionLogs.questionCount}), 0)`,
      })
      .from(resourceQuestionLogs)
      .where(
        and(
          eq(resourceQuestionLogs.enrollmentId, enrollmentId),
          gte(resourceQuestionLogs.logDate, start),
          lt(resourceQuestionLogs.logDate, end),
        ),
      )
      .groupBy(resourceQuestionLogs.resourceId),
    db
      .select({
        resourceId: topicResourceProgress.resourceId,
        cnt: sql<number>`count(*)`,
      })
      .from(topicResourceProgress)
      .where(
        and(
          eq(topicResourceProgress.enrollmentId, enrollmentId),
          eq(topicResourceProgress.isDone, true),
        ),
      )
      .groupBy(topicResourceProgress.resourceId),
  ]);

  const totalBy = new Map(totals.map((r) => [r.resourceId, Number(r.total)]));
  const weekBy = new Map(weekTotals.map((r) => [r.resourceId, Number(r.total)]));
  const doneBy = new Map(doneCounts.map((r) => [r.resourceId, Number(r.cnt)]));
  return base.map((r) => ({
    ...r,
    totalQuestions: totalBy.get(r.id) ?? 0,
    weekQuestions: weekBy.get(r.id) ?? 0,
    topicsDone: doneBy.get(r.id) ?? 0,
  }));
}

/** Bir günün kaynak başına çözülen soru sayısı — logger başlangıç değeri. */
export async function getResourceDayQuestions(
  enrollmentId: number,
  day: Date = new Date(),
): Promise<Record<number, number>> {
  const db = getDb();
  const rows = await db
    .select({
      resourceId: resourceQuestionLogs.resourceId,
      questionCount: resourceQuestionLogs.questionCount,
    })
    .from(resourceQuestionLogs)
    .where(
      and(
        eq(resourceQuestionLogs.enrollmentId, enrollmentId),
        eq(resourceQuestionLogs.logDate, startOfTrtDay(day)),
      ),
    );
  const map: Record<number, number> = {};
  for (const r of rows) map[r.resourceId] = r.questionCount;
  return map;
}

/* -------------------------------------------------------------------------- */
/*  Konu × kaynak "Bitti" matrisi                                             */
/* -------------------------------------------------------------------------- */

export type TopicResourceMatrix = {
  groups: SubjectTopicGroup[];
  resources: ResourceRow[];
  /** `${topicId}:${resourceId}` → true (Bitti). */
  done: Record<string, boolean>;
};

/** Kokpit "Konular" sekmesi + öğrenci analiz sayfası matris verisi. */
export async function getTopicResourceMatrix(
  enrollmentId: number,
  examTemplateId: number,
  trackCode: string | null,
): Promise<TopicResourceMatrix> {
  const db = getDb();
  const [groups, resourceRows, progressRows] = await Promise.all([
    getTopicGroupsForExam(examTemplateId, trackCode),
    listResources(enrollmentId),
    db
      .select({
        topicId: topicResourceProgress.topicId,
        resourceId: topicResourceProgress.resourceId,
        isDone: topicResourceProgress.isDone,
      })
      .from(topicResourceProgress)
      .where(eq(topicResourceProgress.enrollmentId, enrollmentId)),
  ]);

  const done: Record<string, boolean> = {};
  for (const r of progressRows) {
    if (r.isDone) done[`${r.topicId}:${r.resourceId}`] = true;
  }
  return {
    groups,
    resources: resourceRows.filter((r) => r.isActive),
    done,
  };
}

/* -------------------------------------------------------------------------- */
/*  Konu ilerleme özeti (kaç konu bitti / toplam)                             */
/* -------------------------------------------------------------------------- */

export type KonuProgressRow = {
  subjectId: number;
  subjectName: string;
  chartColor: string | null;
  done: number;
  total: number;
};

export type KonuProgress = {
  subjects: KonuProgressRow[];
  doneTotal: number;
  totalTopics: number;
  /** 0..100 tamamlanma yüzdesi. */
  pct: number;
};

/**
 * Konu ilerleme özeti — bir konu, herhangi bir kaynakta "Bitti" işaretliyse
 * biten sayılır. Ders ders ve toplam yüzde döner (koç Konular başlığı için).
 */
export async function getKonuProgress(
  enrollmentId: number,
  examTemplateId: number,
  trackCode: string | null,
): Promise<KonuProgress> {
  const db = getDb();
  const [groups, progressRows] = await Promise.all([
    getTopicGroupsForExam(examTemplateId, trackCode),
    db
      .select({ topicId: topicResourceProgress.topicId })
      .from(topicResourceProgress)
      .where(
        and(
          eq(topicResourceProgress.enrollmentId, enrollmentId),
          eq(topicResourceProgress.isDone, true),
        ),
      ),
  ]);

  const doneTopics = new Set(progressRows.map((r) => r.topicId));
  const subjectsOut: KonuProgressRow[] = groups
    .map((g) => ({
      subjectId: g.subjectId,
      subjectName: g.subjectName,
      chartColor: g.chartColor,
      total: g.topics.length,
      done: g.topics.filter((t) => doneTopics.has(t.id)).length,
    }))
    .filter((s) => s.total > 0);

  const totalTopics = subjectsOut.reduce((a, s) => a + s.total, 0);
  const doneTotal = subjectsOut.reduce((a, s) => a + s.done, 0);
  return {
    subjects: subjectsOut,
    doneTotal,
    totalTopics,
    pct: totalTopics > 0 ? Math.round((doneTotal / totalTopics) * 100) : 0,
  };
}

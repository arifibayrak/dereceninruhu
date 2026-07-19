import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  examTemplates,
  mockExamResults,
  mockExams,
  mockTopicErrors,
  questionLogs,
  students,
  subjects,
  topics,
} from "@/db/schema";
import { daysBetween, weekRange } from "@/lib/dates";
import { netTrend } from "@/lib/insights";

export type CohortRow = {
  studentId: number;
  name: string;
  examCode: string;
  /** Son (full) deneme neti — hiç deneme yoksa null. */
  latestNet: number | null;
  /** Bir önceki denemeye göre net farkı — <2 deneme varsa null. */
  netDelta: number | null;
  netDirection: "up" | "down" | "flat" | null;
  /** Bu hafta (Pzt–Paz) çözülen toplam soru. */
  weekQuestions: number;
  /** Son etkinlikten (soru ya da deneme) bu yana geçen gün — hiç yoksa null. */
  daysSinceActivity: number | null;
  /** En çok eksik verilen dersler (çoktan aza, en fazla 3). */
  weakSubjects: { subject: string; errors: number }[];
};

/**
 * Koç asistanı kadro tablosu: tüm aktif öğrenciler tek geçişte.
 *
 * Küme-temelli (öğrenci başına döngü YOK) — öğrenci sayısından bağımsız sabit
 * sayıda sorgu. "Gerileyen / en çok-az soru çözen / görüşülmeyen öğrenciler"
 * gibi KADRO GENELİ sorular tek çağrıda yanıtlanabilir.
 */
export async function getCohortScoreboard(
  now: Date = new Date(),
): Promise<CohortRow[]> {
  const db = getDb();

  // 1) Aktif kadro
  const roster = await db
    .select({
      studentId: students.id,
      enrollmentId: enrollments.id,
      name: students.fullName,
      examCode: examTemplates.code,
    })
    .from(students)
    .innerJoin(
      enrollments,
      and(
        eq(enrollments.studentId, students.id),
        eq(enrollments.status, "active"),
      ),
    )
    .innerJoin(examTemplates, eq(examTemplates.id, enrollments.examTemplateId));

  if (roster.length === 0) return [];
  const enrollmentIds = roster.map((r) => r.enrollmentId);

  // 2) Net serisi (yalnız full denemeler), kayıt+deneme bazında toplam net
  const netRows = await db
    .select({
      enrollmentId: mockExams.enrollmentId,
      takenOn: mockExams.takenOn,
      net: sql<number>`coalesce(sum(${mockExamResults.net}), 0)`,
    })
    .from(mockExams)
    .leftJoin(mockExamResults, eq(mockExamResults.mockExamId, mockExams.id))
    .where(
      and(
        inArray(mockExams.enrollmentId, enrollmentIds),
        eq(mockExams.scope, "full"),
      ),
    )
    .groupBy(mockExams.id);
  const netByEnrollment = new Map<number, { takenOn: Date; net: number }[]>();
  for (const r of netRows) {
    const arr = netByEnrollment.get(r.enrollmentId) ?? [];
    arr.push({ takenOn: r.takenOn, net: Number(r.net) });
    netByEnrollment.set(r.enrollmentId, arr);
  }

  // 3) Bu haftanın soru toplamı, kayıt bazında
  const { start, end } = weekRange(now);
  const weekRows = await db
    .select({
      enrollmentId: questionLogs.enrollmentId,
      total: sql<number>`coalesce(sum(${questionLogs.questionCount}), 0)`,
    })
    .from(questionLogs)
    .where(
      and(
        inArray(questionLogs.enrollmentId, enrollmentIds),
        gte(questionLogs.logDate, start),
        lt(questionLogs.logDate, end),
      ),
    )
    .groupBy(questionLogs.enrollmentId);
  const weekByEnrollment = new Map<number, number>();
  for (const r of weekRows) weekByEnrollment.set(r.enrollmentId, Number(r.total));

  // 4) Son etkinlik: max(soru günü) ve max(deneme günü) — epoch saniye
  const [lastLogRows, lastMockRows] = await Promise.all([
    db
      .select({
        enrollmentId: questionLogs.enrollmentId,
        last: sql<number | null>`max(${questionLogs.logDate})`,
      })
      .from(questionLogs)
      .where(inArray(questionLogs.enrollmentId, enrollmentIds))
      .groupBy(questionLogs.enrollmentId),
    db
      .select({
        enrollmentId: mockExams.enrollmentId,
        last: sql<number | null>`max(${mockExams.takenOn})`,
      })
      .from(mockExams)
      .where(inArray(mockExams.enrollmentId, enrollmentIds))
      .groupBy(mockExams.enrollmentId),
  ]);
  const lastByEnrollment = new Map<number, number>();
  const bump = (id: number, sec: number | null) => {
    if (!sec) return;
    lastByEnrollment.set(id, Math.max(lastByEnrollment.get(id) ?? 0, Number(sec)));
  };
  for (const r of lastLogRows) bump(r.enrollmentId, r.last);
  for (const r of lastMockRows) bump(r.enrollmentId, r.last);

  // 5) Ders bazlı toplam eksik, kayıt bazında
  const weakRows = await db
    .select({
      enrollmentId: mockExams.enrollmentId,
      subjectName: subjects.name,
      total: sql<number>`sum(${mockTopicErrors.errorCount})`,
    })
    .from(mockTopicErrors)
    .innerJoin(mockExams, eq(mockExams.id, mockTopicErrors.mockExamId))
    .innerJoin(topics, eq(topics.id, mockTopicErrors.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .where(inArray(mockExams.enrollmentId, enrollmentIds))
    .groupBy(mockExams.enrollmentId, subjects.id);
  const weakByEnrollment = new Map<number, { subject: string; errors: number }[]>();
  for (const r of weakRows) {
    const arr = weakByEnrollment.get(r.enrollmentId) ?? [];
    arr.push({ subject: r.subjectName, errors: Number(r.total) });
    weakByEnrollment.set(r.enrollmentId, arr);
  }

  return roster.map((r) => {
    const trend = netTrend(netByEnrollment.get(r.enrollmentId) ?? []);
    const lastSec = lastByEnrollment.get(r.enrollmentId);
    const weakSubjects = (weakByEnrollment.get(r.enrollmentId) ?? [])
      .sort((a, b) => b.errors - a.errors)
      .slice(0, 3);
    return {
      studentId: r.studentId,
      name: r.name,
      examCode: r.examCode,
      latestNet: trend.latest,
      netDelta: trend.delta,
      netDirection: trend.direction,
      weekQuestions: weekByEnrollment.get(r.enrollmentId) ?? 0,
      daysSinceActivity: lastSec ? daysBetween(new Date(lastSec * 1000), now) : null,
      weakSubjects,
    };
  });
}

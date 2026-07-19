import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  examSections,
  examTemplates,
  mockExams,
  questionLogs,
  students,
  tracks,
  users,
} from "@/db/schema";
import { daysBetween, weekRange } from "@/lib/dates";
import type { SessionViewer } from "@/lib/session";

/**
 * Kadro görünürlüğü: yönetici tüm öğrencileri, koç yalnız kendisine atanan
 * (enrollments.coach_user_id = koç) kayıtları görür.
 */
function coachScope(viewer: SessionViewer) {
  return viewer.role === "coach"
    ? eq(enrollments.coachUserId, viewer.id)
    : undefined;
}

export type RosterRow = {
  studentId: number;
  enrollmentId: number;
  fullName: string;
  phone: string | null;
  examCode: string;
  trackCode: string | null;
  trackName: string | null;
  targetText: string | null;
  /** Atanan koç (users.id) — null = henüz atanmadı. */
  coachUserId: string | null;
  coachName: string | null;
  weekQuestionTotal: number;
  /** Son aktivite (soru girişi ya da deneme) — null = hiç giriş yok. */
  lastActivity: Date | null;
  /** TRT gün cinsinden bayatlık; null = hiç giriş yok. */
  staleDays: number | null;
  /** Davet kabul edildi mi (öğrenci hesabı bağlı mı). */
  inviteAccepted: boolean;
  inviteCode: string | null;
};

/** Aktif kadro: öğrenci + kayıt + bu hafta soru + son giriş + davet durumu. */
export async function getRoster(
  viewer: SessionViewer,
  now: Date = new Date(),
): Promise<RosterRow[]> {
  const db = getDb();
  const { start, end } = weekRange(now);

  const base = await db
    .select({
      studentId: students.id,
      enrollmentId: enrollments.id,
      fullName: students.fullName,
      phone: students.phone,
      userId: students.userId,
      inviteCode: students.inviteCode,
      examCode: examTemplates.code,
      trackCode: tracks.code,
      trackName: tracks.name,
      targetText: enrollments.targetText,
      coachUserId: enrollments.coachUserId,
      coachName: users.name,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(examTemplates, eq(examTemplates.id, enrollments.examTemplateId))
    .leftJoin(tracks, eq(tracks.id, enrollments.trackId))
    .leftJoin(users, eq(users.id, enrollments.coachUserId))
    .where(
      and(
        eq(enrollments.status, "active"),
        eq(students.status, "active"),
        isNull(students.deletedAt),
        coachScope(viewer),
      ),
    )
    .orderBy(students.fullName);

  const weekTotals = await db
    .select({
      enrollmentId: questionLogs.enrollmentId,
      total: sql<number>`coalesce(sum(${questionLogs.questionCount}), 0)`,
    })
    .from(questionLogs)
    .where(and(gte(questionLogs.logDate, start), lt(questionLogs.logDate, end)))
    .groupBy(questionLogs.enrollmentId);

  const lastLogs = await db
    .select({
      enrollmentId: questionLogs.enrollmentId,
      last: sql<number>`max(${questionLogs.logDate})`,
    })
    .from(questionLogs)
    .where(sql`${questionLogs.questionCount} > 0`)
    .groupBy(questionLogs.enrollmentId);

  const lastMocks = await db
    .select({
      enrollmentId: mockExams.enrollmentId,
      last: sql<number>`max(${mockExams.takenOn})`,
    })
    .from(mockExams)
    .groupBy(mockExams.enrollmentId);

  const totalBy = new Map(weekTotals.map((r) => [r.enrollmentId, Number(r.total)]));
  const lastBy = new Map<number, number>();
  for (const r of [...lastLogs, ...lastMocks]) {
    const sec = Number(r.last);
    if (sec > 0) {
      lastBy.set(r.enrollmentId, Math.max(lastBy.get(r.enrollmentId) ?? 0, sec));
    }
  }

  return base.map((r) => {
    const lastSec = lastBy.get(r.enrollmentId) ?? 0;
    const lastActivity = lastSec > 0 ? new Date(lastSec * 1000) : null;
    return {
      studentId: r.studentId,
      enrollmentId: r.enrollmentId,
      fullName: r.fullName,
      phone: r.phone,
      examCode: r.examCode,
      trackCode: r.trackCode ?? null,
      trackName: r.trackName ?? null,
      targetText: r.targetText,
      coachUserId: r.coachUserId ?? null,
      coachName: r.coachName ?? null,
      weekQuestionTotal: totalBy.get(r.enrollmentId) ?? 0,
      lastActivity,
      staleDays: lastActivity ? daysBetween(lastActivity, now) : null,
      inviteAccepted: r.userId != null,
      inviteCode: r.inviteCode,
    };
  });
}

export type PendingMock = {
  mockExamId: number;
  studentId: number;
  studentName: string;
  takenOn: Date;
  label: string;
  sectionName: string;
};

/** Analizi yapılmamış denemeler (koç panosu) — koç yalnız kendi kadrosunu görür. */
export async function getPendingAnalysisMocks(
  viewer: SessionViewer,
  limit = 12,
): Promise<PendingMock[]> {
  const db = getDb();
  const rows = await db
    .select({
      mockExamId: mockExams.id,
      studentId: students.id,
      studentName: students.fullName,
      takenOn: mockExams.takenOn,
      name: mockExams.name,
      publisher: mockExams.publisher,
      sectionName: examSections.name,
      sectionCode: examSections.code,
    })
    .from(mockExams)
    .innerJoin(enrollments, eq(enrollments.id, mockExams.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .where(
      and(
        eq(mockExams.analysisDone, false),
        isNull(students.deletedAt),
        coachScope(viewer),
      ),
    )
    .orderBy(desc(mockExams.takenOn))
    .limit(limit);
  return rows.map((r) => ({
    mockExamId: r.mockExamId,
    studentId: r.studentId,
    studentName: r.studentName,
    takenOn: r.takenOn,
    label: r.name?.trim() || r.publisher?.trim() || r.sectionCode,
    sectionName: r.sectionName,
  }));
}

export type CoachDashboard = {
  rosterCount: number;
  weekQuestionTotal: number;
  weekMockCount: number;
  /** Son giriş ≥ 3 gün (ya da hiç) — "Bugün hatırlat" listesi. */
  staleStudents: RosterRow[];
  pendingMocks: PendingMock[];
  roster: RosterRow[];
};

/** Koç panosu — bu haftanın tek bakışta özeti (rol-bazlı kadro). */
export async function getCoachDashboard(
  viewer: SessionViewer,
  now: Date = new Date(),
): Promise<CoachDashboard> {
  const db = getDb();
  const roster = await getRoster(viewer, now);
  const { start, end } = weekRange(now);

  const [mockCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mockExams)
    .innerJoin(enrollments, eq(enrollments.id, mockExams.enrollmentId))
    .where(
      and(
        gte(mockExams.takenOn, start),
        lt(mockExams.takenOn, end),
        coachScope(viewer),
      ),
    );

  const staleStudents = roster
    .filter((r) => r.staleDays === null || r.staleDays >= 3)
    .sort((a, b) => (b.staleDays ?? 999) - (a.staleDays ?? 999));

  return {
    rosterCount: roster.length,
    weekQuestionTotal: roster.reduce((acc, r) => acc + r.weekQuestionTotal, 0),
    weekMockCount: Number(mockCountRow?.count ?? 0),
    staleStudents,
    pendingMocks: await getPendingAnalysisMocks(viewer),
    roster,
  };
}

export type HiddenStudentRow = {
  studentId: number;
  fullName: string;
  examCode: string | null;
  deletedAt: Date;
};

/** Gizlenen (soft-delete) öğrenciler — yönetici geri-getirme listesi. */
export async function getHiddenStudents(): Promise<HiddenStudentRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      examCode: examTemplates.code,
      deletedAt: students.deletedAt,
    })
    .from(students)
    .leftJoin(enrollments, eq(enrollments.studentId, students.id))
    .leftJoin(examTemplates, eq(examTemplates.id, enrollments.examTemplateId))
    .where(isNotNull(students.deletedAt))
    .orderBy(desc(students.deletedAt));

  // Öğrencinin birden çok kaydı varsa satır tekrarlar → ilk (en yeni) satırı tut.
  const seen = new Set<number>();
  const out: HiddenStudentRow[] = [];
  for (const r of rows) {
    if (seen.has(r.studentId) || !r.deletedAt) continue;
    seen.add(r.studentId);
    out.push({
      studentId: r.studentId,
      fullName: r.fullName,
      examCode: r.examCode,
      deletedAt: r.deletedAt,
    });
  }
  return out;
}

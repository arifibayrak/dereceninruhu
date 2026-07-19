import { and, asc, eq, gte, lt } from "drizzle-orm";
import { getDb } from "@/db";
import {
  coachingSessions,
  enrollments,
  examTemplates,
  students,
  weeklyPlans,
} from "@/db/schema";
import { addDays, startOfTrtDay, trDayKey } from "@/lib/dates";

export type SessionStatus = "scheduled" | "held" | "cancelled" | "missed";

/* -------------------------------------------------------------------------- */
/*  Tek öğrenci (kokpit "Görüşmeler" sekmesi)                                 */
/* -------------------------------------------------------------------------- */

export type EnrollmentSessionRow = {
  id: number;
  scheduledAt: Date | null;
  heldAt: Date | null;
  status: SessionStatus;
  /** Koç-özel görüşme özeti (öğrenciye gösterilmez). */
  summary: string | null;
  studentVisibleNote: string | null;
  nextPlanId: number | null;
  /** Bağlı planın hafta anahtarı (yyyy-mm-dd) — program sekmesine link. */
  nextPlanWeekKey: string | null;
  /** Dış görüşme linki + sağlayıcı (uygulamadan "Katıl"). */
  meetingUrl: string | null;
  meetingProvider: string | null;
};

/** Kaydın görüşmeleri: yaklaşanlar (artan) + geçmiş (azalan). */
export async function listSessionsForEnrollment(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<{ upcoming: EnrollmentSessionRow[]; past: EnrollmentSessionRow[] }> {
  const db = getDb();
  const rows = await db
    .select({
      id: coachingSessions.id,
      scheduledAt: coachingSessions.scheduledAt,
      heldAt: coachingSessions.heldAt,
      status: coachingSessions.status,
      summary: coachingSessions.summary,
      studentVisibleNote: coachingSessions.studentVisibleNote,
      nextPlanId: coachingSessions.nextPlanId,
      meetingUrl: coachingSessions.meetingUrl,
      meetingProvider: coachingSessions.meetingProvider,
      createdAt: coachingSessions.createdAt,
      nextPlanWeekStart: weeklyPlans.weekStart,
    })
    .from(coachingSessions)
    .leftJoin(weeklyPlans, eq(weeklyPlans.id, coachingSessions.nextPlanId))
    .where(eq(coachingSessions.enrollmentId, enrollmentId));

  const todayStart = startOfTrtDay(now).getTime();
  const mapped = rows.map((r) => ({
    row: {
      id: r.id,
      scheduledAt: r.scheduledAt,
      heldAt: r.heldAt,
      status: r.status,
      summary: r.summary,
      studentVisibleNote: r.studentVisibleNote,
      nextPlanId: r.nextPlanId,
      nextPlanWeekKey: r.nextPlanWeekStart ? trDayKey(r.nextPlanWeekStart) : null,
      meetingUrl: r.meetingUrl,
      meetingProvider: r.meetingProvider,
    } satisfies EnrollmentSessionRow,
    sortAt: (r.heldAt ?? r.scheduledAt ?? r.createdAt).getTime(),
    isUpcoming:
      r.status === "scheduled" &&
      r.scheduledAt != null &&
      r.scheduledAt.getTime() >= todayStart,
  }));

  return {
    upcoming: mapped
      .filter((m) => m.isUpcoming)
      .sort((a, b) => a.sortAt - b.sortAt)
      .map((m) => m.row),
    past: mapped
      .filter((m) => !m.isUpcoming)
      .sort((a, b) => b.sortAt - a.sortAt)
      .map((m) => m.row),
  };
}

export type NextSession = {
  id: number;
  scheduledAt: Date;
  studentVisibleNote: string | null;
  meetingUrl: string | null;
  meetingProvider: string | null;
};

/** Öğrencinin sıradaki planlı görüşmesi (bugün dahil), yoksa null. */
export async function getNextSessionForEnrollment(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<NextSession | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: coachingSessions.id,
      scheduledAt: coachingSessions.scheduledAt,
      studentVisibleNote: coachingSessions.studentVisibleNote,
      meetingUrl: coachingSessions.meetingUrl,
      meetingProvider: coachingSessions.meetingProvider,
    })
    .from(coachingSessions)
    .where(
      and(
        eq(coachingSessions.enrollmentId, enrollmentId),
        eq(coachingSessions.status, "scheduled"),
        gte(coachingSessions.scheduledAt, startOfTrtDay(now)),
      ),
    )
    .orderBy(asc(coachingSessions.scheduledAt))
    .limit(1);
  if (!row?.scheduledAt) return null;
  return {
    id: row.id,
    scheduledAt: row.scheduledAt,
    studentVisibleNote: row.studentVisibleNote,
    meetingUrl: row.meetingUrl,
    meetingProvider: row.meetingProvider,
  };
}

/* -------------------------------------------------------------------------- */
/*  Tüm öğrenciler (koç genel görünüm + pano)                                 */
/* -------------------------------------------------------------------------- */

export type CoachSessionRow = {
  sessionId: number;
  studentId: number;
  studentName: string;
  examCode: string;
  scheduledAt: Date | null;
  heldAt: Date | null;
  status: SessionStatus;
  studentVisibleNote: string | null;
  summary: string | null;
};

/** Tüm öğrencilerin görüşmeleri: yaklaşanlar (artan) + son geçmiş (azalan). */
export async function listAllSessions(
  now: Date = new Date(),
  pastLimit = 20,
): Promise<{ upcoming: CoachSessionRow[]; recent: CoachSessionRow[] }> {
  const db = getDb();
  const rows = await db
    .select({
      sessionId: coachingSessions.id,
      studentId: students.id,
      studentName: students.fullName,
      examCode: examTemplates.code,
      scheduledAt: coachingSessions.scheduledAt,
      heldAt: coachingSessions.heldAt,
      status: coachingSessions.status,
      studentVisibleNote: coachingSessions.studentVisibleNote,
      summary: coachingSessions.summary,
      createdAt: coachingSessions.createdAt,
    })
    .from(coachingSessions)
    .innerJoin(enrollments, eq(enrollments.id, coachingSessions.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(examTemplates, eq(examTemplates.id, enrollments.examTemplateId));

  const todayStart = startOfTrtDay(now).getTime();
  const mapped = rows.map((r) => {
    const { createdAt, ...row } = r;
    return {
      row,
      sortAt: (r.heldAt ?? r.scheduledAt ?? createdAt).getTime(),
      isUpcoming:
        r.status === "scheduled" &&
        r.scheduledAt != null &&
        r.scheduledAt.getTime() >= todayStart,
    };
  });

  return {
    upcoming: mapped
      .filter((m) => m.isUpcoming)
      .sort((a, b) => a.sortAt - b.sortAt)
      .map((m) => m.row),
    recent: mapped
      .filter((m) => !m.isUpcoming)
      .sort((a, b) => b.sortAt - a.sortAt)
      .slice(0, pastLimit)
      .map((m) => m.row),
  };
}

export type UpcomingSession = {
  sessionId: number;
  studentId: number;
  studentName: string;
  scheduledAt: Date;
  studentVisibleNote: string | null;
};

/** Önümüzdeki N günün planlı görüşmeleri (bugün dahil) — koç panosu kartı. */
export async function getUpcomingSessions(
  days = 7,
  now: Date = new Date(),
): Promise<UpcomingSession[]> {
  const db = getDb();
  const start = startOfTrtDay(now);
  const rows = await db
    .select({
      sessionId: coachingSessions.id,
      studentId: students.id,
      studentName: students.fullName,
      scheduledAt: coachingSessions.scheduledAt,
      studentVisibleNote: coachingSessions.studentVisibleNote,
    })
    .from(coachingSessions)
    .innerJoin(enrollments, eq(enrollments.id, coachingSessions.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(
      and(
        eq(coachingSessions.status, "scheduled"),
        gte(coachingSessions.scheduledAt, start),
        lt(coachingSessions.scheduledAt, addDays(start, days)),
      ),
    )
    .orderBy(asc(coachingSessions.scheduledAt));
  return rows.filter((r): r is UpcomingSession => r.scheduledAt != null);
}

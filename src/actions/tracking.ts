"use server";

import { eq, sql } from "drizzle-orm";
import { getDb, type DB } from "@/db";
import {
  enrollments,
  examSections,
  mockExamResults,
  mockExams,
  questionLogs,
  students,
  subjects,
} from "@/db/schema";
import { computeNet, rollUpChildren, type SubjectCounts } from "@/lib/net";
import { startOfTrtDay } from "@/lib/dates";
import { createMockSchema, questionLogUpsertSchema } from "@/lib/validation";
import {
  actionError,
  guarded,
  requireCoach,
  requireUser,
  type ActionResult,
  type SessionUser,
} from "@/actions/_guard";

/** Coaches (2-person practice, both see all) pass; students only their own. */
async function assertEnrollmentAccess(
  db: DB,
  enrollmentId: number,
  user: SessionUser,
): Promise<void> {
  if (user.role === "coach" || user.role === "admin") return;
  const rows = await db
    .select({ userId: students.userId })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(eq(enrollments.id, enrollmentId));
  if (!rows[0] || rows[0].userId !== user.id) {
    throw new Error("Bu kayıt sana ait değil");
  }
}

function fieldErrorsOf(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) out[i.path.join(".")] = i.message;
  return out;
}

/** Soru takibi: upsert one day's per-subject counts (the grid is an upsert). */
export async function upsertQuestionLogs(
  input: unknown,
): Promise<ActionResult<{ count: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = questionLogUpsertSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { enrollmentId, logDate, entries } = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, enrollmentId, user);

    const day = startOfTrtDay(logDate);
    const rows = entries.map((e) => ({
      enrollmentId,
      logDate: day,
      subjectId: e.subjectId,
      questionCount: e.questionCount,
    }));

    await db
      .insert(questionLogs)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          questionLogs.enrollmentId,
          questionLogs.logDate,
          questionLogs.subjectId,
        ],
        set: {
          questionCount: sql`excluded.question_count`,
          updatedAt: new Date(),
        },
      });

    return { ok: true, data: { count: rows.length } };
  });
}

/** Deneme girişi: net server-side hesaplanır; alt dersler scored derse toplanır. */
export async function createMock(
  input: unknown,
): Promise<ActionResult<{ mockExamId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = createMockSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, v.enrollmentId, user);

    const section = await db.query.examSections.findFirst({
      where: eq(examSections.id, v.examSectionId),
    });
    if (!section) return actionError("Deneme bölümü bulunamadı.");
    const divisor = section.wrongPenaltyDivisor;

    // Roll child subjects (GEO/MANTIK…) up into their scored parent before net.
    const sectionSubjects = await db
      .select({
        id: subjects.id,
        parentSubjectId: subjects.parentSubjectId,
        isScored: subjects.isScored,
      })
      .from(subjects)
      .where(eq(subjects.examSectionId, section.id));

    const counts = new Map<number, SubjectCounts>();
    for (const r of v.results) {
      counts.set(r.subjectId, {
        correct: r.correctCount,
        wrong: r.wrongCount,
        blank: r.blankCount,
      });
    }
    const rolled = rollUpChildren(counts, sectionSubjects);
    if (rolled.size === 0) {
      return actionError("Puanlanan ders bulunamadı.");
    }

    const [exam] = await db
      .insert(mockExams)
      .values({
        enrollmentId: v.enrollmentId,
        examSectionId: v.examSectionId,
        scope: v.scope,
        publisher: v.publisher?.trim() || null,
        name: v.name?.trim() || null,
        takenOn: startOfTrtDay(v.takenOn),
        durationMinutes: v.durationMinutes ?? null,
      })
      .returning({ id: mockExams.id });

    const resultRows = [...rolled.entries()].map(([subjectId, c]) => ({
      mockExamId: exam.id,
      subjectId,
      correctCount: c.correct,
      wrongCount: c.wrong,
      blankCount: c.blank ?? 0,
      net: computeNet(c.correct, c.wrong, divisor),
    }));
    await db.insert(mockExamResults).values(resultRows);

    return { ok: true, data: { mockExamId: exam.id } };
  });
}

/** Coach flags "deneme analizi yapıldı". */
export async function setAnalysisDone(
  mockExamId: number,
  done: boolean,
): Promise<ActionResult<{ mockExamId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const db = getDb();
    await db
      .update(mockExams)
      .set({ analysisDone: done, updatedAt: new Date() })
      .where(eq(mockExams.id, mockExamId));
    return { ok: true, data: { mockExamId } };
  });
}

"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  resourceQuestionLogs,
  resources,
  topicResourceProgress,
} from "@/db/schema";
import { startOfTrtDay } from "@/lib/dates";
import {
  createResourceSchema,
  logResourceQuestionsSchema,
  toggleTopicResourceSchema,
  updateResourceSchema,
} from "@/lib/validation-konular";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

const clean = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

/** Kaynak ekler (koç ya da öğrencinin kendisi — kitap/fasikül/soru bankası…). */
export async function createResource(
  input: unknown,
): Promise<ActionResult<{ resourceId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = createResourceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, v.enrollmentId, user);
    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, v.enrollmentId),
    });
    if (!enrollment) return actionError("Kayıt bulunamadı.");

    const [row] = await db
      .insert(resources)
      .values({
        enrollmentId: v.enrollmentId,
        name: v.name,
        author: clean(v.author),
        notes: clean(v.notes),
        url: clean(v.url),
        subjectId: v.subjectId ?? null,
      })
      .returning({ id: resources.id });
    return { ok: true, data: { resourceId: row.id } };
  });
}

/** Kaynağı düzenler / arşivler (koç ya da öğrencinin kendisi; geçmiş korunur). */
export async function updateResource(
  input: unknown,
): Promise<ActionResult<{ resourceId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = updateResourceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    const existing = await db.query.resources.findFirst({
      where: eq(resources.id, v.resourceId),
    });
    if (!existing) return actionError("Kaynak bulunamadı.");
    await assertEnrollmentAccess(db, existing.enrollmentId, user);

    await db
      .update(resources)
      .set({
        name: v.name,
        author: clean(v.author),
        notes: clean(v.notes),
        url: clean(v.url),
        subjectId: v.subjectId ?? null,
        ...(v.isActive !== undefined ? { isActive: v.isActive } : {}),
      })
      .where(eq(resources.id, v.resourceId));
    return { ok: true, data: { resourceId: v.resourceId } };
  });
}

/**
 * Konu×kaynak "Bitti" hücresi — koç ya da öğrencinin kendisi işaretler
 * (yetki assertEnrollmentAccess ile; onay akışı yok, iki rol de yazar).
 */
export async function toggleTopicResourceDone(
  input: unknown,
): Promise<ActionResult<{ isDone: boolean }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = toggleTopicResourceSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, v.enrollmentId, user);

    // Kaynak bu kayda ait olmalı (başka öğrencinin kaynağına yazılamaz).
    const resource = await db.query.resources.findFirst({
      where: eq(resources.id, v.resourceId),
    });
    if (!resource || resource.enrollmentId !== v.enrollmentId) {
      return actionError("Kaynak bu öğrenciye ait değil.");
    }

    await db
      .insert(topicResourceProgress)
      .values({
        enrollmentId: v.enrollmentId,
        topicId: v.topicId,
        resourceId: v.resourceId,
        isDone: v.isDone,
        completedAt: v.isDone ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [
          topicResourceProgress.enrollmentId,
          topicResourceProgress.topicId,
          topicResourceProgress.resourceId,
        ],
        set: {
          isDone: v.isDone,
          completedAt: v.isDone ? new Date() : null,
        },
      });
    return { ok: true, data: { isDone: v.isDone } };
  });
}

/**
 * Bir kaynaktan bir günde çözülen soru sayısını kaydeder (mutlak değer, upsert).
 * Koç ya da öğrencinin kendisi; konu takibinden ayrı per-kaynak sayaç.
 */
export async function logResourceQuestions(
  input: unknown,
): Promise<ActionResult<{ questionCount: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = logResourceQuestionsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, v.enrollmentId, user);

    const resource = await db.query.resources.findFirst({
      where: eq(resources.id, v.resourceId),
    });
    if (!resource || resource.enrollmentId !== v.enrollmentId) {
      return actionError("Kaynak bu öğrenciye ait değil.");
    }

    const day = startOfTrtDay(v.logDate);
    await db
      .insert(resourceQuestionLogs)
      .values({
        enrollmentId: v.enrollmentId,
        resourceId: v.resourceId,
        logDate: day,
        questionCount: v.questionCount,
      })
      .onConflictDoUpdate({
        target: [
          resourceQuestionLogs.enrollmentId,
          resourceQuestionLogs.resourceId,
          resourceQuestionLogs.logDate,
        ],
        set: { questionCount: v.questionCount, updatedAt: new Date() },
      });
    return { ok: true, data: { questionCount: v.questionCount } };
  });
}

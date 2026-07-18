"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { enrollments, resources, topicResourceProgress } from "@/db/schema";
import {
  createResourceSchema,
  toggleTopicResourceSchema,
  updateResourceSchema,
} from "@/lib/validation-konular";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

const clean = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

/** Koç: öğrenciye kaynak ekler (kitap/fasikül/soru bankası…). */
export async function createResource(
  input: unknown,
): Promise<ActionResult<{ resourceId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = createResourceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
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
        subjectId: v.subjectId ?? null,
      })
      .returning({ id: resources.id });
    return { ok: true, data: { resourceId: row.id } };
  });
}

/** Koç: kaynağı düzenler / arşivler (isActive=false — geçmiş korunur). */
export async function updateResource(
  input: unknown,
): Promise<ActionResult<{ resourceId: number }>> {
  return guarded(async () => {
    await requireCoach();
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

    await db
      .update(resources)
      .set({
        name: v.name,
        author: clean(v.author),
        notes: clean(v.notes),
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

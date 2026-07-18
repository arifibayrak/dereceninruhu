"use server";

import { and, eq, notInArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  contentItems,
  contentViews,
  contentVisibility,
} from "@/db/schema";
import {
  assignContentSchema,
  createContentSchema,
  deleteContentSchema,
  toggleContentViewedSchema,
} from "@/lib/validation-icerik";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

/** Koç: içerik ekler (video/PDF/not/bağlantı); istersen doğrudan atar. */
export async function createContentItem(
  input: unknown,
): Promise<ActionResult<{ contentItemId: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = createContentSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const [item] = await db
      .insert(contentItems)
      .values({
        type: v.type,
        title: v.title,
        url: v.url?.trim() || null,
        body: v.body?.trim() || null,
        examTemplateId: v.examTemplateId ?? null,
        subjectId: v.subjectId ?? null,
        topicId: v.topicId ?? null,
        isLibrary: v.isLibrary,
        createdByUserId: user.id,
      })
      .returning({ id: contentItems.id });

    if (v.enrollmentIds && v.enrollmentIds.length > 0) {
      await db
        .insert(contentVisibility)
        .values(
          v.enrollmentIds.map((enrollmentId) => ({
            contentItemId: item.id,
            enrollmentId,
          })),
        )
        .onConflictDoNothing();
    }
    return { ok: true, data: { contentItemId: item.id } };
  });
}

/** Koç: görünürlük kümesini değiştirir (verilmeyen atamalar kaldırılır). */
export async function assignContent(
  input: unknown,
): Promise<ActionResult<{ contentItemId: number; count: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = assignContentSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const v = parsed.data;
    const db = getDb();

    const item = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, v.contentItemId),
    });
    if (!item) return actionError("İçerik bulunamadı.");

    if (v.enrollmentIds.length === 0) {
      await db
        .delete(contentVisibility)
        .where(eq(contentVisibility.contentItemId, v.contentItemId));
    } else {
      await db
        .delete(contentVisibility)
        .where(
          and(
            eq(contentVisibility.contentItemId, v.contentItemId),
            notInArray(contentVisibility.enrollmentId, v.enrollmentIds),
          ),
        );
      await db
        .insert(contentVisibility)
        .values(
          v.enrollmentIds.map((enrollmentId) => ({
            contentItemId: v.contentItemId,
            enrollmentId,
          })),
        )
        .onConflictDoNothing();
    }
    return {
      ok: true,
      data: { contentItemId: v.contentItemId, count: v.enrollmentIds.length },
    };
  });
}

/** Koç: içeriği (atama ve izlenme kayıtlarıyla) siler. */
export async function deleteContentItem(
  input: unknown,
): Promise<ActionResult<{ contentItemId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = deleteContentSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const id = parsed.data.contentItemId;
    const db = getDb();
    await db.delete(contentViews).where(eq(contentViews.contentItemId, id));
    await db
      .delete(contentVisibility)
      .where(eq(contentVisibility.contentItemId, id));
    await db.delete(contentItems).where(eq(contentItems.id, id));
    return { ok: true, data: { contentItemId: id } };
  });
}

/** İzlendi/okundu işareti — öğrenci kendi kaydında, koç herkeste. */
export async function toggleContentViewed(
  input: unknown,
): Promise<ActionResult<{ viewed: boolean }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = toggleContentViewedSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, v.enrollmentId, user);

    if (v.viewed) {
      await db
        .insert(contentViews)
        .values({
          contentItemId: v.contentItemId,
          enrollmentId: v.enrollmentId,
        })
        .onConflictDoNothing();
    } else {
      await db
        .delete(contentViews)
        .where(
          and(
            eq(contentViews.contentItemId, v.contentItemId),
            eq(contentViews.enrollmentId, v.enrollmentId),
          ),
        );
    }
    return { ok: true, data: { viewed: v.viewed } };
  });
}

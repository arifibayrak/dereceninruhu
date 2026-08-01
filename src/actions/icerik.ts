"use server";

import { and, eq, inArray } from "drizzle-orm";
import { getDb, getR2 } from "@/db";
import { chunkForD1 } from "@/lib/d1";
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

    // Dosya yüklendiyse dış bağlantı yok sayılır — tek kaynak.
    const fileKey = v.fileKey?.trim() || null;

    const [item] = await db
      .insert(contentItems)
      .values({
        type: v.type,
        title: v.title,
        url: fileKey ? null : v.url?.trim() || null,
        body: v.body?.trim() || null,
        fileKey,
        fileName: fileKey ? v.fileName?.trim() || null : null,
        fileSize: fileKey ? (v.fileSize ?? null) : null,
        fileType: fileKey ? v.fileType?.trim() || null : null,
        examTemplateId: v.examTemplateId ?? null,
        subjectId: v.subjectId ?? null,
        topicId: v.topicId ?? null,
        isLibrary: v.isLibrary,
        createdByUserId: user.id,
      })
      .returning({ id: contentItems.id });

    // D1: sorgu başına 100 parametre — satır başına 3 `?` (item, enrollment,
    // created_at). Öğrenci sayısı büyüdükçe "tümüne ata" bu sınırı aşardı.
    for (const part of chunkForD1(v.enrollmentIds ?? [], 3)) {
      await db
        .insert(contentVisibility)
        .values(
          part.map((enrollmentId) => ({
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
    const user = await requireCoach();
    const parsed = assignContentSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const v = parsed.data;
    const db = getDb();

    const item = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, v.contentItemId),
    });
    if (!item) return actionError("İçerik bulunamadı.");
    // Koç yalnız kendi oluşturduğu içeriği yönetebilir; yönetici hepsini.
    if (user.role === "coach" && item.createdByUserId !== user.id) {
      return actionError("Bu içerik sana ait değil.");
    }

    if (v.enrollmentIds.length === 0) {
      await db
        .delete(contentVisibility)
        .where(eq(contentVisibility.contentItemId, v.contentItemId));
    } else {
      // `not in (…)` parçalanamaz (her parça diğerinin satırlarını silerdi),
      // bu yüzden fark JS'te hesaplanıp `in (…)` ile parça parça silinir.
      const current = await db
        .select({ enrollmentId: contentVisibility.enrollmentId })
        .from(contentVisibility)
        .where(eq(contentVisibility.contentItemId, v.contentItemId));
      const keep = new Set(v.enrollmentIds);
      const drop = current
        .map((r) => r.enrollmentId)
        .filter((id) => !keep.has(id));
      for (const part of chunkForD1(drop, 1, 1)) {
        await db
          .delete(contentVisibility)
          .where(
            and(
              eq(contentVisibility.contentItemId, v.contentItemId),
              inArray(contentVisibility.enrollmentId, part),
            ),
          );
      }
      for (const part of chunkForD1(v.enrollmentIds, 3)) {
        await db
          .insert(contentVisibility)
          .values(
            part.map((enrollmentId) => ({
              contentItemId: v.contentItemId,
              enrollmentId,
            })),
          )
          .onConflictDoNothing();
      }
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
    const user = await requireCoach();
    const parsed = deleteContentSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const id = parsed.data.contentItemId;
    const db = getDb();
    const item = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, id),
      columns: { id: true, createdByUserId: true, fileKey: true },
    });
    if (!item) return actionError("İçerik bulunamadı.");
    // Koç yalnız kendi oluşturduğu içeriği silebilir; yönetici hepsini.
    if (user.role === "coach" && item.createdByUserId !== user.id) {
      return actionError("Bu içerik sana ait değil.");
    }
    await db.delete(contentViews).where(eq(contentViews.contentItemId, id));
    await db
      .delete(contentVisibility)
      .where(eq(contentVisibility.contentItemId, id));
    await db.delete(contentItems).where(eq(contentItems.id, id));
    if (item.fileKey) {
      try {
        await getR2().delete(item.fileKey);
      } catch {
        // Kayıt gitti; artık sahipsiz kalan objeyi yutmak sorun değil.
      }
    }
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

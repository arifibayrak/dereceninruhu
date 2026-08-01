"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { mockExams, mockTopicErrors } from "@/db/schema";
import { chunkForD1 } from "@/lib/d1";
import { upsertTopicErrorsSchema } from "@/lib/validation-analiz";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

/**
 * Deneme analizi: konu bazlı eksik (yanlış+boş) girişi.
 * Koç ya da öğrencinin kendisi (yalnız kendi kaydı) girebilir.
 * errorCount 0 → satır silinir; giriş kaldıkça mockExams.analysisDone = true.
 */
export async function upsertTopicErrors(
  input: unknown,
): Promise<ActionResult<{ mockExamId: number; analysisDone: boolean }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = upsertTopicErrorsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const mock = await db.query.mockExams.findFirst({
      where: eq(mockExams.id, v.mockExamId),
    });
    if (!mock) return actionError("Deneme bulunamadı.");
    await assertEnrollmentAccess(db, mock.enrollmentId, user);

    const positives = v.entries.filter((e) => e.errorCount > 0);
    const zeros = v.entries.filter((e) => e.errorCount === 0);

    // D1: sorgu başına en fazla 100 parametre. Bir denemede yüzlerce konu
    // olabildiği için hem silme (konu başına 1 `?` + 1 sabit) hem yazma
    // (satır başına 4 `?`: exam, topic, error_count, created_at) parçalanır.
    for (const part of chunkForD1(zeros, 1, 1)) {
      await db
        .delete(mockTopicErrors)
        .where(
          and(
            eq(mockTopicErrors.mockExamId, v.mockExamId),
            inArray(
              mockTopicErrors.topicId,
              part.map((e) => e.topicId),
            ),
          ),
        );
    }
    for (const part of chunkForD1(positives, 4)) {
      await db
        .insert(mockTopicErrors)
        .values(
          part.map((e) => ({
            mockExamId: v.mockExamId,
            topicId: e.topicId,
            errorCount: e.errorCount,
          })),
        )
        .onConflictDoUpdate({
          target: [mockTopicErrors.mockExamId, mockTopicErrors.topicId],
          set: { errorCount: sql`excluded.error_count` },
        });
    }

    // Giriş kaldı mı? Analiz bayrağını gerçek durumdan türet.
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mockTopicErrors)
      .where(eq(mockTopicErrors.mockExamId, v.mockExamId));
    const analysisDone = Number(countRow?.count ?? 0) > 0;
    if (analysisDone !== mock.analysisDone) {
      await db
        .update(mockExams)
        .set({ analysisDone, updatedAt: new Date() })
        .where(eq(mockExams.id, v.mockExamId));
    }

    return { ok: true, data: { mockExamId: v.mockExamId, analysisDone } };
  });
}

"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { enrollments, students } from "@/db/schema";
import {
  actionError,
  guarded,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";

/**
 * Öğrenci "Görüşmemi planladım" der — kendi aktif kaydına `callsScheduledAt`
 * damgalar (gerekli-adım nudge'ı kapanır). Sahiplik `students.userId` üzerinden;
 * istemciden id alınmaz. Idempotent: zaten damgalıysa tekrar yazmaz.
 */
export async function markCallsScheduled(): Promise<ActionResult<void>> {
  return guarded(async () => {
    const user = await requireUser();
    const db = getDb();

    const student = await db.query.students.findFirst({
      where: eq(students.userId, user.id),
    });
    if (!student) {
      return actionError(
        "Öğrenci profili bulunamadı. Daveti tamamladıysan tekrar giriş yap.",
      );
    }

    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, student.id),
        eq(enrollments.status, "active"),
      ),
    });
    if (!enrollment) return actionError("Aktif kaydın bulunamadı.");

    if (!enrollment.callsScheduledAt) {
      await db
        .update(enrollments)
        .set({ callsScheduledAt: new Date(), updatedAt: new Date() })
        .where(eq(enrollments.id, enrollment.id));
    }

    revalidatePath("/ogrenci");
    revalidatePath("/ogrenci/gorusmeler");
    return { ok: true, data: undefined };
  });
}

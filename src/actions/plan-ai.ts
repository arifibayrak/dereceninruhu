"use server";

import { getDb } from "@/db";
import { generatePlanDraftSchema } from "@/lib/validation";
import {
  actionError,
  guarded,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";
import {
  getEnrollmentDetailByStudentId,
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import {
  generateProgramDraft,
  type ProgramDraft,
} from "@/lib/ai/plan-generate";

/**
 * AI ile haftalık program TASLAĞI üretir — HİÇBİR ŞEY YAZMAZ, öneri döner.
 * Koç bir öğrenci için (studentId) çağırır; öğrenci kendi kaydı için (studentId
 * yok) çağırır. Öğrenci başkasının studentId'sini gönderse bile kendi kaydına
 * düşer. Öneriyi kullanıcı gözden geçirip onaylayınca `addPlanTask` ile yazılır.
 */
export async function generatePlanDraft(
  input: unknown,
): Promise<ActionResult<ProgramDraft>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = generatePlanDraftSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { studentId, weekStart, focus } = parsed.data;
    const db = getDb();

    const isCoach = user.role === "coach" || user.role === "admin";
    const detail =
      isCoach && studentId
        ? await getEnrollmentDetailByStudentId(studentId)
        : await getEnrollmentDetailByUserId(user.id);
    if (!detail) return actionError("Kayıt bulunamadı.");
    const enrollmentId = detail.enrollment.id;
    await assertEnrollmentAccess(db, enrollmentId, user);

    const sections = await getSectionsForEnrollment(
      detail.enrollment.examTemplateId,
      detail.enrollment.trackCode,
    );
    const subjects = sections.flatMap((s) =>
      s.loggable.map((sub) => ({ id: sub.id, name: sub.name })),
    );

    const draft = await generateProgramDraft({
      enrollmentId,
      weekStart,
      focus: focus || null,
      subjects,
    });
    if (draft.topics.length === 0) {
      return actionError("AI şu an bir program öneremedi — tekrar dene.");
    }
    return { ok: true, data: draft };
  });
}

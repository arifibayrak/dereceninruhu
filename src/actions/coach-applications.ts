"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { coachApplications } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import {
  createCoachApplicationSchema,
  updateCoachApplicationStatusSchema,
} from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

/**
 * PUBLIC — /koc-basvuru formu. Auth yok; Zod + bal küpü (`website`) korur.
 * Başvuru 'yeni' durumuyla düşer; YALNIZ yönetici /koc/basvurular'dan yönetir.
 */
export async function createCoachApplication(
  input: unknown,
): Promise<ActionResult<{ applicationId: number }>> {
  return guarded(async () => {
    const parsed = createCoachApplicationSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();

    const [application] = await db
      .insert(coachApplications)
      .values({
        name: v.name.trim(),
        phone: normalizePhone(v.phone),
        email: v.email?.trim() ? v.email.trim() : null,
        subjects: v.subjects.trim(),
        experience: v.experience?.trim() ? v.experience.trim() : null,
        link: v.link?.trim() ? v.link.trim() : null,
        message: v.message?.trim() ? v.message.trim() : null,
        status: "yeni",
        source: "site-formu",
      })
      .returning({ id: coachApplications.id });

    revalidatePath("/koc/basvurular");
    revalidatePath("/koc");
    return { ok: true, data: { applicationId: application.id } };
  });
}

/** YÖNETİCİ — başvuru durumunu günceller; işleyen yönetici işaretlenir. */
export async function updateCoachApplicationStatus(
  input: unknown,
): Promise<ActionResult<{ applicationId: number }>> {
  return guarded(async () => {
    const admin = await requireAdmin();
    const parsed = updateCoachApplicationStatusSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz durum.");
    const { applicationId, status } = parsed.data;

    const db = getDb();
    const existing = await db.query.coachApplications.findFirst({
      where: eq(coachApplications.id, applicationId),
      columns: { id: true },
    });
    if (!existing) return actionError("Başvuru bulunamadı.");

    await db
      .update(coachApplications)
      .set({ status, reviewedByUserId: admin.id })
      .where(eq(coachApplications.id, applicationId));

    revalidatePath("/koc/basvurular");
    revalidatePath("/koc");
    return { ok: true, data: { applicationId } };
  });
}

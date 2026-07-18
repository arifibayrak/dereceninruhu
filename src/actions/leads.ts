"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import { createLeadSchema, updateLeadStatusSchema } from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

/**
 * PUBLIC — /iletisim formu. Auth yok; Zod + bal küpü (`website`) korur.
 * Lead 'yeni' durumuyla havuza düşer; koç /koc/leadler'den yönetir.
 */
export async function createLead(
  input: unknown,
): Promise<ActionResult<{ leadId: number }>> {
  return guarded(async () => {
    const parsed = createLeadSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();

    const [lead] = await db
      .insert(leads)
      .values({
        name: v.name.trim(),
        phone: normalizePhone(v.phone),
        exam: v.exam,
        message: v.message?.trim() ? v.message.trim() : null,
        status: "yeni",
        source: "site-formu",
      })
      .returning({ id: leads.id });

    revalidatePath("/koc/leadler");
    return { ok: true, data: { leadId: lead.id } };
  });
}

/** Koç — lead durumunu günceller (yeni → görüşüldü → kayıt / kayıp). */
export async function updateLeadStatus(
  input: unknown,
): Promise<ActionResult<{ leadId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = updateLeadStatusSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz durum.");
    const { leadId, status } = parsed.data;

    const db = getDb();
    const existing = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
      columns: { id: true },
    });
    if (!existing) return actionError("Lead bulunamadı.");

    await db.update(leads).set({ status }).where(eq(leads.id, leadId));

    revalidatePath("/koc/leadler");
    revalidatePath("/koc");
    return { ok: true, data: { leadId } };
  });
}

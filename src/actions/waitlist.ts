"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { waitlistEntries } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import {
  createWaitlistSchema,
  updateWaitlistStatusSchema,
} from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

/**
 * PUBLIC — /bekleme-listesi formu. Auth yok; Zod + bal küpü (`website`) korur.
 * Kayıt 'bekliyor' durumuyla listeye düşer; koç /koc/bekleme'den yönetir.
 */
export async function createWaitlistEntry(
  input: unknown,
): Promise<ActionResult<{ entryId: number }>> {
  return guarded(async () => {
    const parsed = createWaitlistSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();

    const [entry] = await db
      .insert(waitlistEntries)
      .values({
        name: v.name.trim(),
        phone: normalizePhone(v.phone),
        exam: v.exam,
        message: v.message?.trim() ? v.message.trim() : null,
        status: "bekliyor",
        source: "site-formu",
      })
      .returning({ id: waitlistEntries.id });

    revalidatePath("/koc/bekleme");
    revalidatePath("/koc");
    return { ok: true, data: { entryId: entry.id } };
  });
}

/** Koç/yönetici — bekleme durumunu günceller (bekliyor → davet → kayıt/ayrıldı). */
export async function updateWaitlistStatus(
  input: unknown,
): Promise<ActionResult<{ entryId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = updateWaitlistStatusSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz durum.");
    const { entryId, status } = parsed.data;

    const db = getDb();
    const existing = await db.query.waitlistEntries.findFirst({
      where: eq(waitlistEntries.id, entryId),
      columns: { id: true },
    });
    if (!existing) return actionError("Kayıt bulunamadı.");

    await db
      .update(waitlistEntries)
      .set({ status })
      .where(eq(waitlistEntries.id, entryId));

    revalidatePath("/koc/bekleme");
    revalidatePath("/koc");
    return { ok: true, data: { entryId } };
  });
}

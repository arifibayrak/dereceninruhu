"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { messageTemplates } from "@/db/schema";
import { upsertMessageTemplateSchema } from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

/**
 * Toplu mesaj şablonları CRUD — /koc/duyuru. Şablonlar kadro geneli (global);
 * hem koç hem yönetici düzenleyebilir. Doğrulama server-side Zod. `{ad}` gövdede
 * gönderim anında (client) değişir, burada dokunmayız.
 */

function idParam(input: unknown): number | null {
  const n = Number(input);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function upsertMessageTemplate(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = upsertMessageTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();
    const values = {
      category: v.category,
      label: v.label,
      body: v.body,
      sortOrder: v.sortOrder,
      isActive: v.isActive,
    };
    if (v.id) {
      await db
        .update(messageTemplates)
        .set(values)
        .where(eq(messageTemplates.id, v.id));
      revalidatePath("/koc/duyuru");
      return { ok: true, data: { id: v.id } };
    }
    const [row] = await db
      .insert(messageTemplates)
      .values({ ...values, createdByUserId: user.id })
      .returning({ id: messageTemplates.id });
    revalidatePath("/koc/duyuru");
    return { ok: true, data: { id: row.id } };
  });
}

export async function deleteMessageTemplate(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    await requireCoach();
    const id = idParam(input);
    if (!id) return actionError("Geçersiz kayıt.");
    await getDb().delete(messageTemplates).where(eq(messageTemplates.id, id));
    revalidatePath("/koc/duyuru");
    return { ok: true, data: undefined };
  });
}

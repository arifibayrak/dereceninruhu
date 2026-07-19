"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { cohortSettings } from "@/db/schema";
import { updateCohortSettingsSchema } from "@/lib/validation-admin";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

/**
 * YÖNETİCİ — tek satırlık (id=1) dönem/kontenjan ayarını yükler (upsert).
 * Buradaki sayılar sitede gösterilen PAZARLAMA değerleridir — gerçek
 * kapasite/kayıt değil (bkz. AGENTS.md — premium konumlandırma).
 */
export async function updateCohortSettings(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = updateCohortSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();

    const values = {
      donemLabel: v.donemLabel.trim(),
      displayCapacity: v.displayCapacity ?? null,
      displayFilled: v.displayFilled,
      closesOn: v.closesOn ?? null,
      status: v.status,
      waitlistOpen: v.waitlistOpen,
      scarcityVisible: v.scarcityVisible,
      updatedAt: new Date(),
    };

    await db
      .insert(cohortSettings)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: cohortSettings.id, set: values });

    revalidatePath("/");
    revalidatePath("/fiyatlar");
    revalidatePath("/bekleme-listesi");
    revalidatePath("/koc/site");
    return { ok: true, data: undefined };
  });
}

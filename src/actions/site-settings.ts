"use server";

import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import { updateSiteSettingsSchema } from "@/lib/validation-admin";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

/**
 * YÖNETİCİ — tek satırlık (id=1) site iletişim/sosyal ayarını yükler (upsert).
 * Pazarlama sitesindeki yüzen WhatsApp butonunu ve header/footer sosyal
 * ikonlarını besler; numara değişince kod deploy'u gerekmesin diye DB'de.
 */
export async function updateSiteSettings(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = updateSiteSettingsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();

    const values = {
      // 10 haneye indirge — wa.me linkini `buildWaLink` 90 ön ekiyle kurar.
      whatsappPhone: v.whatsappPhone ? normalizePhone(v.whatsappPhone) : null,
      whatsappMessage: v.whatsappMessage,
      whatsappVisible: v.whatsappVisible,
      instagramUrl: v.instagramUrl,
      tiktokUrl: v.tiktokUrl,
      youtubeUrl: v.youtubeUrl,
      publicStatsVisible: v.publicStatsVisible,
      updatedAt: new Date(),
    };

    await db
      .insert(siteSettings)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: siteSettings.id, set: values });

    // Ayar tüm pazarlama kabuğunu etkiler (header/footer/FAB) → kökü tazele.
    revalidatePath("/", "layout");
    revalidatePath("/koc/site");
    return { ok: true, data: undefined };
  });
}

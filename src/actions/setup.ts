"use server";

import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import {
  createCoachSchema,
  setupAdminSchema,
  updateMyContactSchema,
} from "@/lib/validation";
import {
  actionError,
  guarded,
  requireAdmin,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

function fieldErrorsOf(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) out[i.path.join(".")] = i.message;
  return out;
}

/** True if any admin/coach account exists (kurulum tamamlandı mı?). */
export async function hasAnyCoach(): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.role, ["admin", "coach"]))
    .limit(1);
  return rows.length > 0;
}

/**
 * İlk kurulum: hiç koç/yönetici yoksa ilk yönetici hesabını oluşturur.
 * Public by necessity — but self-disables the moment a coach exists.
 */
export async function setupFirstAdmin(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  return guarded(async () => {
    const parsed = setupAdminSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const db = getDb();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["admin", "coach"]))
      .limit(1);
    if (existing.length > 0) {
      return actionError("Kurulum zaten yapılmış. Giriş sayfasını kullanın.");
    }

    const { name, email, password } = parsed.data;
    let userId: string;
    try {
      const res = await getAuth().api.signUpEmail({
        body: { email, password, name },
      });
      userId = res.user.id;
    } catch {
      return actionError("Bu e-posta ile bir hesap zaten var.");
    }

    // role is input:false — set it server-side via drizzle.
    await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { ok: true, data: { email } };
  });
}

/**
 * Koç ekle — YALNIZ yönetici (Arif/Hakan) yeni koç hesabı oluşturur.
 * Sıradan koçlar koç ekleyemez; ekip yönetimi admin-only /koc/yonetim'de.
 */
export async function createCoach(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = createCoachSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const { name, email, password, phone, telegram, instagram, iban } =
      parsed.data;
    const db = getDb();

    let userId: string;
    try {
      const res = await getAuth().api.signUpEmail({
        body: { email, password, name },
      });
      userId = res.user.id;
    } catch {
      return actionError("Bu e-posta ile bir hesap zaten var.");
    }

    await db
      .update(users)
      .set({
        role: "coach",
        phoneNumber: phone ? normalizePhone(phone) : null,
        telegram: telegram?.trim() || null,
        instagram: instagram?.trim() || null,
        iban: iban?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { ok: true, data: { email } };
  });
}

/** Koç kendi iletişim/ödeme bilgisini günceller (telefon/telegram/instagram/IBAN). */
export async function updateMyContact(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = updateMyContactSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const { phone, telegram, instagram, calBookingUrl, iban } = parsed.data;
    const db = getDb();

    await db
      .update(users)
      .set({
        phoneNumber: phone ? normalizePhone(phone) : null,
        telegram: telegram?.trim() || null,
        instagram: instagram?.trim() || null,
        calBookingUrl: calBookingUrl?.trim() || null,
        iban: iban?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { ok: true, data: undefined };
  });
}

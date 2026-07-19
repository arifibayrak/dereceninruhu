"use server";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { students, users } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import {
  activateByPhoneSchema,
  lookupActivationSchema,
} from "@/lib/validation";
import { actionError, guarded, type ActionResult } from "@/actions/_guard";

/**
 * /katil telefon adımı — kimlik dökmeden yalnız bir durum döner:
 *  - "login":    bu telefonla giriş yapabilen bir hesap var → PIN iste.
 *  - "activate": kayıt var ama hesap yok → ilk kez PIN belirle.
 *  - "join":     kayıt yok → koç onayı için başvuru formu.
 * Ad/sınav gibi bilgi DÖNMEZ (telefon numarası daha kolay tahmin edilebilir).
 */
export async function lookupActivation(
  input: unknown,
): Promise<ActionResult<{ status: "login" | "activate" | "join" }>> {
  return guarded<{ status: "login" | "activate" | "join" }>(async () => {
    const parsed = lookupActivationSchema.safeParse(input);
    // Honeypot doluysa: bota "join" göster, kayıt oluşturma yok.
    if (parsed.success && parsed.data.website) {
      return { ok: true, data: { status: "join" } };
    }
    if (!parsed.success) {
      return actionError("Geçerli bir cep telefonu girin (5XX XXX XX XX).");
    }

    const phone = normalizePhone(parsed.data.phone);
    const db = getDb();
    const matches = await db.query.students.findMany({
      where: eq(students.phone, phone),
      columns: { id: true, userId: true },
    });

    if (matches.length === 0) return { ok: true, data: { status: "join" } };
    // Zaten hesabı olan varsa girişe yönlendir (aktivasyondan önce gelir).
    if (matches.some((m) => m.userId != null)) {
      return { ok: true, data: { status: "login" } };
    }
    return { ok: true, data: { status: "activate" } };
  });
}

/**
 * /katil ilk giriş: telefonla eşleşen BEKLEYEN öğrenci için Better Auth hesabını
 * oluşturur (PIN = şifre), öğrenciye bağlar ve varsa davet kodunu tüketir.
 * Mantık `acceptInvite` ile aynı; tek fark eşleme anahtarı telefon.
 */
export async function activateByPhone(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  return guarded(async () => {
    const parsed = activateByPhoneSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return actionError("Lütfen bilgileri kontrol edin.", fieldErrors);
    }

    const phone = normalizePhone(parsed.data.phone);
    const { pin } = parsed.data;
    const db = getDb();

    const matches = await db.query.students.findMany({
      where: eq(students.phone, phone),
    });
    const pending = matches.find((m) => m.userId == null);
    if (!pending) {
      if (matches.length > 0) {
        return actionError(
          "Bu telefonla zaten bir hesap var. PIN'inle giriş yapabilirsin.",
        );
      }
      return actionError(
        "Bu telefon sistemde kayıtlı değil. Koçunla iletişime geç.",
      );
    }

    const email = phoneToEmail(phone);

    let userId: string;
    try {
      const res = await getAuth().api.signUpEmail({
        body: { email, password: pin, name: pending.fullName },
      });
      userId = res.user.id;
    } catch {
      return actionError(
        "Bu telefonla zaten bir hesap var. Giriş sayfasından PIN'inle giriş yap.",
      );
    }

    // role/phoneNumber are input:false — set them server-side.
    await db
      .update(users)
      .set({ role: "student", phoneNumber: phone, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Link + consume any pending invite.
    await db
      .update(students)
      .set({ userId, inviteCode: null, updatedAt: new Date() })
      .where(eq(students.id, pending.id));

    return { ok: true, data: { email } };
  });
}

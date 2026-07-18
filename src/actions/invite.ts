"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { students, users } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { phoneToEmail } from "@/lib/phone";
import { setPinSchema } from "@/lib/validation";
import { actionError, guarded, type ActionResult } from "@/actions/_guard";

/** Public: davet sayfası öğrencinin adını + giriş e-postasını gösterir. */
export async function getInviteInfo(
  inviteCode: string,
): Promise<{ fullName: string; email: string } | null> {
  if (!inviteCode || inviteCode.length < 8) return null;
  const db = getDb();
  const student = await db.query.students.findFirst({
    where: eq(students.inviteCode, inviteCode),
  });
  if (!student || !student.phone) return null;
  return { fullName: student.fullName, email: phoneToEmail(student.phone) };
}

/**
 * Öğrenci daveti kabul + PIN belirleme: creates the Better Auth user (PIN =
 * password), links it to the student, and consumes the invite. The client then
 * signs in with (email, PIN) to establish the session.
 */
export async function acceptInvite(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  return guarded(async () => {
    const parsed = setPinSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return actionError("Lütfen bilgileri kontrol edin.", fieldErrors);
    }
    const { inviteCode, pin } = parsed.data;
    const db = getDb();

    const student = await db.query.students.findFirst({
      where: eq(students.inviteCode, inviteCode),
    });
    if (!student) return actionError("Davet bağlantısı geçersiz veya kullanılmış.");
    if (!student.phone) {
      return actionError("Telefon numaran eksik. Koçunla iletişime geç.");
    }

    const email = phoneToEmail(student.phone);

    let userId: string;
    try {
      const res = await getAuth().api.signUpEmail({
        body: { email, password: pin, name: student.fullName },
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
      .set({ role: "student", phoneNumber: student.phone, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // Link + consume the invite.
    await db
      .update(students)
      .set({ userId, inviteCode: null, updatedAt: new Date() })
      .where(eq(students.id, student.id));

    return { ok: true, data: { email } };
  });
}

"use server";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { accounts, enrollments, sessions, students } from "@/db/schema";
import {
  actionError,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";
import { revalidatePath } from "next/cache";

const resetPinSchema = z.object({
  studentId: z.coerce.number().int().positive(),
});

function newInviteCode(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/** 4 haneli rastgele PIN (baştaki sıfırlar korunur). */
function randomPin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
  return String(n).padStart(4, "0");
}

export type PinResetResult =
  | { mode: "reset"; pin: string; phone: string | null }
  | { mode: "invite"; invitePath: string; phone: string | null };

/**
 * Koç öğrencinin girişini yeniler. Hesabı varsa yeni bir PIN üretip Better
 * Auth'un kendi hash'iyle `accounts.password` satırını günceller (signIn.email
 * ile uyumlu) ve eski oturumları düşürür. Hesabı yoksa yeni bir davet kodu üretir.
 * Yetki: koç yalnız kendi kadrosundaki öğrenciyi sıfırlar; yönetici hepsini.
 */
export async function resetStudentPin(
  input: unknown,
): Promise<ActionResult<PinResetResult>> {
  return guarded<PinResetResult>(async () => {
    const actor = await requireCoach();
    const parsed = resetPinSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz öğrenci.");
    const { studentId } = parsed.data;
    const db = getDb();

    const student = await db.query.students.findFirst({
      where: eq(students.id, studentId),
      columns: { id: true, userId: true, phone: true },
    });
    if (!student) return actionError("Öğrenci bulunamadı.");

    // Koç yetkisi: yalnız kendi kadrosu. Yönetici tüm öğrencileri sıfırlar.
    if (actor.role === "coach") {
      const enr = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.status, "active"),
        ),
        columns: { coachUserId: true },
      });
      if (!enr || enr.coachUserId !== actor.id) {
        return actionError("Bu öğrenci senin kadronda değil.");
      }
    }

    // Hesabı yoksa: yeni davet kodu üret (öğrenci /davet ile ilk PIN'i belirler).
    if (!student.userId) {
      const inviteCode = newInviteCode();
      await db
        .update(students)
        .set({ inviteCode, updatedAt: new Date() })
        .where(eq(students.id, studentId));
      revalidatePath("/koc/ogrenciler");
      return {
        ok: true,
        data: {
          mode: "invite",
          invitePath: `/davet/${inviteCode}`,
          phone: student.phone,
        },
      };
    }

    // Hesabı var: yeni PIN'i Better Auth hash'iyle credential hesabına yaz.
    const pin = randomPin();
    const hash = await hashPassword(pin);
    await db
      .update(accounts)
      .set({ password: hash, updatedAt: new Date() })
      .where(
        and(
          eq(accounts.userId, student.userId),
          eq(accounts.providerId, "credential"),
        ),
      );
    // Eski oturumları düşür — eski PIN'le açık oturum kalmasın.
    await db.delete(sessions).where(eq(sessions.userId, student.userId));

    revalidatePath("/koc/ogrenciler");
    return { ok: true, data: { mode: "reset", pin, phone: student.phone } };
  });
}

"use server";

import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { accounts, enrollments, sessions, students } from "@/db/schema";
import { syncLoginPhone } from "@/lib/auth-identity";
import {
  actionError,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";
import { revalidatePath } from "next/cache";

const resetPinSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  /** Boş bırakılırsa rastgele PIN üretilir. */
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "PIN 4-6 rakam olmalı.")
    .optional()
    .or(z.literal("")),
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
 * Koç öğrencinin girişini yeniler. Hesabı varsa PIN'i (koç bir PIN yazdıysa onu,
 * yoksa rastgele üretileni) Better Auth'un kendi hash'iyle `accounts.password`
 * satırına yazar (signIn.email ile uyumlu) ve eski oturumları düşürür. Hesabı
 * yoksa yeni bir davet kodu üretir.
 *
 * Ayrıca girişi ONARIR: telefon panelden değişmişse auth satırı eski numarada
 * kalmış olabilir (öğrenci "PIN doğru ama giremiyorum" der) ve nadiren credential
 * satırı hiç oluşmamış olabilir. İkisi de burada güncel telefona eşitlenir.
 * Yetki: koç yalnız kendi kadrosundaki öğrenciyi sıfırlar; yönetici hepsini.
 */
export async function resetStudentPin(
  input: unknown,
): Promise<ActionResult<PinResetResult>> {
  return guarded<PinResetResult>(async () => {
    const actor = await requireCoach();
    const parsed = resetPinSchema.safeParse(input);
    if (!parsed.success) {
      const pinIssue = parsed.error.issues.find((i) => i.path[0] === "pin");
      return actionError(pinIssue?.message ?? "Geçersiz öğrenci.");
    }
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

    // Giriş kimliğini güncel telefona eşitle (numara değiştiyse burada onarılır).
    if (student.phone) {
      const synced = await syncLoginPhone(db, student.userId, student.phone);
      if (!synced.ok) return actionError(synced.error);
    }

    // Hesabı var: PIN'i Better Auth hash'iyle credential hesabına yaz.
    const pin = parsed.data.pin ? parsed.data.pin : randomPin();
    const hash = await hashPassword(pin);
    const now = new Date();
    const credential = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.userId, student.userId),
        eq(accounts.providerId, "credential"),
      ),
      columns: { id: true },
    });
    if (credential) {
      await db
        .update(accounts)
        .set({ password: hash, updatedAt: now })
        .where(eq(accounts.id, credential.id));
    } else {
      // Şifre satırı yoksa PIN hiçbir yere yazılmaz ve giriş sessizce başarısız
      // olurdu — Better Auth'un beklediği credential satırını oluştur.
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        accountId: student.userId,
        providerId: "credential",
        userId: student.userId,
        password: hash,
        createdAt: now,
        updatedAt: now,
      });
    }
    // Eski oturumları düşür — eski PIN'le açık oturum kalmasın.
    await db.delete(sessions).where(eq(sessions.userId, student.userId));

    revalidatePath("/koc/ogrenciler");
    return { ok: true, data: { mode: "reset", pin, phone: student.phone } };
  });
}

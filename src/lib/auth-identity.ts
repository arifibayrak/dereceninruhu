import { and, eq, ne } from "drizzle-orm";

import type { DB } from "@/db";
import { users } from "@/db/schema";
import { normalizePhone, phoneToEmail } from "@/lib/phone";

/**
 * Giriş kimliği = telefon. Better Auth kaydı telefondan türetilen bir e-posta
 * ile açılır (`phoneToEmail`), yani `users.email` öğrencinin telefonunu taşır.
 *
 * Panelden telefon değiştiğinde bu satır eskiden GÜNCELLENMİYORDU: öğrenci
 * listede yeni numarasını görüyor ama giriş hâlâ eski numarayı bekliyordu →
 * "PIN doğru ama giremiyorum". Bu yardımcı, öğrencinin `students.phone` değerini
 * tek doğru kaynak kabul edip auth satırını ona eşitler.
 */
export async function syncLoginPhone(
  db: DB,
  userId: string,
  rawPhone: string,
): Promise<{ ok: true; changed: boolean } | { ok: false; error: string }> {
  const phone = normalizePhone(rawPhone);
  if (!/^5\d{9}$/.test(phone)) {
    return { ok: false, error: "Geçerli bir cep telefonu gerekli." };
  }
  const email = phoneToEmail(phone);

  const current = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, email: true, phoneNumber: true },
  });
  if (!current) return { ok: false, error: "Giriş hesabı bulunamadı." };
  if (current.email === email && current.phoneNumber === phone) {
    return { ok: true, changed: false };
  }

  // users.email ve users.phone_number UNIQUE — başka bir hesap kapmışsa dur.
  const clash = await db.query.users.findFirst({
    where: and(eq(users.email, email), ne(users.id, userId)),
    columns: { id: true },
  });
  if (clash) {
    return {
      ok: false,
      error:
        "Bu telefonla başka bir giriş hesabı var. Önce yinelenen kaydı birleştirin.",
    };
  }

  await db
    .update(users)
    .set({ email, phoneNumber: phone, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { ok: true, changed: true };
}

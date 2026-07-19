import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { extensionTokens, users } from "@/db/schema";
import type { SessionUser } from "@/actions/_guard";

/**
 * Tarayıcı eklentisi kimlik doğrulaması (bearer). Cookie oturumu
 * cross-origin (chrome-extension://) taşınamadığından, eklenti koç-başı bir
 * token gönderir; burada hash'lenip koça çözülür. Bu bir lib'dir (`"use server"`
 * DEĞİL) — route handler'lardan çağrılabilsin.
 */

/** Ham token'ın SHA-256 hex özeti (Workers Web Crypto — ekstra bağımlılık yok). */
export async function sha256Hex(token: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * `Authorization: Bearer <token>` → koç `SessionUser` (cookie yerine).
 * Yoksa/geçersiz/iptal → "Yetkisiz"; öğrenci token'ı → "Bu işlem için koç
 * yetkisi gerekli" (mesajlar `_guard` ile aynı). Dönen şekil `_guard`'ınki ile
 * özdeş olduğundan `assertEnrollmentAccess` değişmeden çalışır. `last_used_at`
 * her başarılı doğrulamada güncellenir.
 */
export async function requireCoachFromBearer(
  req: Request,
): Promise<SessionUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new Error("Yetkisiz");

  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      tokenId: extensionTokens.id,
    })
    .from(extensionTokens)
    .innerJoin(users, eq(users.id, extensionTokens.coachUserId))
    .where(
      and(
        eq(extensionTokens.tokenHash, await sha256Hex(token)),
        isNull(extensionTokens.revokedAt),
      ),
    )
    .limit(1);

  if (!row) throw new Error("Yetkisiz");
  if (row.role !== "coach" && row.role !== "admin") {
    throw new Error("Bu işlem için koç yetkisi gerekli");
  }

  await db
    .update(extensionTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(extensionTokens.id, row.tokenId));

  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

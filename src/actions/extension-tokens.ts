"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { extensionTokens } from "@/db/schema";
import { sha256Hex } from "@/lib/extension-auth";
import {
  actionError,
  guarded,
  requireCoach,
  type ActionResult,
} from "@/actions/_guard";

/** Kriptografik rastgele bearer token ("drx_" + base64url(32B)). */
function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64url = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `drx_${b64url}`;
}

/**
 * Koç — yeni eklenti token'ı üretir. Düz metin YALNIZ burada, bir kez döner;
 * DB'ye yalnız SHA-256 hex yazılır. Koç bunu eklentiye yapıştırır.
 */
export async function mintExtensionToken(
  label?: string,
): Promise<ActionResult<{ id: number; token: string }>> {
  return guarded(async () => {
    const coach = await requireCoach();
    const raw = generateToken();
    const db = getDb();
    const [row] = await db
      .insert(extensionTokens)
      .values({
        coachUserId: coach.id,
        tokenHash: await sha256Hex(raw),
        label: label?.trim() ? label.trim().slice(0, 80) : null,
      })
      .returning({ id: extensionTokens.id });

    revalidatePath("/koc/eklenti");
    return { ok: true, data: { id: row.id, token: raw } };
  });
}

/** Koç — kendi token'ını iptal eder (self-scoped; başkasınınkine dokunamaz). */
export async function revokeExtensionToken(
  id: number,
): Promise<ActionResult<{ revoked: true }>> {
  return guarded(async () => {
    const coach = await requireCoach();
    if (!Number.isInteger(id) || id <= 0) return actionError("Geçersiz token.");
    const db = getDb();
    const scoped = and(
      eq(extensionTokens.id, id),
      eq(extensionTokens.coachUserId, coach.id),
    );
    const existing = await db.query.extensionTokens.findFirst({
      where: scoped,
      columns: { id: true },
    });
    if (!existing) return actionError("Token bulunamadı.");

    await db
      .update(extensionTokens)
      .set({ revokedAt: new Date() })
      .where(scoped);

    revalidatePath("/koc/eklenti");
    return { ok: true, data: { revoked: true } };
  });
}

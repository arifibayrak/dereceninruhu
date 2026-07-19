import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { extensionTokens } from "@/db/schema";

/** UI için token satırı — `token_hash` ASLA dönmez. */
export type ExtensionTokenRow = {
  id: number;
  label: string | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

/** Koçun eklenti token'ları (yeni → eski). Hash döndürülmez. */
export async function listExtensionTokensForCoach(
  coachUserId: string,
): Promise<ExtensionTokenRow[]> {
  const db = getDb();
  return db
    .select({
      id: extensionTokens.id,
      label: extensionTokens.label,
      lastUsedAt: extensionTokens.lastUsedAt,
      revokedAt: extensionTokens.revokedAt,
      createdAt: extensionTokens.createdAt,
    })
    .from(extensionTokens)
    .where(eq(extensionTokens.coachUserId, coachUserId))
    .orderBy(desc(extensionTokens.createdAt));
}

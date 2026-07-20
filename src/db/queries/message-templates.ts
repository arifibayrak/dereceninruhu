import { asc } from "drizzle-orm";

import { getDb } from "@/db";
import { messageTemplates } from "@/db/schema";

export type MessageTemplateRow = {
  id: number;
  category: string;
  label: string;
  body: string;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Tüm şablonlar (gizliler dahil) — grup → sıra → id düzeninde.
 * Composer listeyi `isActive`'e göre süzer; yönetim paneli tümünü gösterir.
 */
export async function listMessageTemplates(): Promise<MessageTemplateRow[]> {
  const db = getDb();
  const rows = await db.query.messageTemplates.findMany({
    orderBy: [
      asc(messageTemplates.category),
      asc(messageTemplates.sortOrder),
      asc(messageTemplates.id),
    ],
  });
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    label: r.label,
    body: r.body,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }));
}

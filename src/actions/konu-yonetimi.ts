"use server";

import { and, eq, inArray, sql } from "drizzle-orm";

import { getDb, type DB } from "@/db";
import { subjects, topics } from "@/db/schema";
import { chunkForD1 } from "@/lib/d1";
import {
  addTopicsSchema,
  renameTopicSchema,
  reorderTopicsSchema,
  setTopicActiveSchema,
} from "@/lib/validation-konu-yonetimi";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

/*
 * /koc/konular — konu kataloğu (YALNIZ yönetici). Konular TÜM öğrencilerde
 * ortaktır. Silme bilerek yok: soru/deneme/program kayıtları konuya id ile
 * bağlı, pasife alınan konu seçicilerden kalkar ama geçmiş adını korur.
 * Aynı derste aynı ad (büyük/küçük harf farkı gözetmeden) iki kez olamaz.
 */

/** Türkçe büyük/küçük harf duyarsız karşılaştırma anahtarı. */
const nameKey = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr");

async function subjectTopics(db: DB, subjectId: number) {
  return db
    .select({
      id: topics.id,
      name: topics.name,
      isActive: topics.isActive,
      sortOrder: topics.sortOrder,
    })
    .from(topics)
    .where(eq(topics.subjectId, subjectId));
}

const nextSortOrder = (rows: { sortOrder: number }[]) =>
  rows.reduce((m, r) => Math.max(m, r.sortOrder), 0) + 1;

/**
 * Derse konu ekler — her satır bir konu, listenin SONUNA. Zaten aktif olan ad
 * atlanır; pasif bir konuyla aynı adsa yeni satır açılmaz, o konu geri alınır.
 */
export async function addTopics(
  input: unknown,
): Promise<
  ActionResult<{ added: number; reactivated: number; skipped: string[] }>
> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = addTopicsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { subjectId } = parsed.data;
    const db = getDb();
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, subjectId),
    });
    if (!subject) return actionError("Ders bulunamadı.");

    const existing = await subjectTopics(db, subjectId);
    const byKey = new Map(existing.map((t) => [nameKey(t.name), t]));

    let sortOrder = nextSortOrder(existing);
    const toInsert: (typeof topics.$inferInsert)[] = [];
    const toReactivate: { id: number; sortOrder: number }[] = [];
    const skipped: string[] = [];
    const seen = new Set<string>();

    for (const raw of parsed.data.names) {
      const name = raw.trim().replace(/\s+/g, " ");
      const key = nameKey(name);
      if (seen.has(key)) continue;
      seen.add(key);
      const hit = byKey.get(key);
      if (hit?.isActive) {
        skipped.push(name);
      } else if (hit) {
        toReactivate.push({ id: hit.id, sortOrder: sortOrder++ });
      } else {
        toInsert.push({ subjectId, name, sortOrder: sortOrder++, isActive: true });
      }
    }

    // Satır başına 5 parametre: subject_id, name, sort_order, is_active, created_at.
    for (const part of chunkForD1(toInsert, 5)) {
      await db.insert(topics).values(part);
    }
    for (const r of toReactivate) {
      await db
        .update(topics)
        .set({ isActive: true, sortOrder: r.sortOrder })
        .where(eq(topics.id, r.id));
    }

    return {
      ok: true,
      data: {
        added: toInsert.length,
        reactivated: toReactivate.length,
        skipped,
      },
    };
  });
}

/**
 * Konunun adını düzeltir. Konuya bağlı TÜM geçmiş kayıtlar yeni adı gösterir;
 * bu yazım düzeltmesi içindir, konuyu başka bir konuya çevirmek için değil.
 */
export async function renameTopic(
  input: unknown,
): Promise<ActionResult<{ topicId: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = renameTopicSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { topicId } = parsed.data;
    const name = parsed.data.name.replace(/\s+/g, " ");
    const db = getDb();
    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
    });
    if (!topic) return actionError("Konu bulunamadı.");

    const clash = (await subjectTopics(db, topic.subjectId)).find(
      (t) => t.id !== topicId && nameKey(t.name) === nameKey(name),
    );
    if (clash) {
      return actionError(
        clash.isActive
          ? "Bu derste aynı adlı bir konu zaten var."
          : "Bu adla pasif bir konu var — onu geri almak daha doğru olur.",
      );
    }

    await db.update(topics).set({ name }).where(eq(topics.id, topicId));
    return { ok: true, data: { topicId } };
  });
}

/** Pasife alır / geri alır. Geri alınan konu listenin sonuna eklenir. */
export async function setTopicActive(
  input: unknown,
): Promise<ActionResult<{ topicId: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = setTopicActiveSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { topicId, active } = parsed.data;
    const db = getDb();
    const topic = await db.query.topics.findFirst({
      where: eq(topics.id, topicId),
    });
    if (!topic) return actionError("Konu bulunamadı.");

    if (active) {
      const rows = await subjectTopics(db, topic.subjectId);
      await db
        .update(topics)
        .set({ isActive: true, sortOrder: nextSortOrder(rows) })
        .where(eq(topics.id, topicId));
    } else {
      await db
        .update(topics)
        .set({ isActive: false })
        .where(eq(topics.id, topicId));
    }
    return { ok: true, data: { topicId } };
  });
}

/**
 * Dersin aktif konularını verilen sıraya dizer (1, 2, 3…). Liste dersin aktif
 * konularıyla birebir aynı küme olmalı — başka sekmede değişmişse reddedilir.
 */
export async function reorderTopics(
  input: unknown,
): Promise<ActionResult<{ subjectId: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = reorderTopicsSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { subjectId, orderedIds } = parsed.data;
    const db = getDb();

    const active = (await subjectTopics(db, subjectId)).filter(
      (t) => t.isActive,
    );
    const ids = new Set(active.map((t) => t.id));
    if (
      new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.length !== ids.size ||
      orderedIds.some((id) => !ids.has(id))
    ) {
      return actionError("Konu listesi değişmiş — sayfayı yenileyip tekrar deneyin.");
    }

    const current = new Map(active.map((t) => [t.id, t.sortOrder]));
    const changed = orderedIds
      .map((id, i) => ({ id, sortOrder: i + 1 }))
      .filter((r) => current.get(r.id) !== r.sortOrder);

    // Satır başına 3 parametre (CASE'te id + sıra, IN'de id) + subject_id.
    for (const part of chunkForD1(changed, 3, 1)) {
      const cases = sql.join(
        part.map((r) => sql`when ${r.id} then ${r.sortOrder}`),
        sql` `,
      );
      await db
        .update(topics)
        .set({ sortOrder: sql`case ${topics.id} ${cases} end` })
        .where(
          and(
            eq(topics.subjectId, subjectId),
            inArray(
              topics.id,
              part.map((r) => r.id),
            ),
          ),
        );
    }
    return { ok: true, data: { subjectId } };
  });
}

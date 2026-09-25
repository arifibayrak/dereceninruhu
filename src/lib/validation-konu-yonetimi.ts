import { z } from "zod";

/**
 * /koc/konular — konu kataloğu yönetimi (YALNIZ yönetici). Konular tüm
 * öğrencilerde ortaktır; silme yok, pasife alma var (geçmiş kayıtlar konuya
 * id ile bağlı).
 */

export const TOPIC_NAME_MAX = 120;

const topicName = z
  .string()
  .trim()
  .min(2, "Konu adı en az 2 karakter olmalı.")
  .max(TOPIC_NAME_MAX, `Konu adı en fazla ${TOPIC_NAME_MAX} karakter olabilir.`);

/** Toplu ekleme: her satır bir konu (boş satırlar istemcide ayıklanır). */
export const addTopicsSchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  names: z.array(topicName).min(1, "En az bir konu yazın.").max(200),
});

export const renameTopicSchema = z.object({
  topicId: z.coerce.number().int().positive(),
  name: topicName,
});

export const setTopicActiveSchema = z.object({
  topicId: z.coerce.number().int().positive(),
  active: z.boolean(),
});

/** Dersin aktif konularının yeni sırası (baştan sona id listesi). */
export const reorderTopicsSchema = z.object({
  subjectId: z.coerce.number().int().positive(),
  orderedIds: z.array(z.coerce.number().int().positive()).min(1).max(500),
});

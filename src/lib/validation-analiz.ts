import { z } from "zod";

/**
 * Faz 5 — deneme analizi (konu bazlı eksik girişi) şemaları.
 * errorCount 0 = "bu konuda eksik kalmadı" → satır silinir.
 */
export const upsertTopicErrorsSchema = z.object({
  mockExamId: z.coerce.number().int().positive(),
  entries: z
    .array(
      z.object({
        topicId: z.coerce.number().int().positive(),
        errorCount: z.coerce.number().int().min(0).max(99),
      }),
    )
    .min(1, "En az bir konu girişi gerekli."),
});
export type UpsertTopicErrorsInput = z.infer<typeof upsertTopicErrorsSchema>;

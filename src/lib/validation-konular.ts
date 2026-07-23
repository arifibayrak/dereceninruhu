import { z } from "zod";

/** Faz 5 — kaynak takibi (kaynak CRUD + konu×kaynak "Bitti" matrisi) şemaları. */

export const createResourceSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Kaynak adı gerekli.").max(120),
  author: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  url: z.string().trim().max(500).optional().or(z.literal("")),
  subjectId: z.coerce.number().int().positive().nullish(),
});
export type CreateResourceInput = z.input<typeof createResourceSchema>;

export const updateResourceSchema = z.object({
  resourceId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Kaynak adı gerekli.").max(120),
  author: z.string().trim().max(80).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  url: z.string().trim().max(500).optional().or(z.literal("")),
  subjectId: z.coerce.number().int().positive().nullish(),
  isActive: z.boolean().optional(),
});
export type UpdateResourceInput = z.input<typeof updateResourceSchema>;

/** Bir kaynaktan bir günde çözülen soru sayısı (mutlak değer, upsert). */
export const logResourceQuestionsSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  resourceId: z.coerce.number().int().positive(),
  logDate: z.coerce.date(),
  questionCount: z.coerce.number().int().min(0).max(5000),
});
export type LogResourceQuestionsInput = z.input<
  typeof logResourceQuestionsSchema
>;

/** Konu×kaynak hücresi — "Bitti" işareti (koç ya da öğrencinin kendisi). */
export const toggleTopicResourceSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  topicId: z.coerce.number().int().positive(),
  resourceId: z.coerce.number().int().positive(),
  isDone: z.boolean(),
});
export type ToggleTopicResourceInput = z.input<typeof toggleTopicResourceSchema>;

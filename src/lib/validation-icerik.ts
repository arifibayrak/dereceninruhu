import { z } from "zod";

/** Faz 5 — içerik kütüphanesi şemaları. */

export const contentTypeSchema = z.enum(["video", "pdf", "note", "link"]);

export const createContentSchema = z
  .object({
    type: contentTypeSchema,
    title: z.string().trim().min(2, "Başlık gerekli.").max(150),
    url: z
      .union([z.url("Geçerli bir bağlantı girin."), z.literal("")])
      .optional(),
    body: z.string().trim().max(4000).optional().or(z.literal("")),
    examTemplateId: z.coerce.number().int().positive().nullish(),
    subjectId: z.coerce.number().int().positive().nullish(),
    topicId: z.coerce.number().int().positive().nullish(),
    /** true → ortak kütüphane; false → yalnız atanan öğrenciler görür. */
    isLibrary: z.boolean().default(true),
    /** Oluştururken doğrudan atanacak kayıtlar. */
    enrollmentIds: z.array(z.coerce.number().int().positive()).optional(),
  })
  .refine((v) => (v.type === "note" ? !!v.body?.trim() : true), {
    message: "Not içeriği gerekli.",
    path: ["body"],
  })
  .refine((v) => (v.type === "note" ? true : !!v.url?.trim()), {
    message: "Bağlantı gerekli.",
    path: ["url"],
  });
export type CreateContentInput = z.input<typeof createContentSchema>;

export const assignContentSchema = z.object({
  contentItemId: z.coerce.number().int().positive(),
  /** Yeni görünürlük kümesi — verilmeyenler kaldırılır. */
  enrollmentIds: z.array(z.coerce.number().int().positive()),
});
export type AssignContentInput = z.input<typeof assignContentSchema>;

export const deleteContentSchema = z.object({
  contentItemId: z.coerce.number().int().positive(),
});

/** İzlendi/okundu işareti — öğrenci kendi kaydı, koç herkes. */
export const toggleContentViewedSchema = z.object({
  contentItemId: z.coerce.number().int().positive(),
  enrollmentId: z.coerce.number().int().positive(),
  viewed: z.boolean(),
});
export type ToggleContentViewedInput = z.input<typeof toggleContentViewedSchema>;

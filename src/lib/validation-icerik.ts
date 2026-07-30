import { z } from "zod";

/** Faz 5 — içerik kütüphanesi şemaları. */

export const contentTypeSchema = z.enum([
  "video",
  "pdf",
  "doc",
  "note",
  "link",
]);

export const createContentSchema = z
  .object({
    type: contentTypeSchema,
    title: z.string().trim().min(2, "Başlık gerekli.").max(150),
    url: z
      .union([z.url("Geçerli bir bağlantı girin."), z.literal("")])
      .optional(),
    body: z.string().trim().max(4000).optional().or(z.literal("")),
    /** Cihazdan yüklenen dosya (`/api/icerik/yukle` döner). Bağlantı yerine geçer. */
    fileKey: z
      .string()
      .trim()
      .max(200)
      .regex(/^content\/[\w./-]+$/, "Geçersiz dosya.")
      .optional()
      .or(z.literal("")),
    fileName: z.string().trim().max(255).optional().or(z.literal("")),
    fileSize: z.coerce.number().int().nonnegative().nullish(),
    fileType: z.string().trim().max(120).optional().or(z.literal("")),
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
  // Not dışındaki türlerde kaynak şart, ama hangisi olduğu koçun seçimi:
  // ya cihazdan yüklenen dosya ya da dış bağlantı.
  .refine(
    (v) =>
      v.type === "note" ? true : !!v.url?.trim() || !!v.fileKey?.trim(),
    {
      message: "Dosya yükle ya da bağlantı gir.",
      path: ["url"],
    },
  );
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

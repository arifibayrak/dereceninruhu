import { z } from "zod";

/**
 * Kronometre / çalışma süresi Zod şeması. Süre tam sayı dakika (asla float).
 * enrollmentId yetki katmanında öğrencinin kendi kaydıyla doğrulanır.
 */
export const createStudyLogSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  logDate: z.coerce.date(),
  subjectId: z.coerce.number().int().positive().nullish(),
  minutes: z.coerce
    .number()
    .int()
    .min(1, "En az 1 dakika.")
    .max(1440, "En fazla 24 saat (1440 dk) girebilirsin."),
  source: z.enum(["timer", "manual"]).default("manual"),
  note: z.string().trim().max(200).optional().or(z.literal("")),
  /** R2 anahtarı (uploadStudyProof döndürür); UI doldurur, kullanıcı değil. */
  proofKey: z.string().trim().max(300).optional().or(z.literal("")),
});
export type CreateStudyLogInput = z.input<typeof createStudyLogSchema>;

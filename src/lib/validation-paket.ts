import { z } from "zod";

import { packageKindSchema } from "@/lib/validation";
import { tlToKurusSchema } from "@/lib/validation-muhasebe";

/**
 * Paket atama + özel ders Zod şemaları.
 *
 * Para her yerde integer kuruş; form ₺ metni girer, şema sınırda çevirir
 * (bkz. `@/lib/validation-muhasebe`). Süre DAKİKA saklanır ama koç saat
 * konuşur — form dakika gönderir, dönüşüm görsel katmanda kalır.
 */

const optionalDate = z.coerce.date().nullish();

/** Öğrenciye paket atama / atamayı düzenleme. */
export const assignPackageSchema = z.object({
  /** Var olan atamayı günceller; yoksa yeni satır. */
  enrollmentPackageId: z.coerce.number().int().positive().optional(),
  enrollmentId: z.coerce.number().int().positive(),
  /** Katalog paketi; NULL = kataloğa bağlı olmayan özel anlaşma. */
  packageId: z.coerce.number().int().positive().nullish(),
  name: z.string().trim().min(2, "Paket adı gerekli.").max(80),
  /** Atama anındaki fiyat — katalog sonradan değişse de bu satır sabit kalır. */
  priceTl: tlToKurusSchema,
  kind: packageKindSchema,
  lessonHours: z.coerce
    .number()
    .int("Saat tam sayı olmalı.")
    .min(0, "Saat negatif olamaz.")
    .max(500)
    .default(0),
  /** Hak yenilenme sıklığı; "yok" = tek seferlik toplam. */
  renewal: z.enum(["yok", "haftalik", "aylik"]).default("yok"),
  /** Yenilenen pakette dönem başına saat. */
  hoursPerPeriod: z.coerce
    .number()
    .int("Saat tam sayı olmalı.")
    .min(0, "Saat negatif olamaz.")
    .max(100)
    .default(0),
  startsOn: optionalDate,
  endsOn: optionalDate,
  status: z.enum(["aktif", "bitti", "iptal"]).default("aktif"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
})
  .refine((v) => v.renewal === "yok" || v.hoursPerPeriod > 0, {
    // Yenilenen pakette 0 saat tanımlamak sayacı hep 0'da tutardı.
    message: "Yenilenen pakette dönem başına saat girilmeli.",
    path: ["hoursPerPeriod"],
  })
  .refine((v) => v.renewal === "yok" || v.startsOn != null, {
    // Birikim başlangıç gününden sayılır; tarihsiz yenileme hesaplanamaz.
    message: "Yenilenen pakette başlangıç tarihi gerekli.",
    path: ["startsOn"],
  });
export type AssignPackageInput = z.infer<typeof assignPackageSchema>;

export const lessonStatusSchema = z.enum([
  "scheduled",
  "held",
  "cancelled",
  "missed",
]);

/**
 * Özel ders kaydı.
 *
 * Eğitmen iki türlü verilebilir: uygulama hesabı olan koç (`instructorUserId`)
 * ya da hesabı olmayan dış öğretmen (`instructorProfileId` → coach_profiles).
 * İkisi birden verilemez — hangisinin doğru olduğu belirsiz kalırdı.
 */
export const upsertPrivateLessonSchema = z
  .object({
    lessonId: z.coerce.number().int().positive().optional(),
    enrollmentId: z.coerce.number().int().positive(),
    enrollmentPackageId: z.coerce.number().int().positive().nullish(),
    subjectId: z.coerce.number().int().positive().nullish(),
    topicId: z.coerce.number().int().positive().nullish(),
    instructorUserId: z.string().trim().min(1).nullish(),
    instructorProfileId: z.coerce.number().int().positive().nullish(),
    scheduledAt: optionalDate,
    heldAt: optionalDate,
    durationMinutes: z.coerce
      .number()
      .int("Süre tam dakika olmalı.")
      .min(5, "Süre en az 5 dakika.")
      .max(600, "Süre en fazla 10 saat."),
    status: lessonStatusSchema.default("scheduled"),
    countsAgainstQuota: z.boolean().default(true),
    note: z.string().trim().max(1000).optional().or(z.literal("")),
    studentVisibleNote: z.string().trim().max(1000).optional().or(z.literal("")),
    meetingUrl: z.string().trim().url("Geçerli bir bağlantı gir.").max(500).optional().or(z.literal("")),
  })
  .refine((v) => !(v.instructorUserId && v.instructorProfileId), {
    message: "Tek eğitmen seç.",
    path: ["instructorUserId"],
  })
  .refine((v) => v.status !== "held" || v.heldAt != null, {
    // Kota işlenen dersten düşer; tarihsiz "işlendi" raporlanamaz.
    message: "İşlenen dersin tarihi gerekli.",
    path: ["heldAt"],
  });
export type UpsertPrivateLessonInput = z.infer<
  typeof upsertPrivateLessonSchema
>;

export const deletePrivateLessonSchema = z.object({
  lessonId: z.coerce.number().int().positive(),
});

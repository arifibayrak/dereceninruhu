import { z } from "zod";

/** Yönetici ekle — yalnız mevcut bir yönetici oluşturabilir. */
export const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli."),
  email: z.email("Geçerli bir e-posta girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
});
export type CreateAdminInput = z.infer<typeof createAdminSchema>;

/** Ekip rolleri — öğrenci rolü buradan yönetilmez. */
export const staffRoleSchema = z.enum(["admin", "coach"]);
export type StaffRole = z.infer<typeof staffRoleSchema>;

/** Koç ↔ yönetici rol değişimi. */
export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "Kullanıcı gerekli."),
  role: staffRoleSchema,
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/** Tek öğrenci (kayıt) → koç ataması; null = atamayı kaldır. */
export const assignStudentCoachSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  coachUserId: z.string().min(1).nullable(),
});
export type AssignStudentCoachInput = z.infer<typeof assignStudentCoachSchema>;

/** Toplu atama — seçilen kayıtların tümünü aynı koça bağlar. */
export const bulkAssignCoachSchema = z.object({
  enrollmentIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "En az bir öğrenci seç.")
    .max(200, "Tek seferde en fazla 200 öğrenci atanabilir."),
  coachUserId: z.string().min(1).nullable(),
});
export type BulkAssignCoachInput = z.infer<typeof bulkAssignCoachSchema>;

/* ------------------------ Dönem / kontenjan ayarları ---------------------- */

export const cohortStatusSchema = z.enum([
  "acik",
  "son_kontenjan",
  "dolu",
  "kapali",
]);
export type CohortStatus = z.infer<typeof cohortStatusSchema>;

/**
 * Yönetici dönem/kontenjan ayarını günceller. Buradaki sayılar sitede
 * gösterilen PAZARLAMA değerleridir — gerçek kapasite/kayıt değil.
 * `displayCapacity` boş bırakılırsa site yalnız "sınırlı kontenjan" ifadesini
 * gösterir (sayı yok).
 */
export const updateCohortSettingsSchema = z.object({
  donemLabel: z.string().trim().min(2, "Dönem adı gerekli.").max(120),
  displayCapacity: z.coerce
    .number()
    .int()
    .min(0)
    .max(9999)
    .nullable()
    .optional(),
  displayFilled: z.coerce.number().int().min(0).max(9999),
  closesOn: z.coerce.date().nullable().optional(),
  status: cohortStatusSchema,
  waitlistOpen: z.coerce.boolean(),
  scarcityVisible: z.coerce.boolean(),
});
export type UpdateCohortSettingsInput = z.infer<
  typeof updateCohortSettingsSchema
>;

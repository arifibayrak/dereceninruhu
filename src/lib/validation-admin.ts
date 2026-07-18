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

import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

/** TR mobile: 10 digits after normalization, starts with 5. */
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => /^5\d{9}$/.test(normalizePhone(v)), {
    message: "Geçerli bir cep telefonu girin (5XX XXX XX XX).",
  });

export const examCodeSchema = z.enum(["KPSS", "YKS", "LGS"]);
export const trackCodeSchema = z.enum(["SAY", "EA", "SOZ"]);

export const createStudentSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ad soyad gerekli."),
    phone: phoneSchema.optional().or(z.literal("")),
    examCode: examCodeSchema,
    trackCode: trackCodeSchema.optional(),
    targetText: z.string().trim().max(200).optional().or(z.literal("")),
    grade: z.string().trim().max(40).optional().or(z.literal("")),
    field: z.string().trim().max(80).optional().or(z.literal("")),
    school: z.string().trim().max(120).optional().or(z.literal("")),
    dershane: z.string().trim().max(120).optional().or(z.literal("")),
    parentPhone: phoneSchema.optional().or(z.literal("")),
    startDate: z.coerce.date().optional(),
  })
  .refine((v) => v.examCode !== "YKS" || !!v.trackCode, {
    message: "YKS için alan (Sayısal/Eşit Ağırlık/Sözel) seçin.",
    path: ["trackCode"],
  });
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

/** İlk kurulum — ilk yönetici (koç) hesabı. */
export const setupAdminSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli."),
  email: z.email("Geçerli bir e-posta girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
});
export type SetupAdminInput = z.infer<typeof setupAdminSchema>;

/** Koç ekle — ikinci koç hesabı (mevcut koç/yönetici ekler). */
export const createCoachSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli."),
  email: z.email("Geçerli bir e-posta girin."),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı."),
});
export type CreateCoachInput = z.infer<typeof createCoachSchema>;

/** Öğrenci daveti kabul + PIN belirleme. */
export const setPinSchema = z
  .object({
    inviteCode: z.string().min(8),
    pin: z.string().regex(/^\d{4,6}$/, "PIN 4-6 rakam olmalı."),
    pinConfirm: z.string(),
  })
  .refine((v) => v.pin === v.pinConfirm, {
    message: "PIN'ler eşleşmiyor.",
    path: ["pinConfirm"],
  });

export const loginSchema = z.object({
  phone: phoneSchema,
  pin: z.string().regex(/^\d{4,6}$/, "PIN 4-6 rakam olmalı."),
});

/** Soru takibi — bir günün ders bazlı upsert'i. */
export const questionLogUpsertSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  logDate: z.coerce.date(),
  entries: z
    .array(
      z.object({
        subjectId: z.coerce.number().int().positive(),
        questionCount: z.coerce.number().int().min(0).max(2000),
      }),
    )
    .min(1),
});
export type QuestionLogUpsertInput = z.infer<typeof questionLogUpsertSchema>;

/* -------------------------------------------------------------------------- */
/*  Faz 2 — haftalık program + koçluk görüşmeleri                             */
/* -------------------------------------------------------------------------- */

/** Haftalık program üst bilgisi — koç upsert'i (hafta = pazartesi). */
export const upsertWeeklyPlanSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  weekStart: z.coerce.date(),
  motto: z.string().trim().max(200).optional().or(z.literal("")),
  coachNote: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["draft", "published", "completed"]).optional(),
});
export type UpsertWeeklyPlanInput = z.infer<typeof upsertWeeklyPlanSchema>;

/** Program görevi — ekleme (plan yoksa taslak olarak oluşturulur). */
export const planTaskCreateSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  weekStart: z.coerce.date(),
  day: z.coerce.number().int().min(1).max(7),
  subjectId: z.coerce.number().int().positive().nullish(),
  resourceId: z.coerce.number().int().positive().nullish(),
  description: z.string().trim().min(1, "Görev açıklaması gerekli.").max(300),
  targetQuestions: z.coerce.number().int().min(0).max(2000).nullish(),
});
export type PlanTaskCreateInput = z.infer<typeof planTaskCreateSchema>;

/** Program görevi — düzenleme. */
export const planTaskUpdateSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  day: z.coerce.number().int().min(1).max(7),
  subjectId: z.coerce.number().int().positive().nullish(),
  resourceId: z.coerce.number().int().positive().nullish(),
  description: z.string().trim().min(1, "Görev açıklaması gerekli.").max(300),
  targetQuestions: z.coerce.number().int().min(0).max(2000).nullish(),
});
export type PlanTaskUpdateInput = z.infer<typeof planTaskUpdateSchema>;

/** Görev id'si — silme vb. tekil işlemler. */
export const planTaskIdSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

/** Görev tamam/geri al — öğrenci yalnız kendi kaydında. */
export const togglePlanTaskSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  isDone: z.boolean(),
});

/** Taslak programı yayınlama. */
export const publishPlanSchema = z.object({
  planId: z.coerce.number().int().positive(),
});

/** Görüşme planlama (koç). */
export const createSessionSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  scheduledAt: z.coerce.date(),
  studentVisibleNote: z.string().trim().max(500).optional().or(z.literal("")),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

/** Görüşme güncelleme — verilmeyen alanlar dokunulmaz. */
export const updateSessionSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  scheduledAt: z.coerce.date().optional(),
  status: z.enum(["scheduled", "held", "cancelled", "missed"]).optional(),
  summary: z.string().trim().max(2000).optional(),
  studentVisibleNote: z.string().trim().max(500).optional(),
  nextPlanId: z.coerce.number().int().positive().nullish(),
});
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

/** "Bu görüşmeden program oluştur" — haftalık plan oluşturup görüşmeye bağlar. */
export const planFromSessionSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  weekStart: z.coerce.date(),
});

/** Deneme girişi — net server-side hesaplanır (D − Y/divisor). */
export const createMockSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  examSectionId: z.coerce.number().int().positive(),
  scope: z.enum(["full", "branch"]).default("full"),
  publisher: z.string().trim().max(80).optional().or(z.literal("")),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  takenOn: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(0).max(600).optional(),
  results: z
    .array(
      z.object({
        subjectId: z.coerce.number().int().positive(),
        correctCount: z.coerce.number().int().min(0).max(200),
        wrongCount: z.coerce.number().int().min(0).max(200),
        blankCount: z.coerce.number().int().min(0).max(200),
      }),
    )
    .min(1),
});
export type CreateMockInput = z.infer<typeof createMockSchema>;

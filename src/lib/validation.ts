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

/**
 * Profil düzenleme — sınav/alan değiştirmez, yalnız kişisel bilgiler + hedef.
 * Hem koç (öğrenci profili) hem öğrenci (kendi profili) için kullanılır.
 */
export const updateStudentProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad gerekli."),
  phone: phoneSchema.optional().or(z.literal("")),
  parentPhone: phoneSchema.optional().or(z.literal("")),
  targetText: z.string().trim().max(200).optional().or(z.literal("")),
  grade: z.string().trim().max(40).optional().or(z.literal("")),
  field: z.string().trim().max(80).optional().or(z.literal("")),
  school: z.string().trim().max(120).optional().or(z.literal("")),
  dershane: z.string().trim().max(120).optional().or(z.literal("")),
});
export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>;

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

/** Görüşme dış sağlayıcıda (Meet/Zoom…) yapılır; link uygulamadan açılır. */
export const meetingUrlSchema = z
  .url("Geçerli bir toplantı linki girin.")
  .max(500)
  .optional()
  .or(z.literal(""));

/** Görüşme planlama (koç). */
export const createSessionSchema = z.object({
  enrollmentId: z.coerce.number().int().positive(),
  scheduledAt: z.coerce.date(),
  studentVisibleNote: z.string().trim().max(500).optional().or(z.literal("")),
  summary: z.string().trim().max(2000).optional().or(z.literal("")),
  meetingUrl: meetingUrlSchema,
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
  meetingUrl: meetingUrlSchema,
});
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

/** "Bu görüşmeden program oluştur" — haftalık plan oluşturup görüşmeye bağlar. */
export const planFromSessionSchema = z.object({
  sessionId: z.coerce.number().int().positive(),
  weekStart: z.coerce.date(),
});

/* -------------------------------------------------------------------------- */
/*  Faz 3 — pazarlama sitesi (lead + CMS)                                      */
/* -------------------------------------------------------------------------- */

export const leadExamSchema = z.enum(["LGS", "YKS", "KPSS", "Diğer"]);

/** Public /iletisim formu — auth yok; `website` bal küpü (bot tuzağı). */
export const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli.").max(120),
  phone: phoneSchema,
  exam: leadExamSchema,
  message: z
    .string()
    .trim()
    .max(1000, "Mesaj en fazla 1000 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  /** Honeypot — gerçek kullanıcı asla doldurmaz. */
  website: z.literal("").optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const leadStatusSchema = z.enum(["yeni", "görüşüldü", "kayıt", "kayıp"]);
export type LeadStatus = z.infer<typeof leadStatusSchema>;

export const updateLeadStatusSchema = z.object({
  leadId: z.coerce.number().int().positive(),
  status: leadStatusSchema,
});

/* ---------------------------- Bekleme listesi ----------------------------- */

/** Public /bekleme-listesi formu — auth yok; `website` bal küpü korur. */
export const createWaitlistSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli.").max(120),
  phone: phoneSchema,
  exam: leadExamSchema,
  message: z
    .string()
    .trim()
    .max(1000, "Mesaj en fazla 1000 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  website: z.literal("").optional(),
});
export type CreateWaitlistInput = z.infer<typeof createWaitlistSchema>;

export const waitlistStatusSchema = z.enum([
  "bekliyor",
  "davet_edildi",
  "kayit",
  "ayrildi",
]);
export type WaitlistStatus = z.infer<typeof waitlistStatusSchema>;

export const updateWaitlistStatusSchema = z.object({
  entryId: z.coerce.number().int().positive(),
  status: waitlistStatusSchema,
});

/* ----------------------------- Koç başvurusu ------------------------------ */

/** Public /koc-basvuru formu — auth yok; `website` bal küpü korur. */
export const createCoachApplicationSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli.").max(120),
  phone: phoneSchema,
  email: z.email("Geçerli bir e-posta girin.").optional().or(z.literal("")),
  subjects: z.string().trim().min(2, "Branşını yaz.").max(200),
  experience: z
    .string()
    .trim()
    .max(1500, "En fazla 1500 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  link: z.url("Geçerli bir bağlantı girin.").optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .max(2000, "En fazla 2000 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  website: z.literal("").optional(),
});
export type CreateCoachApplicationInput = z.infer<
  typeof createCoachApplicationSchema
>;

export const coachApplicationStatusSchema = z.enum([
  "yeni",
  "inceleniyor",
  "gorusme",
  "kabul",
  "ret",
]);
export type CoachApplicationStatus = z.infer<
  typeof coachApplicationStatusSchema
>;

export const updateCoachApplicationStatusSchema = z.object({
  applicationId: z.coerce.number().int().positive(),
  status: coachApplicationStatusSchema,
});

/** Blog yazısı oluştur/güncelle (koç). */
export const upsertBlogPostSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(3, "Başlık gerekli.").max(160),
  slug: z
    .string()
    .trim()
    .min(3, "Slug gerekli.")
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug yalnız küçük harf, rakam ve tire içerebilir."),
  excerpt: z.string().trim().max(300, "Özet en fazla 300 karakter.").optional().or(z.literal("")),
  body: z.string().trim().min(10, "İçerik gerekli.").max(50_000),
  coverImageUrl: z.url("Geçerli bir URL girin.").optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
});
export type UpsertBlogPostInput = z.infer<typeof upsertBlogPostSchema>;

/** Yorum (testimonial) — sitede ad + soyadın ilk harfi yazılır. */
export const upsertTestimonialSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  studentName: z.string().trim().min(2, "İsim gerekli.").max(80),
  exam: examCodeSchema,
  result: z.string().trim().max(120).optional().or(z.literal("")),
  quote: z.string().trim().min(2, "Yorum metni gerekli.").max(600),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});
export type UpsertTestimonialInput = z.infer<typeof upsertTestimonialSchema>;

/** Paket — fiyat integer kuruş olarak gelir (client ₺ → kuruş çevirir). */
export const upsertPackageSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Paket adı gerekli.").max(80),
  priceKurus: z.coerce
    .number()
    .int("Fiyat kuruş cinsinden tam sayı olmalı.")
    .min(0, "Fiyat negatif olamaz.")
    .max(100_000_000),
  period: z.string().trim().max(40).optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1).max(160)).max(12),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});
export type UpsertPackageInput = z.infer<typeof upsertPackageSchema>;

export const upsertFaqSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  question: z.string().trim().min(5, "Soru gerekli.").max(200),
  answer: z.string().trim().min(5, "Cevap gerekli.").max(2000),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});
export type UpsertFaqInput = z.infer<typeof upsertFaqSchema>;

/** Koç profili bağlantısı — diğer platform/hesap linki (Instagram, YouTube…). */
export const profileLinkSchema = z.object({
  label: z.string().trim().min(1, "Etiket gerekli.").max(40),
  url: z.url("Geçerli bir bağlantı girin."),
});
export type ProfileLink = z.infer<typeof profileLinkSchema>;

/**
 * Görsel referansı: harici bir http(s) bağlantısı VEYA panelden yüklenmiş
 * dahili dosya yolu (`/api/uploads/…`). Boş string serbest (görsel yok).
 */
export const imageRefSchema = z
  .string()
  .trim()
  .refine(
    (v) =>
      v === "" ||
      v.startsWith("/api/uploads/") ||
      /^https?:\/\/.+/i.test(v),
    "Geçerli bir görsel bağlantısı girin (veya bir dosya yükleyin).",
  );

/**
 * Koç kendi herkese açık profilini düzenler (/koc/profil). Kimlik oturumdan
 * gelir — id/user_id GÖNDERİLMEZ; her koç yalnız kendi satırını yazar.
 */
export const saveMyProfileSchema = z.object({
  displayName: z.string().trim().min(2, "İsim gerekli.").max(80),
  title: z.string().trim().max(60).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  headline: z.string().trim().max(160).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  photoUrl: imageRefSchema,
  coverImageUrl: imageRefSchema,
  subjects: z.array(z.string().trim().min(1).max(40)).max(10),
  achievements: z.array(z.string().trim().min(1).max(120)).max(12),
  links: z.array(profileLinkSchema).max(8),
  proofUrl: z.url("Geçerli bir URL girin.").optional().or(z.literal("")),
  isActive: z.boolean(),
});
export type SaveMyProfileInput = z.infer<typeof saveMyProfileSchema>;

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

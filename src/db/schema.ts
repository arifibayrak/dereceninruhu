/**
 * Derecenin Ruhu — full relational model on D1 (SQLite) via Drizzle.
 *
 * Conventions (see AGENTS.md):
 * - Money is ALWAYS integer kuruş (`*_kurus` columns). Never float.
 * - `net` is a REAL snapshot computed at write time (doğru − yanlış/divisor);
 *   formula changes never rewrite history.
 * - All tracking tables FK `enrollment_id`, not `student_id`.
 * - Subjects roll up via `parent_subject_id` + `is_scored` (GEO/MANTIK → MAT).
 * - Date-like columns (log_date, taken_on, week_start, due_on, issued_on,
 *   paid_on) use `integer({ mode: "timestamp" })` — unix seconds; store the
 *   local (Europe/Istanbul) day at 00:00. week_start is always a Monday.
 * - SQLite has no enums: `text({ enum: [...] })` is type-level only. Values
 *   listed in Turkish in the plan (invoice/payment/lead/billing) are encoded
 *   in Turkish verbatim; unlisted lifecycle enums use English codes and are
 *   rendered with Turkish labels in the UI.
 */
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

/* -------------------------------------------------------------------------- */
/*  Auth (Better Auth manages these — text ids)                               */
/* -------------------------------------------------------------------------- */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  /** Better Auth phone-number plugin (giriş = telefon + PIN). */
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: integer("phone_number_verified", { mode: "boolean" })
    .notNull()
    .default(false),
  role: text("role", { enum: ["admin", "coach", "student"] })
    .notNull()
    .default("student"),
  /** Koç iletişim/tanıtım — Telegram kullanıcı adı (@ile ya da sade). */
  telegram: text("telegram"),
  /** Koç sosyal — Instagram kullanıcı adı/bağlantısı. */
  instagram: text("instagram"),
  /** Koç görüşme takvimi — Cal.com randevu linki (öğrenciler uygulamadan planlar). */
  calBookingUrl: text("cal_booking_url"),
  /** Koç ödeme bilgisi — IBAN (hassas; yalnız yönetim görünümü). */
  iban: text("iban"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sessions_user_id_idx").on(t.userId)],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp",
    }),
    scope: text("scope"),
    /** Hashed PIN lives here (credential provider). */
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("accounts_user_id_idx").on(t.userId)],
);

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/*  Template layer (seeded, admin-editable)                                   */
/* -------------------------------------------------------------------------- */

export const examTemplates = sqliteTable("exam_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Natural key: KPSS | YKS | LGS. */
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const examSections = sqliteTable(
  "exam_sections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    examTemplateId: integer("exam_template_id")
      .notNull()
      .references(() => examTemplates.id),
    /** Natural key within a template: KPSS_GY, TYT, LGS_SOZEL… */
    code: text("code").notNull(),
    name: text("name").notNull(),
    /** Net = doğru − yanlış / divisor. 3 for LGS, 4 for YKS/KPSS. */
    wrongPenaltyDivisor: integer("wrong_penalty_divisor").notNull(),
    durationMinutes: integer("duration_minutes"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("exam_sections_template_code_uq").on(t.examTemplateId, t.code),
  ],
);

export const tracks = sqliteTable(
  "tracks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    examTemplateId: integer("exam_template_id")
      .notNull()
      .references(() => examTemplates.id),
    /** Natural key within a template: SAY | EA | SOZ. */
    code: text("code").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("tracks_template_code_uq").on(t.examTemplateId, t.code)],
);

export const subjects = sqliteTable(
  "subjects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    examSectionId: integer("exam_section_id")
      .notNull()
      .references(() => examSections.id),
    /** Natural key within a section (TUR repeats across sections). */
    code: text("code").notNull(),
    name: text("name").notNull(),
    /** GEO/MANTIK → MAT roll-up: children log separately, nets hit the parent. */
    parentSubjectId: integer("parent_subject_id").references(
      (): AnySQLiteColumn => subjects.id,
    ),
    /** Only scored subjects appear in mock results / net charts. */
    isScored: integer("is_scored", { mode: "boolean" }).notNull().default(true),
    /**
     * JSON-encoded string[] of track codes this subject applies to
     * (e.g. '["SAY","EA"]' for AYT Matematik). NULL = all tracks.
     */
    trackCodes: text("track_codes"),
    officialQuestionCount: integer("official_question_count"),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Hex color used consistently across charts (Recharts). */
    chartColor: text("chart_color"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [
    uniqueIndex("subjects_section_code_uq").on(t.examSectionId, t.code),
    index("subjects_parent_idx").on(t.parentSubjectId),
  ],
);

export const topics = sqliteTable(
  "topics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    /** Soft delete — history keeps pointing at renamed/retired topics. */
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("topics_subject_idx").on(t.subjectId)],
);

/* -------------------------------------------------------------------------- */
/*  Student layer                                                             */
/* -------------------------------------------------------------------------- */

export const students = sqliteTable(
  "students",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** NULL until the student accepts the WhatsApp davet and sets a PIN. */
    userId: text("user_id").references(() => users.id),
    fullName: text("full_name").notNull(),
    grade: text("grade"),
    /** Alan/bölüm free text (e.g. "Adalet" for KPSS). */
    field: text("field"),
    school: text("school"),
    dershane: text("dershane"),
    phone: text("phone"),
    parentPhone: text("parent_phone"),
    /** Öğrenci gerçek e-postası (auth'taki telefon-türevi e-posta DEĞİL). */
    email: text("email"),
    /** Telegram kullanıcı adı. */
    telegram: text("telegram"),
    /** Şehir / il. */
    city: text("city"),
    /** Doğum yılı (yaş/sınıf bağlamı). */
    birthYear: integer("birth_year"),
    inviteCode: text("invite_code").unique(),
    status: text("status", { enum: ["active", "inactive", "alumni"] })
      .notNull()
      .default("active"),
    /**
     * Soft-delete (yönetici "gizle"): dolu = öğrenci siteden gizli. Satır ve
     * tüm verisi DB'de KALIR; listelerden düşer, öğrenci sisteme giremez.
     * Geri getirmek için NULL'a çekilir. Bkz. hideStudent/restoreStudent.
     */
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("students_user_id_idx").on(t.userId),
    /*
     * Telefon = giriş kimliği (giriş e-postası ondan türetilir), bu yüzden
     * görünür kayıtlar arasında TEKİL olmak zorunda. Aynı numarada ikinci kayıt
     * açılınca öğrencinin verisi ikiye bölünüyor, giriş hesabı yalnız birine
     * bağlanıyor ve PIN diğerine sıfırlandığı için öğrenci giremiyordu.
     * Gizlenen (soft-delete) kayıtlar hariç — numara yeniden kullanılabilsin.
     */
    uniqueIndex("students_phone_uq")
      .on(t.phone)
      .where(sql`"phone" IS NOT NULL AND "deleted_at" IS NULL`),
  ],
);

export const enrollments = sqliteTable(
  "enrollments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    studentId: integer("student_id")
      .notNull()
      .references(() => students.id),
    examTemplateId: integer("exam_template_id")
      .notNull()
      .references(() => examTemplates.id),
    /** NULL for track-less templates (KPSS, LGS). */
    trackId: integer("track_id").references(() => tracks.id),
    /**
     * İKİNCİ sınav — bir öğrenci aynı dönemde iki sınava hazırlanabilir
     * (ör. Ekim'de ortaöğretim KPSS, ardından 2027 YKS). NULL = tek sınav.
     *
     * Kayıt tektir: tüm takip satırları (`enrollment_id`) ortakta kalır, ders
     * listesi iki şablonun BİRLEŞİMİdir. Ders id'leri bölüme özgü olduğundan
     * (KPSS Türkçesi ile TYT Türkçesi ayrı satırlardır) geçmiş veri bozulmaz.
     */
    secondaryExamTemplateId: integer("secondary_exam_template_id").references(
      () => examTemplates.id,
    ),
    /** İkinci sınavın alanı — yalnız YKS ikinci sınavsa dolu. */
    secondaryTrackId: integer("secondary_track_id").references(() => tracks.id),
    coachUserId: text("coach_user_id").references(() => users.id),
    /** HEDEF row from the sheet (e.g. "İstanbul Adliyesi zabıt katipliği"). */
    targetText: text("target_text"),
    startDate: integer("start_date", { mode: "timestamp" }),
    endDate: integer("end_date", { mode: "timestamp" }),
    status: text("status", {
      enum: ["active", "paused", "completed", "cancelled"],
    })
      .notNull()
      .default("active"),
    /** Öğrenci görüşmelerini ilk planladığında damgalanır (gerekli-adım nudge'ı). */
    callsScheduledAt: integer("calls_scheduled_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    // One active enrollment per student (retakes get a fresh row).
    uniqueIndex("enrollments_one_active_per_student_uq")
      .on(t.studentId)
      .where(sql`"status" = 'active'`),
    index("enrollments_student_idx").on(t.studentId),
    index("enrollments_coach_idx").on(t.coachUserId),
  ],
);

export const resources = sqliteTable(
  "resources",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    subjectId: integer("subject_id").references(() => subjects.id),
    name: text("name").notNull(),
    /** Kaynak author label (e.g. subject teacher) — not a user. */
    author: text("author"),
    notes: text("notes"),
    /** Opsiyonel bağlantı (kaynak linki). */
    url: text("url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("resources_enrollment_idx").on(t.enrollmentId)],
);

export const subjectAssignments = sqliteTable(
  "subject_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id),
    /** Label only (Aker Kartal, İlker Karabulut…) — teachers are not users. */
    teacherName: text("teacher_name"),
    primaryResourceId: integer("primary_resource_id").references(
      () => resources.id,
    ),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("subject_assignments_enrollment_subject_uq").on(
      t.enrollmentId,
      t.subjectId,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Tracking layer (all FK enrollment_id)                                     */
/* -------------------------------------------------------------------------- */

export const weeklyPlans = sqliteTable(
  "weekly_plans",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /** Always a Monday (weeks start Monday, Europe/Istanbul). */
    weekStart: integer("week_start", { mode: "timestamp" }).notNull(),
    motto: text("motto"),
    coachNote: text("coach_note"),
    status: text("status", { enum: ["draft", "published", "completed"] })
      .notNull()
      .default("draft"),
    /**
     * Taslağı öğrenci mi oluşturdu — öğrencinin KENDİ taslağını görüp
     * düzenlemesini sağlar (koçun yayınlanmamış taslağı öğrenciye görünmez).
     */
    proposedByStudent: integer("proposed_by_student", { mode: "boolean" })
      .notNull()
      .default(false),
    /**
     * Öğrenci kendi taslağını "koça gönder"diyse dolu — koç inceleme kuyruğunu
     * ve "öğrenci önerisi" rozetini besler. Yayınlanınca anlamsızlaşır.
     */
    studentSubmittedAt: integer("student_submitted_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("weekly_plans_enrollment_week_uq").on(
      t.enrollmentId,
      t.weekStart,
    ),
  ],
);

export const planTasks = sqliteTable(
  "plan_tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    weeklyPlanId: integer("weekly_plan_id")
      .notNull()
      .references(() => weeklyPlans.id),
    /**
     * 1 = Pazartesi … 7 = Pazar. null = haftalık konu (güne atanmamış):
     * ders × konu ("hafta") görünümünde yaşar, günlük dağılıma dahil değildir.
     */
    day: integer("day"),
    /** Order within the day; the grid is a rendering, rows are sparse. */
    slot: integer("slot").notNull().default(0),
    subjectId: integer("subject_id").references(() => subjects.id),
    topicId: integer("topic_id").references(() => topics.id),
    /**
     * TEKİL kaynak — tarihsel kolon. Listenin ilk öğesinin yansımasıdır:
     * yeni kayıtlarda `resourceIds` esastır, bu kolon eski istemciler ve
     * göç öncesi satırlar için tutulur (bkz. @/lib/plan-resources).
     */
    resourceId: integer("resource_id").references(() => resources.id),
    /**
     * Göreve bağlı kaynaklar — JSON-encoded number[], seçim sırasında
     * (`plan_day_layouts.subject_ids` ile aynı desen). Bir konu birden çok
     * kaynaktan çalışılabilir; okurken `@/lib/plan-resources` kullan.
     */
    resourceIds: text("resource_ids").notNull().default("[]"),
    description: text("description"),
    targetQuestions: integer("target_questions"),
    isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("plan_tasks_plan_idx").on(t.weeklyPlanId)],
);

/**
 * Haftalık ders düzeni — "Pazartesi = Türkçe + Matematik, Salı = Coğrafya…".
 * Haftadan haftaya DEĞİŞMEZ; program kurucusunda iskelet olarak render edilir,
 * koç yalnız konuları yazar. Bir kayıt (enrollment) için gün başına tek satır.
 *
 * `subjectIds` JSON-encoded number[] — `subjects.trackCodes` ile aynı desen.
 * Boş dizi = o gün ders yok (tatil/tekrar günü).
 */
export const planDayLayouts = sqliteTable(
  "plan_day_layouts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /** 1 = Pazartesi … 7 = Pazar. */
    day: integer("day").notNull(),
    /** JSON-encoded number[] — subjects.id listesi, gösterim sırasında. */
    subjectIds: text("subject_ids").notNull().default("[]"),
    /** Gün rengi anahtarı (@/lib/plan-layout DAY_COLORS); null = varsayılan. */
    color: text("color"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("plan_day_layouts_enrollment_day_uq").on(t.enrollmentId, t.day),
  ],
);

export const questionLogs = sqliteTable(
  "question_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    logDate: integer("log_date", { mode: "timestamp" }).notNull(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id),
    /**
     * Soru sayısı çözülen — totals are SUM … GROUP BY, never stored.
     * TEK DOĞRULUK KAYNAĞI: her toplam/hacim sorgusu bunu okur. D/Y/B
     * girildiğinde sunucuda `doğru + yanlış + boş` olarak yeniden türetilir.
     */
    questionCount: integer("question_count").notNull().default(0),
    /**
     * Opsiyonel doğru / yanlış / boş kırılımı. Öğrenci sadece toplamı da
     * girebilir → üçü birden NULL kalır (kısmi giriş kabul edilmez: ya üçü de
     * dolu ya da üçü de boş). Net, `computeNet` ile okuma anında hesaplanır;
     * mock sonuçlarının aksine burada snapshot SAKLANMAZ — bu bir çalışma
     * kaydıdır, sınav sonucu değil.
     */
    correctCount: integer("correct_count"),
    wrongCount: integer("wrong_count"),
    blankCount: integer("blank_count"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("question_logs_enrollment_date_subject_uq").on(
      t.enrollmentId,
      t.logDate,
      t.subjectId,
    ),
    index("question_logs_enrollment_date_idx").on(t.enrollmentId, t.logDate),
    /*
     * Koç kadrosu "bu haftanın soru toplamı"nı TÜM kayıtlar için tek sorguda
     * okur: `where log_date between … group by enrollment_id`. Bileşik indeksin
     * ön eki enrollment_id olduğu için o sorgu indeksi KULLANAMIYOR ve tabloyu
     * baştan sona tarıyordu (sayfa başına ~10 bin satır okuma). Tarihin kendi
     * indeksi taramayı o haftanın satırlarına indirir.
     */
    index("question_logs_date_idx").on(t.logDate),
  ],
);

/**
 * Günlük çalışma süresi kaydı — kronometre + manuel giriş. Her satır BİR
 * çalışma bloğu (oturum); günlük/ders toplamı SUM(minutes) GROUP BY ile
 * hesaplanır, asla saklanmaz (bkz. questionLogs modeli). Money değil; dakika.
 */
export const studyLogs = sqliteTable(
  "study_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /** Çalışmanın yapıldığı gün (TRT gün başı). */
    logDate: integer("log_date", { mode: "timestamp" }).notNull(),
    /** Ders — null = genel/karışık çalışma. */
    subjectId: integer("subject_id").references(() => subjects.id),
    /** Bu bloğun süresi (dakika). */
    minutes: integer("minutes").notNull(),
    source: text("source", { enum: ["timer", "manual"] }).notNull(),
    note: text("note"),
    /** R2 anahtarı — kanıt ekran görüntüsü (özel; yalnız sahibi/koç görür). */
    proofKey: text("proof_key"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("study_logs_enrollment_date_idx").on(t.enrollmentId, t.logDate),
    index("study_logs_enrollment_subject_idx").on(t.enrollmentId, t.subjectId),
  ],
);

export const mockExams = sqliteTable(
  "mock_exams",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /**
     * Anchor bölüm. Birleşik denemelerde (isCombined) şablonun ilk bölümüdür;
     * sonuçlar şablonun TÜM bölümlerindeki derslere yayılabilir.
     */
    examSectionId: integer("exam_section_id")
      .notNull()
      .references(() => examSections.id),
    /**
     * Tek oturumda girilen çok bölümlü deneme (KPSS GY + GK gibi).
     * Etiket bölüm adı yerine şablonun birleşik adıyla gösterilir.
     */
    isCombined: integer("is_combined", { mode: "boolean" })
      .notNull()
      .default(false),
    /** full = tam deneme, branch = branş denemesi. */
    scope: text("scope", { enum: ["full", "branch"] })
      .notNull()
      .default("full"),
    /** Yayınevi (3D, Limit, Bilgi Sarmal…). */
    publisher: text("publisher"),
    name: text("name"),
    takenOn: integer("taken_on", { mode: "timestamp" }).notNull(),
    durationMinutes: integer("duration_minutes"),
    /** Deneme analizi yapıldı mı — coach dashboard flag. */
    analysisDone: integer("analysis_done", { mode: "boolean" })
      .notNull()
      .default(false),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("mock_exams_enrollment_taken_idx").on(t.enrollmentId, t.takenOn),
  ],
);

export const mockExamResults = sqliteTable(
  "mock_exam_results",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mockExamId: integer("mock_exam_id")
      .notNull()
      .references(() => mockExams.id),
    /** Always a SCORED subject (children roll up before insert). */
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id),
    correctCount: integer("correct_count").notNull().default(0),
    wrongCount: integer("wrong_count").notNull().default(0),
    blankCount: integer("blank_count").notNull().default(0),
    /** REAL snapshot at write time: doğru − yanlış / divisor. */
    net: real("net").notNull(),
  },
  (t) => [
    uniqueIndex("mock_exam_results_exam_subject_uq").on(
      t.mockExamId,
      t.subjectId,
    ),
  ],
);

export const mockTopicErrors = sqliteTable(
  "mock_topic_errors",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mockExamId: integer("mock_exam_id")
      .notNull()
      .references(() => mockExams.id),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id),
    errorCount: integer("error_count").notNull().default(1),
    createdAt: createdAt(),
  },
  (t) => [
    // Sparse matrix; TOPLAM EKSİK = SUM(error_count) GROUP BY topic.
    uniqueIndex("mock_topic_errors_exam_topic_uq").on(t.mockExamId, t.topicId),
    index("mock_topic_errors_topic_idx").on(t.topicId),
  ],
);

export const topicResourceProgress = sqliteTable(
  "topic_resource_progress",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    topicId: integer("topic_id")
      .notNull()
      .references(() => topics.id),
    resourceId: integer("resource_id")
      .notNull()
      .references(() => resources.id),
    /** "Bitti" cell in the kaynak takibi matrix. */
    isDone: integer("is_done", { mode: "boolean" }).notNull().default(false),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (t) => [
    uniqueIndex("topic_resource_progress_uq").on(
      t.enrollmentId,
      t.topicId,
      t.resourceId,
    ),
    index("topic_resource_progress_enrollment_idx").on(t.enrollmentId),
  ],
);

/**
 * Kaynak başına çözülen soru sayısı — konu takibinden ayrı, saf soru sayacı.
 * question_logs (ders bazlı) ile çift saymamak için AYRI tutulur; toplamlar
 * SUM(question_count) … GROUP BY resource_id, saklanmaz.
 */
export const resourceQuestionLogs = sqliteTable(
  "resource_question_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    resourceId: integer("resource_id")
      .notNull()
      .references(() => resources.id),
    /** TRT gün başlangıcı — gün başına tek satır (upsert + artır). */
    logDate: integer("log_date", { mode: "timestamp" }).notNull(),
    questionCount: integer("question_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("resource_question_logs_enrollment_resource_date_uq").on(
      t.enrollmentId,
      t.resourceId,
      t.logDate,
    ),
    index("resource_question_logs_enrollment_idx").on(t.enrollmentId),
  ],
);

export const coachingSessions = sqliteTable(
  "coaching_sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    heldAt: integer("held_at", { mode: "timestamp" }),
    status: text("status", {
      enum: ["scheduled", "held", "cancelled", "missed"],
    })
      .notNull()
      .default("scheduled"),
    /** Coach-only görüşme notu. */
    summary: text("summary"),
    /** Öğrencinin gördüğü not. */
    studentVisibleNote: text("student_visible_note"),
    /** "Plan bu görüşmeden çıktı" link. */
    nextPlanId: integer("next_plan_id").references(() => weeklyPlans.id),
    /** Görüşme dış sağlayıcıda yapılır; katılım linki uygulamadan açılır. */
    meetingUrl: text("meeting_url"),
    meetingProvider: text("meeting_provider", {
      enum: ["google_meet", "zoom", "other"],
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("coaching_sessions_enrollment_idx").on(
      t.enrollmentId,
      t.scheduledAt,
    ),
  ],
);

/* -------------------------------------------------------------------------- */
/*  İçerik layer (light content + izlendi/okundu)                             */
/* -------------------------------------------------------------------------- */

export const contentItems = sqliteTable(
  "content_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type", {
      enum: ["video", "pdf", "doc", "note", "link"],
    }).notNull(),
    title: text("title").notNull(),
    /** YouTube / Drive / external URL (NULL when a file was uploaded). */
    url: text("url"),
    /** Inline body for type=note. */
    body: text("body"),
    /** R2 key of a file uploaded from the coach's device (`content/…`). */
    fileKey: text("file_key"),
    /** Original file name — shown in the UI, used for the download name. */
    fileName: text("file_name"),
    /** Bytes; rendered next to the file name. */
    fileSize: integer("file_size"),
    /** MIME type as reported at upload time. */
    fileType: text("file_type"),
    /** Exam scope for library filtering; NULL = all exams. */
    examTemplateId: integer("exam_template_id").references(
      () => examTemplates.id,
    ),
    subjectId: integer("subject_id").references(() => subjects.id),
    topicId: integer("topic_id").references(() => topics.id),
    /** true → shared İçerik Kütüphanesi; visibility rows can still 1:1 assign. */
    isLibrary: integer("is_library", { mode: "boolean" })
      .notNull()
      .default(false),
    createdByUserId: text("created_by_user_id").references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("content_items_subject_idx").on(t.subjectId)],
);

export const contentVisibility = sqliteTable(
  "content_visibility",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentItemId: integer("content_item_id")
      .notNull()
      .references(() => contentItems.id),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("content_visibility_content_enrollment_uq").on(
      t.contentItemId,
      t.enrollmentId,
    ),
    index("content_visibility_enrollment_idx").on(t.enrollmentId),
  ],
);

export const contentViews = sqliteTable(
  "content_views",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentItemId: integer("content_item_id")
      .notNull()
      .references(() => contentItems.id),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /** izlendi/okundu — one row per content per enrollment. */
    viewedAt: integer("viewed_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("content_views_content_enrollment_uq").on(
      t.contentItemId,
      t.enrollmentId,
    ),
    index("content_views_enrollment_idx").on(t.enrollmentId),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Muhasebe layer (koç/admin-only; money = integer kuruş)                    */
/* -------------------------------------------------------------------------- */

export const feePlans = sqliteTable(
  "fee_plans",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /**
     * Bu ücret NEYİN karşılığı — öğrenciye atanmış paket. NULL = pakete
     * bağlanmamış serbest ücret (eski satırların tamamı böyle). Fatura zaten
     * `fee_plan_id` taşıdığı için para → paket zinciri buradan kapanır.
     */
    enrollmentPackageId: integer("enrollment_package_id").references(
      (): AnySQLiteColumn => enrollmentPackages.id,
    ),
    billingType: text("billing_type", {
      enum: ["haftalık", "aylık", "paket", "tek_seferlik"],
    }).notNull(),
    amountKurus: integer("amount_kurus").notNull(),
    currency: text("currency").notNull().default("TRY"),
    /** For paket plans: how many months the amount covers. */
    periodMonths: integer("period_months"),
    /** Day of month invoices fall due (aylık plans). */
    dueDay: integer("due_day"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    /**
     * Otomatik yenileme — haftalık/aylık planlarda her dönemin gününde fatura
     * otomatik kesilir. Koç durdurunca (false) yeni fatura üretilmez.
     */
    autoRenew: integer("auto_renew", { mode: "boolean" })
      .notNull()
      .default(true),
    /** Sıradaki otomatik faturanın kesileceği gün (haftalık/aylık; yoksa null). */
    nextBillingOn: integer("next_billing_on", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("fee_plans_enrollment_idx").on(t.enrollmentId)],
);

export const invoices = sqliteTable(
  "invoices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    feePlanId: integer("fee_plan_id").references(() => feePlans.id),
    /** e.g. "Mart 2026". */
    periodLabel: text("period_label"),
    amountKurus: integer("amount_kurus").notNull(),
    issuedOn: integer("issued_on", { mode: "timestamp" }).notNull(),
    dueOn: integer("due_on", { mode: "timestamp" }),
    status: text("status", {
      enum: ["taslak", "gönderildi", "ödendi", "gecikmiş", "iptal"],
    })
      .notNull()
      .default("taslak"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("invoices_enrollment_idx").on(t.enrollmentId),
    index("invoices_status_due_idx").on(t.status, t.dueOn),
  ],
);

export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /** Optional — payments can be recorded without an invoice. */
    invoiceId: integer("invoice_id").references(() => invoices.id),
    amountKurus: integer("amount_kurus").notNull(),
    paidOn: integer("paid_on", { mode: "timestamp" }).notNull(),
    method: text("method", {
      enum: ["havale", "nakit", "kart", "diğer"],
    }).notNull(),
    receivedByUserId: text("received_by_user_id").references(() => users.id),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [
    index("payments_enrollment_idx").on(t.enrollmentId),
    index("payments_invoice_idx").on(t.invoiceId),
  ],
);

/**
 * Öğrencinin "havale/ödeme bildirimi" — self-servis. Öğrenci ödemeyi
 * bildirir; koç/yönetici onaylayınca gerçek bir `payments` satırına dönüşür.
 * (Otomatik tahsilat YOK — insan onaylı.) Money = integer kuruş.
 */
export const paymentNotices = sqliteTable(
  "payment_notices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /** Öğrencinin bildirdiği fatura (varsa; serbest bildirim de olur). */
    invoiceId: integer("invoice_id").references(() => invoices.id),
    amountKurus: integer("amount_kurus").notNull(),
    /** Öğrencinin belirttiği gönderim tarihi. */
    paidOn: integer("paid_on", { mode: "timestamp" }).notNull(),
    method: text("method", {
      enum: ["havale", "nakit", "kart", "diğer"],
    })
      .notNull()
      .default("havale"),
    /** Öğrenci notu / dekont referansı. */
    note: text("note"),
    status: text("status", {
      enum: ["bekliyor", "onaylandı", "reddedildi"],
    })
      .notNull()
      .default("bekliyor"),
    /** Onaylandığında oluşan gerçek ödeme kaydı. */
    resolvedPaymentId: integer("resolved_payment_id").references(
      () => payments.id,
    ),
    /** Bildirimi karara bağlayan koç/yönetici. */
    resolvedByUserId: text("resolved_by_user_id").references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("payment_notices_enrollment_idx").on(t.enrollmentId),
    index("payment_notices_status_idx").on(t.status),
  ],
);

/* -------------------------------------------------------------------------- */
/*  Pazarlama / CMS layer                                                     */
/* -------------------------------------------------------------------------- */

export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    /** Which exam they're preparing for (free text: LGS/YKS/KPSS/…). */
    exam: text("exam"),
    message: text("message"),
    status: text("status", {
      enum: ["yeni", "görüşüldü", "kayıt", "kayıp"],
    })
      .notNull()
      .default("yeni"),
    /** Where the lead came from (site formu, tavsiye, Instagram…). */
    source: text("source"),
    createdAt: createdAt(),
  },
  (t) => [index("leads_status_idx").on(t.status)],
);

/**
 * Dönem / kontenjan ayarları — TEK satır (id=1). Sitedeki "sınırlı kontenjan"
 * mesajını besleyen YÖNETİCİ KONTROLÜNDEKİ gösterim değerleri. Gerçek kapasite
 * ve kayıt sayısı ASLA public gösterilmez; buradaki sayılar yalnızca yöneticinin
 * yayımlamayı seçtiği pazarlama değerleridir (bkz. AGENTS.md — premium
 * konumlandırma). Gerçek aktif öğrenci sayısı yalnız admin panelinde, referans
 * olarak, bu değerin yanında gösterilir.
 */
export const cohortSettings = sqliteTable("cohort_settings", {
  /** Singleton — daima id=1. */
  id: integer("id").primaryKey(),
  /** Dönem etiketi, ör. "2026 Güz Dönemi". */
  donemLabel: text("donem_label").notNull().default("Güncel Dönem"),
  /** Gösterilen kontenjan (boş → yalnız "sınırlı kontenjan" ifadesi, sayı yok). */
  displayCapacity: integer("display_capacity"),
  /** Gösterilen dolu sayısı — pazarlama değeri, GERÇEK kayıt sayısı DEĞİL. */
  displayFilled: integer("display_filled").notNull().default(0),
  /** Kayıtların kapandığı tarih — public geri sayımı besler. */
  closesOn: integer("closes_on", { mode: "timestamp" }),
  status: text("status", {
    enum: ["acik", "son_kontenjan", "dolu", "kapali"],
  })
    .notNull()
    .default("acik"),
  /** Bekleme listesi başvuru alıyor mu. */
  waitlistOpen: integer("waitlist_open", { mode: "boolean" })
    .notNull()
    .default(true),
  /** Kıtlık/kontenjan mesajları sitede görünsün mü (ana şalter). */
  scarcityVisible: integer("scarcity_visible", { mode: "boolean" })
    .notNull()
    .default(true),
  updatedAt: updatedAt(),
});

/**
 * Site geneli iletişim / sosyal ayarları — TEK satır (id=1), `cohortSettings`
 * ile aynı singleton deseni. Pazarlama sitesindeki WhatsApp butonunu ve sosyal
 * ikonları besler; numara değişince deploy gerekmesin diye DB'de tutulur.
 *
 * Sosyal URL alanları boş bırakılabilir — o zaman `@/lib/seo` içindeki
 * `SOCIAL_LINKS` sabitine düşülür (fallback), böylece satır hiç yazılmamışken
 * de site eksiksiz görünür.
 */
export const siteSettings = sqliteTable("site_settings", {
  /** Singleton — daima id=1. */
  id: integer("id").primaryKey(),
  /** İşletme WhatsApp numarası — 10 haneli TR formatında saklanır (normalizePhone). */
  whatsappPhone: text("whatsapp_phone"),
  /** Butona tıklayınca WhatsApp'ta hazır gelen mesaj. */
  whatsappMessage: text("whatsapp_message")
    .notNull()
    .default(
      "Merhaba, YKS koçluk süreci hakkında bilgi almak istiyorum.",
    ),
  /** Yüzen WhatsApp butonu sitede görünsün mü (ana şalter). */
  whatsappVisible: integer("whatsapp_visible", { mode: "boolean" })
    .notNull()
    .default(true),
  /** Sosyal profiller — boş → SOCIAL_LINKS sabiti kullanılır. */
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  youtubeUrl: text("youtube_url"),
  /**
   * Public "şeffaf istatistik" sayaçları görünsün mü (Faz 4).
   * UYARI: yayımlanan metrikler yalnız soru/deneme/net toplamlarıdır; gerçek
   * aktif öğrenci sayısı ASLA public sayfaya çıkmaz (bkz. AGENTS.md).
   */
  publicStatsVisible: integer("public_stats_visible", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: updatedAt(),
});

/**
 * Bekleme listesi — dönem dolduğunda talebi yakalar; sıra pozisyonu okuma
 * anında hesaplanır (bekleyenler createdAt'e göre sıralanır). `leads` ile aynı
 * kalıp: public form → honeypot + Zod → koç/yönetici havuzdan yönetir.
 */
export const waitlistEntries = sqliteTable(
  "waitlist_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    /** Hangi sınav (serbest metin: LGS/YKS/KPSS/…). */
    exam: text("exam"),
    message: text("message"),
    status: text("status", {
      enum: ["bekliyor", "davet_edildi", "kayit", "ayrildi"],
    })
      .notNull()
      .default("bekliyor"),
    source: text("source"),
    createdAt: createdAt(),
  },
  (t) => [index("waitlist_status_idx").on(t.status)],
);

/**
 * Koç başvuruları — public başvuru formu → YALNIZ YÖNETİCİ inceler. Statü
 * boru hattı `aiProposals` inceleme kalıbını izler (`reviewedByUserId`). Kabul
 * otomatik hesap açmaz; yönetici "Koça çevir" ile mevcut ekleme formuna geçer.
 */
export const coachApplications = sqliteTable(
  "coach_applications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    /** Branş(lar), serbest metin (ör. "Matematik, Geometri"). */
    subjects: text("subjects"),
    /** Deneyim özeti. */
    experience: text("experience"),
    /** CV / LinkedIn bağlantısı (isteğe bağlı). */
    link: text("link"),
    /** Neden bizimle çalışmak istiyor. */
    message: text("message"),
    status: text("status", {
      enum: ["yeni", "inceleniyor", "gorusme", "kabul", "ret"],
    })
      .notNull()
      .default("yeni"),
    /** Son işlemi yapan yönetici. */
    reviewedByUserId: text("reviewed_by_user_id").references(() => users.id),
    source: text("source"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("coach_applications_status_idx").on(t.status)],
);

export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  body: text("body").notNull(),
  coverImageUrl: text("cover_image_url"),
  status: text("status", { enum: ["draft", "published", "archived"] })
    .notNull()
    .default("draft"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  authorUserId: text("author_user_id").references(() => users.id),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const testimonials = sqliteTable("testimonials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentName: text("student_name").notNull(),
  exam: text("exam"),
  /** Derece / sonuç (e.g. "Türkiye 154.sü"). */
  result: text("result"),
  quote: text("quote").notNull(),
  photoUrl: text("photo_url"),
  /**
   * ÖSYM/MEB sonuç belgesi görseli (R2 → `/api/uploads/profiles/…`).
   * Derece vitrinindeki kanıt; öğrencinin YAZILI izni olmadan yayınlanmaz
   * (bkz. `consentAt`).
   */
  proofImageUrl: text("proof_image_url"),
  /** Öğrenci yorum/tavsiye videosu (YouTube vb.) — opsiyonel. */
  videoUrl: text("video_url"),
  /**
   * "Derece yapan öğrencilerimiz" vitrinine çıkar. Yalnız `isActive` VE
   * `consentAt` dolu olan satırlar public'e gider.
   */
  isFeatured: integer("is_featured", { mode: "boolean" })
    .notNull()
    .default(false),
  /**
   * Öğrencinin sonucunun/belgesinin yayınlanmasına izin verdiği an.
   * NULL = izin alınmadı → vitrinde ASLA gösterilmez. Kişisel veri (sınav
   * sonucu + belge görseli) yayınlandığı için bu alan opsiyonel bir bayrak
   * değil, yayın ön koşuludur.
   */
  consentAt: integer("consent_at", { mode: "timestamp" }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

/**
 * Ücretsiz kaynak merkezi (/kaynaklar) — küratörlü DIŞ bağlantı dizini.
 *
 * İçerik barındırmayız: OGM Materyal, MEBİ, ÖSYM çıkmış sorular, YÖK Atlas gibi
 * resmî kaynaklara link veririz. Telif riski yok, bakım maliyeti düşük, SEO
 * değeri yüksek. `content_items` ile karıştırma: o ÖĞRENCIYE ATANAN özel
 * içeriktir (enrollment bazlı), bu ise herkese açık pazarlama dizinidir.
 */
export const resourceLinks = sqliteTable(
  "resource_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category", {
      enum: [
        "cikmis-sorular",
        "ogm-mebi",
        "ders-notlari",
        "tercih-atlas",
        "arac",
      ],
    }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    /** Dış bağlantı (http/https) — kendi sayfalarımız için de kullanılabilir. */
    url: text("url").notNull(),
    /** LGS / YKS / KPSS — null = tüm sınavlar. */
    examCode: text("exam_code"),
    /** Kaynağın sahibi kurum: ÖSYM, MEB, OGM Materyal… */
    provider: text("provider"),
    sortOrder: integer("sort_order").notNull().default(0),
    isFeatured: integer("is_featured", { mode: "boolean" })
      .notNull()
      .default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("resource_links_category_idx").on(t.category, t.sortOrder)],
);

/**
 * Satılan hizmet KATALOĞU. Hem /fiyatlar kartlarını besler hem de bir öğrenciye
 * atanabilir (`enrollment_packages`). Katalog satırı pazarlama tarafıdır;
 * öğrenciye atanan şey fiyatın o günkü kopyasıdır (bkz. enrollmentPackages).
 */
export const packages = sqliteTable("packages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  /**
   * Hizmet türü. Koçluk ile özel ders AYRI ürünlerdir: /fiyatlar iki bölüm
   * hâlinde gösterir, kapsam listeleri de ayrışır (koçluk hâlâ "ders anlatımı
   * değildir"; özel ders ek ücretli ayrı hizmettir).
   */
  kind: text("kind", { enum: ["kocluk", "ozel_ders", "kocluk_ozel_ders"] })
    .notNull()
    .default("kocluk"),
  priceKurus: integer("price_kurus").notNull(),
  /** Optional "was" price (kuruş) for a discount display (strikethrough). */
  compareAtKurus: integer("compare_at_kurus"),
  /** Billing period label shown publicly (e.g. "aylık"). */
  period: text("period"),
  /**
   * Pakete dahil özel ders SAATİ. `renewal` "yok" ise TOPLAM ("sınava kadar
   * 40 saat"), değilse DÖNEM BAŞINA ("haftada 1 saat"). 0/NULL = ders yok.
   */
  lessonHours: integer("lesson_hours"),
  /**
   * Ders hakkının yenilenme sıklığı. "yok" = tek seferlik toplam hak.
   * Haftalık/aylık pakette hak her dönem yeniden tanınır; sayaç bunu
   * TÜRETİR (bkz. `@/lib/ozel-ders`), arka planda iş çalışmaz.
   */
  renewal: text("renewal", { enum: ["yok", "haftalik", "aylik"] })
    .notNull()
    .default("yok"),
  /** Ücret planı ön-doldurması: paket kaç ayı kapsıyor (fee_plans.periodMonths). */
  periodMonths: integer("period_months"),
  /** JSON-encoded string[] of feature bullets. */
  features: text("features"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * Öğrenciye ATANMIŞ paket — "bu öğrenci ne satın aldı" sorusunun cevabı.
 *
 * Kayıt başına BİRDEN ÇOK satır serbesttir (koçluk + özel ders aynı anda).
 * Bilinçli: `enrollments_one_active_per_student_uq` bir öğrenciye ikinci aktif
 * kayıt açtırmaz, dolayısıyla ikinci ürün ikinci enrollment olarak modellenemez.
 *
 * Ad ve fiyat SNAPSHOT'tır: katalogdaki fiyat sonradan değişince geçmiş
 * atamalar bozulmaz (net snapshot'ıyla aynı ilke). `package_id` yalnız izdir;
 * kataloğa bağlı olmayan özel anlaşmalarda NULL kalır.
 */
export const enrollmentPackages = sqliteTable(
  "enrollment_packages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    packageId: integer("package_id").references(() => packages.id),
    /** Atama anındaki paket adı — katalog değişse de fatura geçmişi okunur kalır. */
    nameSnapshot: text("name_snapshot").notNull(),
    /** Atama anındaki fiyat (kuruş). */
    priceKurusSnapshot: integer("price_kurus_snapshot").notNull(),
    kind: text("kind", { enum: ["kocluk", "ozel_ders", "kocluk_ozel_ders"] })
      .notNull()
      .default("kocluk"),
    /**
     * TEK SEFERLİK tanınan saat — yalnız `renewal = "yok"` iken kullanılır
     * ("sınava kadar 40 saat"). Yenilenen paketlerde 0 kalır.
     */
    lessonHoursGranted: integer("lesson_hours_granted").notNull().default(0),
    /**
     * Hak yenilenme sıklığı. Haftalık/aylık pakette öğrenci her dönem yeniden
     * hak kazanır; toplam hak `startsOn`dan bugüne geçen dönem sayısından
     * TÜRETİLİR — cron yok, saklanan sayaç yok, dolayısıyla kayma da yok.
     */
    renewal: text("renewal", { enum: ["yok", "haftalik", "aylik"] })
      .notNull()
      .default("yok"),
    /** Yenilenen pakette DÖNEM BAŞINA tanınan saat (haftada 1, ayda 4 gibi). */
    hoursPerPeriod: integer("hours_per_period").notNull().default(0),
    startsOn: integer("starts_on", { mode: "timestamp" }),
    endsOn: integer("ends_on", { mode: "timestamp" }),
    status: text("status", { enum: ["aktif", "bitti", "iptal"] })
      .notNull()
      .default("aktif"),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("enrollment_packages_enrollment_idx").on(t.enrollmentId, t.status),
  ],
);

/**
 * Planlanan / işlenen ÖZEL DERS.
 *
 * `coaching_sessions` GENİŞLETİLMEDİ, bilinçli: o tabloyu 6 canlı sorgu okuyor
 * (`@/db/queries/sessions`) ve hepsi /koc/gorusmeler, /ogrenci/gorusmeler ve
 * eklenti seçicisini besliyor. Bir `type` kolonu eklemek her sorguya filtre
 * borcu yüklerdi; biri atlanınca dersler görüşme listelerine sızardı. Ayrı
 * tablo aynı deseni sıfır regresyon riskiyle izler.
 *
 * Eğitmen iki türlü olabilir: hesabı olan koç (`instructor_user_id`) ya da
 * hesabı olmayan dış öğretmen (`instructor_profile_id` → coach_profiles, ki o
 * tablo zaten hesapsız profili destekliyor). Yeni bir rol gerekmez.
 */
export const privateLessons = sqliteTable(
  "private_lessons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    /** Hangi paketin hakkından düşüyor; NULL = hak dışı / ekstra ders. */
    enrollmentPackageId: integer("enrollment_package_id").references(
      () => enrollmentPackages.id,
    ),
    subjectId: integer("subject_id").references(() => subjects.id),
    topicId: integer("topic_id").references(() => topics.id),
    instructorUserId: text("instructor_user_id").references(() => users.id),
    instructorProfileId: integer("instructor_profile_id").references(
      () => coachProfiles.id,
    ),
    scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
    heldAt: integer("held_at", { mode: "timestamp" }),
    durationMinutes: integer("duration_minutes").notNull().default(60),
    status: text("status", {
      enum: ["scheduled", "held", "cancelled", "missed"],
    })
      .notNull()
      .default("scheduled"),
    /**
     * Kalan haktan düşsün mü. Telafi/ücretsiz tanıtım dersleri için false —
     * ders kaydı görünür kalır ama saat yakmaz.
     */
    countsAgainstQuota: integer("counts_against_quota", { mode: "boolean" })
      .notNull()
      .default(true),
    /** Eğitmene özel not. */
    note: text("note"),
    /** Öğrencinin gördüğü not. */
    studentVisibleNote: text("student_visible_note"),
    meetingUrl: text("meeting_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("private_lessons_enrollment_idx").on(t.enrollmentId, t.scheduledAt),
    index("private_lessons_package_idx").on(t.enrollmentPackageId),
  ],
);

export const faqs = sqliteTable("faqs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

/**
 * Toplu mesaj (duyuru) şablonları — /koc/duyuru composer'ını besler.
 * Kadro geneli (global), koç/yönetici düzenler → marka sesi tutarlı kalır.
 * Gövdedeki `{ad}` gönderim anında öğrenci adıyla değişir (client-side).
 * `category` konu grubudur (Takip/Ödeme/Yeni öğrenci/Önemli ya da yeni bir grup);
 * `is_active=false` şablonu composer listesinden gizler.
 */
export const messageTemplates = sqliteTable(
  "message_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category").notNull().default("Genel"),
    label: text("label").notNull(),
    body: text("body").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    /** Oluşturan/son düzenleyen koç — opsiyonel iz. */
    createdByUserId: text("created_by_user_id").references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("message_templates_group_idx").on(t.category, t.sortOrder)],
);

export const coachProfiles = sqliteTable("coach_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /**
   * Bağlı koç hesabı. NULL = henüz hesabı olmayan koç: profili sitede görünür
   * ama uygulamaya giriş yapamaz, öğrenci atanamaz. Hesap açılınca doldurulur
   * ve koç profilini /koc/profil'den kendisi yönetmeye başlar.
   */
  userId: text("user_id")
    .unique()
    .references(() => users.id),
  /** Public URL slug (/koclar/[slug]); türetilir, benzersizdir. Null → linklenmez. */
  slug: text("slug").unique(),
  displayName: text("display_name").notNull(),
  /** Ünvan — "Eğitim Koçu" gibi. */
  title: text("title"),
  /** Konum — "Kartal, İstanbul" gibi. */
  location: text("location"),
  /** Kısa vurucu tanıtım (kart + profil üstü). */
  headline: text("headline"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  /** Profil arka planı (kapak görseli). */
  coverImageUrl: text("cover_image_url"),
  /** JSON-encoded string[] of subject/exam labels. */
  subjects: text("subjects"),
  achievements: text("achievements"),
  /** JSON-encoded {label,url}[] — diğer platform/hesap bağlantıları. */
  links: text("links"),
  /** Doğrulama/harici profil bağlantısı (Gigbi vb.). */
  proofUrl: text("proof_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* -------------------------------------------------------------------------- */
/*  AI layer (transcript -> öneri -> onay; sohbet; denetim)                   */
/*  Güvenlik: model YALNIZ öneri üretir; yazma mevcut Server Action'lardan     */
/*  geçer. AI tablolarını silmek takip verisini bozmaz.                        */
/* -------------------------------------------------------------------------- */

export const transcripts = sqliteTable(
  "transcripts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    coachingSessionId: integer("coaching_session_id").references(
      () => coachingSessions.id,
    ),
    /** audio = kayıt yüklendi (R2); paste = Meet/Zoom dökümü yapıştırıldı;
     *  live = tarayıcı eklentisi görüşmeyi cihazda canlı çevirdi (ses saklanmaz). */
    source: text("source", { enum: ["audio", "paste", "live"] }).notNull(),
    /** R2 nesne anahtarı (source=audio); onay sonrası silinebilir. */
    audioR2Key: text("audio_r2_key"),
    rawText: text("raw_text"),
    language: text("language").notNull().default("tr"),
    wordCount: integer("word_count"),
    /** AI üretimi Türkçe özet (grounding paketinde kullanılır). */
    digest: text("digest"),
    status: text("status", {
      enum: ["uploaded", "transcribing", "transcribed", "extracted", "failed"],
    })
      .notNull()
      .default("uploaded"),
    /** KVKK: görüşme-bazlı kayıt onayı (reşit olmayan öğrenciler için veli onayı). */
    consentState: text("consent_state", {
      enum: ["pending", "granted", "denied"],
    })
      .notNull()
      .default("pending"),
    errorMessage: text("error_message"),
    createdByUserId: text("created_by_user_id").references(() => users.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("transcripts_enrollment_idx").on(t.enrollmentId, t.createdAt),
    index("transcripts_session_idx").on(t.coachingSessionId),
    index("transcripts_status_idx").on(t.status),
  ],
);

export const aiProposals = sqliteTable(
  "ai_proposals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    transcriptId: integer("transcript_id")
      .notNull()
      .references(() => transcripts.id),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => enrollments.id),
    kind: text("kind", {
      enum: [
        "question_log_upsert",
        "mock_exam_create",
        "plan_task_create",
        "topic_progress_update",
        "session_note_update",
      ],
    }).notNull(),
    /** Hedef Server Action'ın mevcut Zod girdisiyle BİREBİR aynı şekilli JSON. */
    payloadJson: text("payload_json").notNull(),
    /** Öneriyi haklı çıkaran birebir Türkçe transkript alıntısı (güven çıpası). */
    sourceQuote: text("source_quote"),
    confidence: real("confidence"),
    status: text("status", {
      enum: ["proposed", "approved", "rejected", "applied", "failed"],
    })
      .notNull()
      .default("proposed"),
    /** Uygulanan action'ın döndürdüğü JSON (id/adet) ya da hata. */
    resultJson: text("result_json"),
    reviewedByUserId: text("reviewed_by_user_id").references(() => users.id),
    appliedAt: integer("applied_at", { mode: "timestamp" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("ai_proposals_transcript_idx").on(t.transcriptId),
    index("ai_proposals_enrollment_idx").on(t.enrollmentId),
    index("ai_proposals_status_idx").on(t.status),
  ],
);

export const chatThreads = sqliteTable(
  "chat_threads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Nullable: koç ajanı sohbetleri öğrenci-üstü olabilir (tek enrollment yok). */
    enrollmentId: integer("enrollment_id").references(() => enrollments.id),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    audience: text("audience", { enum: ["student", "coach"] }).notNull(),
    title: text("title"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("chat_threads_owner_idx").on(t.ownerUserId),
    index("chat_threads_enrollment_idx").on(t.enrollmentId),
  ],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    threadId: integer("thread_id")
      .notNull()
      .references(() => chatThreads.id),
    role: text("role", {
      enum: ["user", "assistant", "tool", "system"],
    }).notNull(),
    content: text("content").notNull(),
    /** Ajan turlarındaki araç çağrıları (düz mesajlarda NULL). */
    toolCallsJson: text("tool_calls_json"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: createdAt(),
  },
  (t) => [index("chat_messages_thread_idx").on(t.threadId, t.createdAt)],
);

export const aiAuditLog = sqliteTable(
  "ai_audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => users.id),
    enrollmentId: integer("enrollment_id").references(() => enrollments.id),
    threadId: integer("thread_id").references(() => chatThreads.id),
    toolName: text("tool_name").notNull(),
    argsJson: text("args_json"),
    /** auto = okuma (otomatik); confirmed = yazma (koç onayladı); denied = reddedildi. */
    decision: text("decision", {
      enum: ["auto", "confirmed", "denied"],
    }).notNull(),
    resultStatus: text("result_status", { enum: ["ok", "error"] }),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [
    index("ai_audit_log_actor_idx").on(t.actorUserId, t.createdAt),
    index("ai_audit_log_enrollment_idx").on(t.enrollmentId),
  ],
);

/**
 * AI jeton sayacı — her model çağrısının maliyeti buradan hesaplanır.
 *
 * Neden ayrı tablo: `ai_audit_log` koç ajanının ARAÇ çağrılarını (yetki/izlenebilirlik
 * için) tutar, model kullanımını değil. Maliyet sorusu ("bu ay AI'a ne harcadık")
 * jeton sayısı olmadan cevaplanamıyordu ve tahmine kalıyordu.
 *
 * Fiyat SAKLANMAZ, jeton saklanır: model fiyatları değişir, geçmiş satırları
 * yeniden yazmak yerine okuma anında `@/lib/maliyet` ile hesaplanır (net
 * snapshot kuralının tersi — burada tarihsel doğruluk değil, güncel fiyat istenir).
 */
export const aiUsageLog = sqliteTable(
  "ai_usage_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Hangi özellik harcadı — panelde kırılım bunun üzerinden. */
    feature: text("feature", {
      enum: [
        "program-taslak",
        "koc-asistani",
        "ogrenci-sohbet",
        "transkript-cikarim",
        "ekstre-cikarim",
        "ses-metin",
      ],
    }).notNull(),
    /** Model slug'ı (ör. anthropic/claude-haiku-4.5) — fiyat buna göre bulunur. */
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    /** Önbellekten okunan girdi (varsa) — girdi fiyatının onda biri. */
    cachedInputTokens: integer("cached_input_tokens").notNull().default(0),
    /** Ses modelleri jeton değil süre üzerinden ücretlenir. */
    audioSeconds: integer("audio_seconds"),
    enrollmentId: integer("enrollment_id").references(() => enrollments.id),
    createdAt: createdAt(),
  },
  (t) => [
    index("ai_usage_log_created_idx").on(t.createdAt),
    index("ai_usage_log_feature_created_idx").on(t.feature, t.createdAt),
  ],
);

/**
 * GELİŞTİRME jetonları — projeyi yazarken harcanan Claude Code kullanımı.
 *
 * `ai_usage_log` uygulamanın KENDİ AI çağrılarını sayar; geliştirme jetonları
 * geliştiricinin makinesindeki oturum kayıtlarında durur ve Worker onları
 * göremez. `scripts/gelistirme-maliyeti.mjs` her dağıtımda o kayıtları tarayıp
 * buraya bir ANLIK GÖRÜNTÜ yazar — böylece panel elle güncellenmek zorunda kalmaz.
 *
 * Aynı ölçümün satırları `measuredAt` ile gruplanır (model başına bir satır);
 * panel en son `measuredAt`'i okur. Geçmiş ölçümler silinmez: zamanla
 * geliştirme maliyetinin nasıl büyüdüğü görülebilsin.
 */
export const devUsageSnapshot = sqliteTable(
  "dev_usage_snapshot",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Ölçümün alındığı an — bir çalıştırmanın tüm satırlarında AYNI. */
    measuredAt: integer("measured_at", { mode: "timestamp" }).notNull(),
    /** Taranan oturum kayıtlarındaki ilk/son mesaj — kapsanan dönem. */
    firstAt: integer("first_at", { mode: "timestamp" }),
    lastAt: integer("last_at", { mode: "timestamp" }),
    /** Anthropic model kimliği (ör. claude-opus-4-8). */
    model: text("model").notNull(),
    calls: integer("calls").notNull().default(0),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    /** Önbellek yazımı TTL'e göre farklı fiyatlanır (5 dk %125, 1 sa %200). */
    cacheWrite5mTokens: integer("cache_write_5m_tokens").notNull().default(0),
    cacheWrite1hTokens: integer("cache_write_1h_tokens").notNull().default(0),
  },
  (t) => [index("dev_usage_snapshot_measured_idx").on(t.measuredAt)],
);

/**
 * Tarayıcı eklentisi kimliği: koç-başı uzun-ömürlü bearer token. Cookie
 * oturumu cross-origin (chrome-extension://) çalışmadığından eklenti bu token'ı
 * gönderir. Düz metin YALNIZ üretim anında bir kez gösterilir; DB'de yalnız
 * SHA-256 hex tutulur. İptal = revoked_at doldur.
 */
export const extensionTokens = sqliteTable(
  "extension_tokens",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    coachUserId: text("coach_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Sunulan bearer token'ının SHA-256 hex'i (unique). */
    tokenHash: text("token_hash").notNull().unique(),
    /** Koçun verdiği cihaz etiketi ("Chrome — iş dizüstü"). */
    label: text("label"),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    revokedAt: integer("revoked_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("extension_tokens_coach_idx").on(t.coachUserId)],
);

/* -------------------------------------------------------------------------- */
/*  Relations (relational query API)                                          */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  student: one(students, {
    fields: [users.id],
    references: [students.userId],
  }),
  coachProfile: one(coachProfiles, {
    fields: [users.id],
    references: [coachProfiles.userId],
  }),
  coachedEnrollments: many(enrollments),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const examTemplatesRelations = relations(examTemplates, ({ many }) => ({
  sections: many(examSections),
  tracks: many(tracks),
  enrollments: many(enrollments),
  /** İkinci sınavı bu şablon olan kayıtlar (bkz. enrollments.secondaryExamTemplateId). */
  secondaryEnrollments: many(enrollments, {
    relationName: "secondaryExamTemplate",
  }),
}));

export const examSectionsRelations = relations(
  examSections,
  ({ one, many }) => ({
    examTemplate: one(examTemplates, {
      fields: [examSections.examTemplateId],
      references: [examTemplates.id],
    }),
    subjects: many(subjects),
    mockExams: many(mockExams),
  }),
);

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  examTemplate: one(examTemplates, {
    fields: [tracks.examTemplateId],
    references: [examTemplates.id],
  }),
  enrollments: many(enrollments),
  /** İkinci sınavın alanı olarak seçilmiş kayıtlar. */
  secondaryEnrollments: many(enrollments, { relationName: "secondaryTrack" }),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  examSection: one(examSections, {
    fields: [subjects.examSectionId],
    references: [examSections.id],
  }),
  parent: one(subjects, {
    fields: [subjects.parentSubjectId],
    references: [subjects.id],
    relationName: "subjectTree",
  }),
  children: many(subjects, { relationName: "subjectTree" }),
  topics: many(topics),
  questionLogs: many(questionLogs),
  mockExamResults: many(mockExamResults),
  subjectAssignments: many(subjectAssignments),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  mockTopicErrors: many(mockTopicErrors),
  resourceProgress: many(topicResourceProgress),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(
  enrollments,
  ({ one, many }) => ({
    student: one(students, {
      fields: [enrollments.studentId],
      references: [students.id],
    }),
    examTemplate: one(examTemplates, {
      fields: [enrollments.examTemplateId],
      references: [examTemplates.id],
    }),
    track: one(tracks, {
      fields: [enrollments.trackId],
      references: [tracks.id],
    }),
    secondaryExamTemplate: one(examTemplates, {
      fields: [enrollments.secondaryExamTemplateId],
      references: [examTemplates.id],
      relationName: "secondaryExamTemplate",
    }),
    secondaryTrack: one(tracks, {
      fields: [enrollments.secondaryTrackId],
      references: [tracks.id],
      relationName: "secondaryTrack",
    }),
    coach: one(users, {
      fields: [enrollments.coachUserId],
      references: [users.id],
    }),
    subjectAssignments: many(subjectAssignments),
    resources: many(resources),
    weeklyPlans: many(weeklyPlans),
    planDayLayouts: many(planDayLayouts),
    questionLogs: many(questionLogs),
    mockExams: many(mockExams),
    topicResourceProgress: many(topicResourceProgress),
    coachingSessions: many(coachingSessions),
    contentVisibility: many(contentVisibility),
    contentViews: many(contentViews),
    feePlans: many(feePlans),
    invoices: many(invoices),
    payments: many(payments),
    transcripts: many(transcripts),
    aiProposals: many(aiProposals),
    chatThreads: many(chatThreads),
  }),
);

export const subjectAssignmentsRelations = relations(
  subjectAssignments,
  ({ one }) => ({
    enrollment: one(enrollments, {
      fields: [subjectAssignments.enrollmentId],
      references: [enrollments.id],
    }),
    subject: one(subjects, {
      fields: [subjectAssignments.subjectId],
      references: [subjects.id],
    }),
    primaryResource: one(resources, {
      fields: [subjectAssignments.primaryResourceId],
      references: [resources.id],
    }),
  }),
);

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  enrollment: one(enrollments, {
    fields: [resources.enrollmentId],
    references: [enrollments.id],
  }),
  subject: one(subjects, {
    fields: [resources.subjectId],
    references: [subjects.id],
  }),
  topicProgress: many(topicResourceProgress),
  questionLogs: many(resourceQuestionLogs),
}));

export const resourceQuestionLogsRelations = relations(
  resourceQuestionLogs,
  ({ one }) => ({
    enrollment: one(enrollments, {
      fields: [resourceQuestionLogs.enrollmentId],
      references: [enrollments.id],
    }),
    resource: one(resources, {
      fields: [resourceQuestionLogs.resourceId],
      references: [resources.id],
    }),
  }),
);

export const weeklyPlansRelations = relations(weeklyPlans, ({ one, many }) => ({
  enrollment: one(enrollments, {
    fields: [weeklyPlans.enrollmentId],
    references: [enrollments.id],
  }),
  tasks: many(planTasks),
}));

export const planDayLayoutsRelations = relations(planDayLayouts, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [planDayLayouts.enrollmentId],
    references: [enrollments.id],
  }),
}));

export const planTasksRelations = relations(planTasks, ({ one }) => ({
  weeklyPlan: one(weeklyPlans, {
    fields: [planTasks.weeklyPlanId],
    references: [weeklyPlans.id],
  }),
  subject: one(subjects, {
    fields: [planTasks.subjectId],
    references: [subjects.id],
  }),
  topic: one(topics, { fields: [planTasks.topicId], references: [topics.id] }),
  resource: one(resources, {
    fields: [planTasks.resourceId],
    references: [resources.id],
  }),
}));

export const questionLogsRelations = relations(questionLogs, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [questionLogs.enrollmentId],
    references: [enrollments.id],
  }),
  subject: one(subjects, {
    fields: [questionLogs.subjectId],
    references: [subjects.id],
  }),
}));

export const studyLogsRelations = relations(studyLogs, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [studyLogs.enrollmentId],
    references: [enrollments.id],
  }),
  subject: one(subjects, {
    fields: [studyLogs.subjectId],
    references: [subjects.id],
  }),
}));

export const mockExamsRelations = relations(mockExams, ({ one, many }) => ({
  enrollment: one(enrollments, {
    fields: [mockExams.enrollmentId],
    references: [enrollments.id],
  }),
  examSection: one(examSections, {
    fields: [mockExams.examSectionId],
    references: [examSections.id],
  }),
  results: many(mockExamResults),
  topicErrors: many(mockTopicErrors),
}));

export const mockExamResultsRelations = relations(
  mockExamResults,
  ({ one }) => ({
    mockExam: one(mockExams, {
      fields: [mockExamResults.mockExamId],
      references: [mockExams.id],
    }),
    subject: one(subjects, {
      fields: [mockExamResults.subjectId],
      references: [subjects.id],
    }),
  }),
);

export const mockTopicErrorsRelations = relations(
  mockTopicErrors,
  ({ one }) => ({
    mockExam: one(mockExams, {
      fields: [mockTopicErrors.mockExamId],
      references: [mockExams.id],
    }),
    topic: one(topics, {
      fields: [mockTopicErrors.topicId],
      references: [topics.id],
    }),
  }),
);

export const topicResourceProgressRelations = relations(
  topicResourceProgress,
  ({ one }) => ({
    enrollment: one(enrollments, {
      fields: [topicResourceProgress.enrollmentId],
      references: [enrollments.id],
    }),
    topic: one(topics, {
      fields: [topicResourceProgress.topicId],
      references: [topics.id],
    }),
    resource: one(resources, {
      fields: [topicResourceProgress.resourceId],
      references: [resources.id],
    }),
  }),
);

export const coachingSessionsRelations = relations(
  coachingSessions,
  ({ one, many }) => ({
    enrollment: one(enrollments, {
      fields: [coachingSessions.enrollmentId],
      references: [enrollments.id],
    }),
    nextPlan: one(weeklyPlans, {
      fields: [coachingSessions.nextPlanId],
      references: [weeklyPlans.id],
    }),
    transcripts: many(transcripts),
  }),
);

export const transcriptsRelations = relations(
  transcripts,
  ({ one, many }) => ({
    enrollment: one(enrollments, {
      fields: [transcripts.enrollmentId],
      references: [enrollments.id],
    }),
    coachingSession: one(coachingSessions, {
      fields: [transcripts.coachingSessionId],
      references: [coachingSessions.id],
    }),
    createdBy: one(users, {
      fields: [transcripts.createdByUserId],
      references: [users.id],
    }),
    proposals: many(aiProposals),
  }),
);

export const aiProposalsRelations = relations(aiProposals, ({ one }) => ({
  transcript: one(transcripts, {
    fields: [aiProposals.transcriptId],
    references: [transcripts.id],
  }),
  enrollment: one(enrollments, {
    fields: [aiProposals.enrollmentId],
    references: [enrollments.id],
  }),
  reviewedBy: one(users, {
    fields: [aiProposals.reviewedByUserId],
    references: [users.id],
  }),
}));

export const chatThreadsRelations = relations(
  chatThreads,
  ({ one, many }) => ({
    enrollment: one(enrollments, {
      fields: [chatThreads.enrollmentId],
      references: [enrollments.id],
    }),
    owner: one(users, {
      fields: [chatThreads.ownerUserId],
      references: [users.id],
    }),
    messages: many(chatMessages),
  }),
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  thread: one(chatThreads, {
    fields: [chatMessages.threadId],
    references: [chatThreads.id],
  }),
}));

export const aiAuditLogRelations = relations(aiAuditLog, ({ one }) => ({
  actor: one(users, {
    fields: [aiAuditLog.actorUserId],
    references: [users.id],
  }),
  enrollment: one(enrollments, {
    fields: [aiAuditLog.enrollmentId],
    references: [enrollments.id],
  }),
  thread: one(chatThreads, {
    fields: [aiAuditLog.threadId],
    references: [chatThreads.id],
  }),
}));

export const contentItemsRelations = relations(
  contentItems,
  ({ one, many }) => ({
    examTemplate: one(examTemplates, {
      fields: [contentItems.examTemplateId],
      references: [examTemplates.id],
    }),
    subject: one(subjects, {
      fields: [contentItems.subjectId],
      references: [subjects.id],
    }),
    topic: one(topics, {
      fields: [contentItems.topicId],
      references: [topics.id],
    }),
    createdBy: one(users, {
      fields: [contentItems.createdByUserId],
      references: [users.id],
    }),
    visibility: many(contentVisibility),
    views: many(contentViews),
  }),
);

export const contentVisibilityRelations = relations(
  contentVisibility,
  ({ one }) => ({
    contentItem: one(contentItems, {
      fields: [contentVisibility.contentItemId],
      references: [contentItems.id],
    }),
    enrollment: one(enrollments, {
      fields: [contentVisibility.enrollmentId],
      references: [enrollments.id],
    }),
  }),
);

export const contentViewsRelations = relations(contentViews, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [contentViews.contentItemId],
    references: [contentItems.id],
  }),
  enrollment: one(enrollments, {
    fields: [contentViews.enrollmentId],
    references: [enrollments.id],
  }),
}));

export const feePlansRelations = relations(feePlans, ({ one, many }) => ({
  enrollment: one(enrollments, {
    fields: [feePlans.enrollmentId],
    references: [enrollments.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  enrollment: one(enrollments, {
    fields: [invoices.enrollmentId],
    references: [enrollments.id],
  }),
  feePlan: one(feePlans, {
    fields: [invoices.feePlanId],
    references: [feePlans.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  receivedBy: one(users, {
    fields: [payments.receivedByUserId],
    references: [users.id],
  }),
}));

export const paymentNoticesRelations = relations(paymentNotices, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [paymentNotices.enrollmentId],
    references: [enrollments.id],
  }),
  invoice: one(invoices, {
    fields: [paymentNotices.invoiceId],
    references: [invoices.id],
  }),
  resolvedPayment: one(payments, {
    fields: [paymentNotices.resolvedPaymentId],
    references: [payments.id],
  }),
  resolvedBy: one(users, {
    fields: [paymentNotices.resolvedByUserId],
    references: [users.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorUserId],
    references: [users.id],
  }),
}));

export const coachProfilesRelations = relations(coachProfiles, ({ one }) => ({
  user: one(users, {
    fields: [coachProfiles.userId],
    references: [users.id],
  }),
}));

export const extensionTokensRelations = relations(
  extensionTokens,
  ({ one }) => ({
    coachUser: one(users, {
      fields: [extensionTokens.coachUserId],
      references: [users.id],
    }),
  }),
);

/* -------------------------------------------------------------------------- */
/*  Inferred types                                                            */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ExamTemplate = typeof examTemplates.$inferSelect;
export type ExamSection = typeof examSections.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type SubjectAssignment = typeof subjectAssignments.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type ResourceQuestionLog = typeof resourceQuestionLogs.$inferSelect;
export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type PlanTask = typeof planTasks.$inferSelect;
export type PlanDayLayout = typeof planDayLayouts.$inferSelect;
export type QuestionLog = typeof questionLogs.$inferSelect;
export type NewQuestionLog = typeof questionLogs.$inferInsert;
export type MockExam = typeof mockExams.$inferSelect;
export type NewMockExam = typeof mockExams.$inferInsert;
export type MockExamResult = typeof mockExamResults.$inferSelect;
export type NewMockExamResult = typeof mockExamResults.$inferInsert;
export type MockTopicError = typeof mockTopicErrors.$inferSelect;
export type TopicResourceProgress = typeof topicResourceProgress.$inferSelect;
export type CoachingSession = typeof coachingSessions.$inferSelect;
export type Transcript = typeof transcripts.$inferSelect;
export type NewTranscript = typeof transcripts.$inferInsert;
export type AiProposal = typeof aiProposals.$inferSelect;
export type NewAiProposal = typeof aiProposals.$inferInsert;
export type ChatThread = typeof chatThreads.$inferSelect;
export type NewChatThread = typeof chatThreads.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type AiAuditLog = typeof aiAuditLog.$inferSelect;
export type NewAiAuditLog = typeof aiAuditLog.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
export type ContentView = typeof contentViews.$inferSelect;
export type FeePlan = typeof feePlans.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type CohortSettings = typeof cohortSettings.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type WaitlistEntry = typeof waitlistEntries.$inferSelect;
export type CoachApplication = typeof coachApplications.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type ResourceLink = typeof resourceLinks.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type EnrollmentPackage = typeof enrollmentPackages.$inferSelect;
export type NewEnrollmentPackage = typeof enrollmentPackages.$inferInsert;
export type PrivateLesson = typeof privateLessons.$inferSelect;
export type NewPrivateLesson = typeof privateLessons.$inferInsert;
export type Faq = typeof faqs.$inferSelect;
export type CoachProfile = typeof coachProfiles.$inferSelect;
export type ExtensionToken = typeof extensionTokens.$inferSelect;
export type NewExtensionToken = typeof extensionTokens.$inferInsert;

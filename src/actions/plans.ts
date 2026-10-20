"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb, type DB } from "@/db";
import {
  enrollments,
  examSections,
  planDayLayouts,
  planTasks,
  resources,
  subjects,
  weeklyPlans,
} from "@/db/schema";
import { chunkForD1, selectInChunks } from "@/lib/d1";
import { addDays, mondayOf, trDayKey } from "@/lib/dates";
import { isDayColorKey, serializeSubjectIds } from "@/lib/plan-layout";
import { serializeResourceIds } from "@/lib/plan-resources";
import {
  getOrCreateWeeklyPlan,
  getPlanDayLayout,
  getPlanForReuse,
  type PlanStatus,
} from "@/db/queries/plans";
import {
  copyPlanDayLayoutSchema,
  copyPreviousWeekSchema,
  planTaskCreateSchema,
  planTaskIdSchema,
  planTasksCreateSchema,
  planTaskUpdateSchema,
  publishPlanSchema,
  savePlanDayLayoutSchema,
  submitPlanForReviewSchema,
  togglePlanTaskSchema,
  upsertWeeklyPlanSchema,
  type PlanTasksCreateInput,
} from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  requireUser,
  type ActionResult,
  type SessionUser,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

const clean = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

const isStudentRole = (user: SessionUser) =>
  user.role !== "coach" && user.role !== "admin";

/**
 * Görevin kaynak listesi — çok seçimli `resourceIds` ile eski tek seçimli
 * `resourceId` girdisini birleştirir, sonra KAYDIN kendi kaynaklarına indirger.
 * Başka bir öğrencinin kaynağı sessizce düşer (JSON kolonda FK yok, doğrulama
 * burada yapılır). Seçim sırası korunur — gösterim sırası odur.
 */
async function taskResourceIdsFor(
  db: DB,
  enrollmentId: number,
  input: { resourceIds?: number[]; resourceId?: number | null },
): Promise<number[]> {
  const wanted = [
    ...new Set([
      ...(input.resourceIds ?? []),
      ...(input.resourceId != null ? [input.resourceId] : []),
    ]),
  ];
  const owned = await ownedResourceIdsFor(db, enrollmentId, wanted);
  return wanted.filter((id) => owned.has(id));
}

/**
 * Verilen id'lerden GERÇEKTEN bu kayda ait olanlar. Liste toplu yazımlarda
 * uzayabildiği için sorgu D1'in parametre sınırına göre bölünür.
 */
async function ownedResourceIdsFor(
  db: DB,
  enrollmentId: number,
  ids: readonly number[],
): Promise<Set<number>> {
  const wanted = [...new Set(ids)];
  if (wanted.length === 0) return new Set();
  const rows = await selectInChunks(
    wanted,
    (part) =>
      db
        .select({ id: resources.id })
        .from(resources)
        .where(
          and(
            eq(resources.enrollmentId, enrollmentId),
            inArray(resources.id, part),
          ),
        ),
    // `enrollment_id = ?` sabit parametresi.
    1,
  );
  return new Set(rows.map((r) => r.id));
}

/**
 * Program YAZMA yetkisi. Koç/admin her zaman yazar. Öğrenci yalnız KENDİ
 * kaydının, TASLAK ve KENDİ önerdiği (proposedByStudent) planına yazabilir;
 * plan henüz yoksa (ilk kez oluşturuyor) da izinlidir. Koçun yayınlanmamış
 * taslağına ya da yayınlanmış programa öğrenci dokunamaz.
 */
async function assertPlanWritable(
  db: DB,
  enrollmentId: number,
  user: SessionUser,
  plan: { status: PlanStatus; proposedByStudent: boolean } | null,
): Promise<void> {
  await assertEnrollmentAccess(db, enrollmentId, user);
  if (!isStudentRole(user)) return;
  if (plan && (plan.status !== "draft" || !plan.proposedByStudent)) {
    throw new Error("Bu programı düzenleyemezsin.");
  }
}

/**
 * Haftalık plan üst bilgisi (motto, not, durum) — hafta bazında upsert.
 * Koç durumu değiştirebilir; öğrenci yalnız kendi taslağının motto/notunu
 * yazar (durum değişmez, taslak öğrenci önerisi olarak işaretlenir).
 */
export async function upsertWeeklyPlan(
  input: unknown,
): Promise<ActionResult<{ planId: number; weekKey: string }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = upsertWeeklyPlanSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, v.enrollmentId),
    });
    if (!enrollment) return actionError("Kayıt bulunamadı.");

    const weekStart = mondayOf(v.weekStart);
    const existing = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.enrollmentId, v.enrollmentId),
        eq(weeklyPlans.weekStart, weekStart),
      ),
    });
    await assertPlanWritable(db, v.enrollmentId, user, existing ?? null);
    const student = isStudentRole(user);
    // Öğrenci durum değiştiremez; koç isterse değiştirir.
    const statusSet = !student && v.status ? { status: v.status } : {};

    await db
      .insert(weeklyPlans)
      .values({
        enrollmentId: v.enrollmentId,
        weekStart,
        motto: clean(v.motto),
        coachNote: clean(v.coachNote),
        ...(student ? { proposedByStudent: true } : {}),
        ...statusSet,
      })
      .onConflictDoUpdate({
        target: [weeklyPlans.enrollmentId, weeklyPlans.weekStart],
        set: {
          motto: clean(v.motto),
          coachNote: clean(v.coachNote),
          ...statusSet,
          updatedAt: new Date(),
        },
      });

    const plan = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.enrollmentId, v.enrollmentId),
        eq(weeklyPlans.weekStart, weekStart),
      ),
    });
    if (!plan) return actionError("Program kaydedilemedi.");
    return { ok: true, data: { planId: plan.id, weekKey: trDayKey(weekStart) } };
  });
}

type NewPlanTask = PlanTasksCreateInput["tasks"][number];

/**
 * Görev yazımının TEK yolu — tekli ekleme, toplu ekleme, geçen haftayı kopyalama
 * ve koç ajanı hep buradan geçer.
 *
 * Eskiden `addPlanTask` görev başına ~6 ardışık D1 turu atıyordu (kayıt, plan,
 * yetki, `max(slot)`, kaynak, insert, yayın) ve kopyalama/ajan onu döngüde
 * çağırıyordu: 30 konuluk bir hafta ~180 tur. Burada bağımsız okumalar aynı
 * dalgada gider, slot bellekte ilerletilir, insert'ler + yayın tek `batch`.
 */
async function insertPlanTasks(
  db: DB,
  user: SessionUser,
  enrollmentId: number,
  weekStartInput: Date,
  tasks: NewPlanTask[],
): Promise<ActionResult<{ taskIds: number[]; planId: number }>> {
  const weekStart = mondayOf(weekStartInput);
  const [enrollment, existing] = await Promise.all([
    db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      columns: { id: true },
    }),
    db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.enrollmentId, enrollmentId),
        eq(weeklyPlans.weekStart, weekStart),
      ),
    }),
  ]);
  if (!enrollment) return actionError("Kayıt bulunamadı.");
  await assertPlanWritable(db, enrollmentId, user, existing ?? null);

  const plan =
    existing ?? (await getOrCreateWeeklyPlan(db, enrollmentId, weekStartInput));
  // Öğrenci yeni taslak açtıysa sahiplen — kendi görüp düzenleyebilsin.
  const claim = isStudentRole(user) && !plan.proposedByStudent;
  const proposedByStudent = plan.proposedByStudent || isStudentRole(user);

  const [slotRows, ownedResourceIds] = await Promise.all([
    // Gün başına sıradaki slot — tek sorguda, sonra bellekte ilerletilir.
    db
      .select({ day: planTasks.day, max: sql<number | null>`max(${planTasks.slot})` })
      .from(planTasks)
      .where(eq(planTasks.weeklyPlanId, plan.id))
      .groupBy(planTasks.day),
    // Kaynak sahipliği bir kez doğrulanır — görev başına sorgu atmaya gerek yok.
    ownedResourceIdsFor(
      db,
      enrollmentId,
      tasks.flatMap((t) => [
        ...(t.resourceIds ?? []),
        ...(t.resourceId != null ? [t.resourceId] : []),
      ]),
    ),
  ]);
  const nextSlot = new Map<number, number>();
  for (const r of slotRows) {
    // Haftalık konular (`day = null`) tek kovada toplanır; anahtar 0.
    nextSlot.set(r.day ?? 0, Number(r.max ?? -1) + 1);
  }

  const rows = tasks.map((t) => {
    const day = t.day ?? null;
    const bucket = day ?? 0;
    const slot = nextSlot.get(bucket) ?? 0;
    nextSlot.set(bucket, slot + 1);
    const resourceIds = [
      ...new Set([
        ...(t.resourceIds ?? []),
        ...(t.resourceId != null ? [t.resourceId] : []),
      ]),
    ].filter((id) => ownedResourceIds.has(id));
    return {
      weeklyPlanId: plan.id,
      day,
      slot,
      subjectId: t.subjectId ?? null,
      // Tekil kolon listenin ilk öğesini yansıtır (tarihsel; bkz. schema).
      resourceId: resourceIds[0] ?? null,
      resourceIds: serializeResourceIds(resourceIds),
      description: clean(t.description),
      targetQuestions: t.targetQuestions ?? null,
    };
  });

  const now = new Date();
  // Koçun kurduğu programda ayrı bir "Yayınla" adımı YOKTUR: ilk görevle
  // program canlıya çıkar. İstisna öğrencinin kendi taslağı — koç `publishPlan`
  // ile onaylayana kadar taslak kalır.
  const publish = plan.status === "draft" && !proposedByStudent;
  const planUpdate =
    claim || publish
      ? [
          db
            .update(weeklyPlans)
            .set({
              ...(claim ? { proposedByStudent: true } : {}),
              ...(publish ? { status: "published" as const } : {}),
              updatedAt: now,
            })
            .where(eq(weeklyPlans.id, plan.id)),
        ]
      : [];
  // Satır başına 10 `?` — D1'in 100 parametre sınırı (bkz. param-budget.test).
  const inserts = chunkForD1(rows, 10).map((part) =>
    db.insert(planTasks).values(part).returning({ id: planTasks.id }),
  );
  const [first, ...rest] = [...inserts, ...planUpdate];
  const results = await db.batch([first, ...rest]);
  const taskIds = (results.slice(0, inserts.length) as { id: number }[][]).flatMap(
    (r) => r.map((x) => x.id),
  );

  return { ok: true, data: { taskIds, planId: plan.id } };
}

/**
 * Görev ekler; hafta planı yoksa taslak olarak oluşturulur. `day` boşsa
 * haftalık konu (güne atanmamış). Koç ya da öğrenci (kendi taslağı) çağırır.
 */
export async function addPlanTask(
  input: unknown,
): Promise<ActionResult<{ taskId: number; planId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = planTaskCreateSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { enrollmentId, weekStart, ...task } = parsed.data;
    const res = await insertPlanTasks(getDb(), user, enrollmentId, weekStart, [
      task,
    ]);
    if (!res.ok) return res;
    return {
      ok: true,
      data: { taskId: res.data.taskIds[0], planId: res.data.planId },
    };
  });
}

/**
 * Görevleri TEK ÇAĞRIDA ekler (AI taslağının onaylanması gibi toplu yazımlar).
 *
 * `addPlanTask`'ı döngüde çağırmak istemciden görev başına ayrı bir Server
 * Action isteği demekti: 40 konuluk bir taslak 40 HTTP turu ediyordu; telefonda
 * dakikalarca "kaydediliyor"da kalıyor, aradaki tek bir kopma da geri kalan
 * konuları düşürüyordu.
 */
export async function addPlanTasks(
  input: unknown,
): Promise<ActionResult<{ added: number; planId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = planTasksCreateSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const res = await insertPlanTasks(
      getDb(),
      user,
      v.enrollmentId,
      v.weekStart,
      v.tasks,
    );
    if (!res.ok) return res;
    return {
      ok: true,
      data: { added: res.data.taskIds.length, planId: res.data.planId },
    };
  });
}

/**
 * Görevi düzenler (gün taşıma / haftalık konuya çevirme dahil). `day` boşsa
 * güne atanmamış hafta konusu olur. Koç ya da öğrenci (kendi taslağı).
 */
export async function updatePlanTask(
  input: unknown,
): Promise<ActionResult<{ taskId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = planTaskUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const task = await db.query.planTasks.findFirst({
      where: eq(planTasks.id, v.taskId),
      with: { weeklyPlan: true },
    });
    if (!task) return actionError("Görev bulunamadı.");
    await assertPlanWritable(
      db,
      task.weeklyPlan.enrollmentId,
      user,
      task.weeklyPlan,
    );

    const resourceIds = await taskResourceIdsFor(
      db,
      task.weeklyPlan.enrollmentId,
      v,
    );

    await db
      .update(planTasks)
      .set({
        day: v.day ?? null,
        subjectId: v.subjectId ?? null,
        resourceId: resourceIds[0] ?? null,
        resourceIds: serializeResourceIds(resourceIds),
        description: clean(v.description),
        targetQuestions: v.targetQuestions ?? null,
      })
      .where(eq(planTasks.id, v.taskId));

    return { ok: true, data: { taskId: v.taskId } };
  });
}

/** Görevi siler. Koç ya da öğrenci (kendi taslağı). */
export async function deletePlanTask(
  input: unknown,
): Promise<ActionResult<{ taskId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = planTaskIdSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const db = getDb();

    const task = await db.query.planTasks.findFirst({
      where: eq(planTasks.id, parsed.data.taskId),
      with: { weeklyPlan: true },
    });
    if (!task) return actionError("Görev bulunamadı.");
    await assertPlanWritable(
      db,
      task.weeklyPlan.enrollmentId,
      user,
      task.weeklyPlan,
    );

    await db.delete(planTasks).where(eq(planTasks.id, parsed.data.taskId));
    return { ok: true, data: { taskId: parsed.data.taskId } };
  });
}

/**
 * Koç: ÖĞRENCİ ÖNERİSİNİ onaylar — program resmileşir, öğrenci artık görevleri
 * işaretleyebilir. Koçun kendi kurduğu program zaten otomatik yayınlanır
 * (bkz. `autoPublishCoachPlan`); bu aksiyonun tek kullanımı öğrenci taslağıdır.
 */
export async function publishPlan(
  input: unknown,
): Promise<ActionResult<{ planId: number; weekKey: string }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = publishPlanSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const db = getDb();

    const plan = await db.query.weeklyPlans.findFirst({
      where: eq(weeklyPlans.id, parsed.data.planId),
    });
    if (!plan) return actionError("Program bulunamadı.");

    const [taskCount] = await db
      .select({ n: sql<number>`count(*)` })
      .from(planTasks)
      .where(eq(planTasks.weeklyPlanId, plan.id));
    if (Number(taskCount?.n ?? 0) === 0) {
      return actionError("Boş program onaylanamaz — önce en az bir konu ekle.");
    }

    await db
      .update(weeklyPlans)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(weeklyPlans.id, plan.id));

    return {
      ok: true,
      data: { planId: plan.id, weekKey: trDayKey(plan.weekStart) },
    };
  });
}

/**
 * Geçen haftanın programını bu haftaya kopyalar (görevleri olduğu gibi ekler;
 * isDone sıfırlanır). Koç ya da öğrenci (kendi taslağı) çağırır.
 */
export async function copyPreviousWeekPlan(
  input: unknown,
): Promise<ActionResult<{ added: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = copyPreviousWeekSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { enrollmentId, weekStart } = parsed.data;
    const db = getDb();
    const monday = mondayOf(weekStart);

    const [existing, source] = await Promise.all([
      db.query.weeklyPlans.findFirst({
        where: and(
          eq(weeklyPlans.enrollmentId, enrollmentId),
          eq(weeklyPlans.weekStart, monday),
        ),
      }),
      getPlanForReuse(enrollmentId, addDays(monday, -7)),
    ]);
    await assertPlanWritable(db, enrollmentId, user, existing ?? null);

    const items = source.filter((t) => t.description && t.description.trim());
    if (items.length === 0) {
      return actionError("Geçen hafta için kopyalanacak plan yok.");
    }

    // Tek yazım: görev başına ayrı action yerine hepsi bir batch'te.
    const res = await insertPlanTasks(
      db,
      user,
      enrollmentId,
      monday,
      items.map((t) => ({
        day: t.day,
        subjectId: t.subjectId,
        resourceIds: t.resourceIds,
        description: t.description!.trim().slice(0, 300),
        targetQuestions: t.targetQuestions,
      })),
    );
    if (!res.ok) return res;
    if (res.data.taskIds.length === 0) return actionError("Kopyalama başarısız.");
    return { ok: true, data: { added: res.data.taskIds.length } };
  });
}

/* -------------------------------------------------------------------------- */
/*  Ders düzeni — haftadan haftaya sabit iskelet                              */
/* -------------------------------------------------------------------------- */

/**
 * Haftalık ders düzenini yazar (7 gün tek seferde upsert).
 *
 * Yalnız KOÇ değiştirir: düzen tüm haftaları etkiler, öğrencinin kendi taslağı
 * üzerinden yapısal karar vermesi istenmez. Dersler kaydın kendi şablonundan
 * doğrulanır — başka sınavın ders id'si sessizce düşer.
 */
export async function savePlanDayLayout(
  input: unknown,
): Promise<ActionResult<{ days: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = savePlanDayLayoutSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { enrollmentId, days } = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, enrollmentId, user);

    const allowed = await allowedSubjectIds(db, enrollmentId);
    const now = new Date();

    for (const d of days) {
      const ids = d.subjectIds.filter((id) => allowed.has(id));
      const color = isDayColorKey(d.color ?? null) ? d.color! : null;
      await db
        .insert(planDayLayouts)
        .values({
          enrollmentId,
          day: d.day,
          subjectIds: serializeSubjectIds(ids),
          color,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [planDayLayouts.enrollmentId, planDayLayouts.day],
          set: {
            subjectIds: sql`excluded.subject_ids`,
            color: sql`excluded.color`,
            updatedAt: now,
          },
        });
    }
    return { ok: true, data: { days: days.length } };
  });
}

/**
 * Ders düzenini başka bir öğrenciden kopyalar. Kaynak farklı sınav şablonundaysa
 * o şablona ait ders id'leri hedefte geçersizdir ve düşer — bu durumda hiç ders
 * kalmazsa kopyalama hata döner (sessizce boş düzen yazmaktansa uyarmak yeğdir).
 */
export async function copyPlanDayLayout(
  input: unknown,
): Promise<ActionResult<{ days: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = copyPlanDayLayoutSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const { enrollmentId, sourceEnrollmentId } = parsed.data;
    const db = getDb();
    // Hem hedefe hem kaynağa erişim şart — koç başkasının kadrosunu okuyamaz.
    await assertEnrollmentAccess(db, enrollmentId, user);
    await assertEnrollmentAccess(db, sourceEnrollmentId, user);

    const source = await getPlanDayLayout(sourceEnrollmentId);
    const allowed = await allowedSubjectIds(db, enrollmentId);
    const days = source.map((d) => ({
      day: d.day,
      subjectIds: d.subjectIds.filter((id) => allowed.has(id)),
      color: d.color,
    }));
    if (days.every((d) => d.subjectIds.length === 0)) {
      return actionError(
        "Kaynak düzendeki dersler bu öğrencinin sınavında yok — kopyalanamadı.",
      );
    }
    return savePlanDayLayout({ enrollmentId, days });
  });
}

/**
 * Kaydın sınav(lar)ındaki geçerli ders id'leri (düzen doğrulaması).
 * Çift sınavlı kayıtta İKİ şablonun dersleri de geçerlidir — yoksa ikinci
 * sınavın dersleri günlük ders düzenine eklenemezdi.
 */
async function allowedSubjectIds(
  db: DB,
  enrollmentId: number,
): Promise<Set<number>> {
  const enrollment = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
    columns: { examTemplateId: true, secondaryExamTemplateId: true },
  });
  if (!enrollment) return new Set();
  const templateIds = [
    enrollment.examTemplateId,
    ...(enrollment.secondaryExamTemplateId != null
      ? [enrollment.secondaryExamTemplateId]
      : []),
  ];
  const rows = await db
    .select({ id: subjects.id })
    .from(subjects)
    .innerJoin(examSections, eq(examSections.id, subjects.examSectionId))
    .where(inArray(examSections.examTemplateId, templateIds));
  return new Set(rows.map((r) => r.id));
}

/**
 * Öğrenci: kendi taslağını koç incelemesine gönderir — koç panosunda "öğrenci
 * önerisi" olarak görünür. Yayınlama yetkisi yine yalnız koçta.
 */
export async function submitPlanForReview(
  input: unknown,
): Promise<ActionResult<{ planId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = submitPlanForReviewSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const db = getDb();

    const plan = await db.query.weeklyPlans.findFirst({
      where: eq(weeklyPlans.id, parsed.data.planId),
    });
    if (!plan) return actionError("Program bulunamadı.");
    await assertPlanWritable(db, plan.enrollmentId, user, plan);
    if (plan.status !== "draft") {
      return actionError("Bu program zaten yayınlanmış.");
    }

    const taskCount = await db
      .select({ n: sql<number>`count(*)` })
      .from(planTasks)
      .where(eq(planTasks.weeklyPlanId, plan.id));
    if (Number(taskCount[0]?.n ?? 0) === 0) {
      return actionError("Önce en az bir konu ekle.");
    }

    await db
      .update(weeklyPlans)
      .set({ studentSubmittedAt: new Date(), updatedAt: new Date() })
      .where(eq(weeklyPlans.id, plan.id));

    return { ok: true, data: { planId: plan.id } };
  });
}

/**
 * Öğrenci + koç: görevi tamam/geri al. Öğrenci yalnız kendi kaydının
 * görevlerini ve yalnız yayınlanmış planlarda işaretleyebilir.
 */
export async function togglePlanTaskDone(
  input: unknown,
): Promise<ActionResult<{ taskId: number; isDone: boolean }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = togglePlanTaskSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const v = parsed.data;
    const db = getDb();

    const [row] = await db
      .select({
        enrollmentId: weeklyPlans.enrollmentId,
        planStatus: weeklyPlans.status,
      })
      .from(planTasks)
      .innerJoin(weeklyPlans, eq(weeklyPlans.id, planTasks.weeklyPlanId))
      .where(eq(planTasks.id, v.taskId));
    if (!row) return actionError("Görev bulunamadı.");

    await assertEnrollmentAccess(db, row.enrollmentId, user);
    if (
      user.role !== "coach" &&
      user.role !== "admin" &&
      row.planStatus === "draft"
    ) {
      return actionError("Program henüz yayınlanmadı.");
    }

    await db
      .update(planTasks)
      .set({ isDone: v.isDone })
      .where(eq(planTasks.id, v.taskId));

    return { ok: true, data: { taskId: v.taskId, isDone: v.isDone } };
  });
}

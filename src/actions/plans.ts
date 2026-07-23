"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb, type DB } from "@/db";
import { enrollments, planTasks, weeklyPlans } from "@/db/schema";
import { addDays, mondayOf, trDayKey } from "@/lib/dates";
import {
  getOrCreateWeeklyPlan,
  getPlanForReuse,
  type PlanStatus,
} from "@/db/queries/plans";
import {
  copyPreviousWeekSchema,
  planTaskCreateSchema,
  planTaskIdSchema,
  planTaskUpdateSchema,
  publishPlanSchema,
  submitPlanForReviewSchema,
  togglePlanTaskSchema,
  upsertWeeklyPlanSchema,
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

    const plan =
      existing ?? (await getOrCreateWeeklyPlan(db, v.enrollmentId, v.weekStart));
    // Öğrenci yeni taslak açtıysa sahiplen — kendi görüp düzenleyebilsin.
    if (isStudentRole(user) && !plan.proposedByStudent) {
      await db
        .update(weeklyPlans)
        .set({ proposedByStudent: true, updatedAt: new Date() })
        .where(eq(weeklyPlans.id, plan.id));
    }

    const day = v.day ?? null;
    const [maxRow] = await db
      .select({ max: sql<number | null>`max(${planTasks.slot})` })
      .from(planTasks)
      .where(
        and(
          eq(planTasks.weeklyPlanId, plan.id),
          day == null ? isNull(planTasks.day) : eq(planTasks.day, day),
        ),
      );
    const slot = Number(maxRow?.max ?? -1) + 1;

    const [task] = await db
      .insert(planTasks)
      .values({
        weeklyPlanId: plan.id,
        day,
        slot,
        subjectId: v.subjectId ?? null,
        resourceId: v.resourceId ?? null,
        description: clean(v.description),
        targetQuestions: v.targetQuestions ?? null,
      })
      .returning({ id: planTasks.id });

    return { ok: true, data: { taskId: task.id, planId: plan.id } };
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

    await db
      .update(planTasks)
      .set({
        day: v.day ?? null,
        subjectId: v.subjectId ?? null,
        resourceId: v.resourceId ?? null,
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

/** Koç: taslağı yayınlar — öğrenci programı ancak bundan sonra görür. */
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

    const existing = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.enrollmentId, enrollmentId),
        eq(weeklyPlans.weekStart, monday),
      ),
    });
    await assertPlanWritable(db, enrollmentId, user, existing ?? null);

    const source = await getPlanForReuse(enrollmentId, addDays(monday, -7));
    const items = source.filter((t) => t.description && t.description.trim());
    if (items.length === 0) {
      return actionError("Geçen hafta için kopyalanacak plan yok.");
    }

    const weekKey = trDayKey(monday);
    let added = 0;
    for (const t of items) {
      const res = await addPlanTask({
        enrollmentId,
        weekStart: weekKey,
        day: t.day,
        subjectId: t.subjectId,
        resourceId: t.resourceId,
        description: t.description,
        targetQuestions: t.targetQuestions,
      });
      if (res.ok) added++;
    }
    if (added === 0) return actionError("Kopyalama başarısız.");
    return { ok: true, data: { added } };
  });
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

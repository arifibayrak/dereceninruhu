"use server";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { enrollments, planTasks, weeklyPlans } from "@/db/schema";
import { mondayOf, trDayKey } from "@/lib/dates";
import { getOrCreateWeeklyPlan } from "@/db/queries/plans";
import {
  planTaskCreateSchema,
  planTaskIdSchema,
  planTaskUpdateSchema,
  publishPlanSchema,
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
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

const clean = (v?: string | null) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

/** Koç: haftalık plan üst bilgisi (motto, not, durum) — hafta bazında upsert. */
export async function upsertWeeklyPlan(
  input: unknown,
): Promise<ActionResult<{ planId: number; weekKey: string }>> {
  return guarded(async () => {
    await requireCoach();
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
    await db
      .insert(weeklyPlans)
      .values({
        enrollmentId: v.enrollmentId,
        weekStart,
        motto: clean(v.motto),
        coachNote: clean(v.coachNote),
        ...(v.status ? { status: v.status } : {}),
      })
      .onConflictDoUpdate({
        target: [weeklyPlans.enrollmentId, weeklyPlans.weekStart],
        set: {
          motto: clean(v.motto),
          coachNote: clean(v.coachNote),
          ...(v.status ? { status: v.status } : {}),
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

/** Koç: güne görev ekler; hafta planı yoksa taslak olarak oluşturulur. */
export async function addPlanTask(
  input: unknown,
): Promise<ActionResult<{ taskId: number; planId: number }>> {
  return guarded(async () => {
    await requireCoach();
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

    const plan = await getOrCreateWeeklyPlan(db, v.enrollmentId, v.weekStart);
    const [maxRow] = await db
      .select({ max: sql<number | null>`max(${planTasks.slot})` })
      .from(planTasks)
      .where(
        and(eq(planTasks.weeklyPlanId, plan.id), eq(planTasks.day, v.day)),
      );
    const slot = Number(maxRow?.max ?? -1) + 1;

    const [task] = await db
      .insert(planTasks)
      .values({
        weeklyPlanId: plan.id,
        day: v.day,
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

/** Koç: görevi düzenler (gün taşıma dahil). */
export async function updatePlanTask(
  input: unknown,
): Promise<ActionResult<{ taskId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = planTaskUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const task = await db.query.planTasks.findFirst({
      where: eq(planTasks.id, v.taskId),
    });
    if (!task) return actionError("Görev bulunamadı.");

    await db
      .update(planTasks)
      .set({
        day: v.day,
        subjectId: v.subjectId ?? null,
        resourceId: v.resourceId ?? null,
        description: clean(v.description),
        targetQuestions: v.targetQuestions ?? null,
      })
      .where(eq(planTasks.id, v.taskId));

    return { ok: true, data: { taskId: v.taskId } };
  });
}

/** Koç: görevi siler. */
export async function deletePlanTask(
  input: unknown,
): Promise<ActionResult<{ taskId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = planTaskIdSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz giriş.");
    const db = getDb();
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

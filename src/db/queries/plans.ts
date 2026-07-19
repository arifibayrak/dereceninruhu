import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, type DB } from "@/db";
import {
  enrollments,
  planTasks,
  resources,
  students,
  weeklyPlans,
} from "@/db/schema";
import { mondayOf } from "@/lib/dates";

/* -------------------------------------------------------------------------- */
/*  Görünüm tipleri                                                           */
/* -------------------------------------------------------------------------- */

export type PlanStatus = "draft" | "published" | "completed";

export type PlanTaskView = {
  id: number;
  /** 1 = Pazartesi … 7 = Pazar. */
  day: number;
  slot: number;
  subjectId: number | null;
  subjectName: string | null;
  resourceId: number | null;
  resourceName: string | null;
  description: string | null;
  targetQuestions: number | null;
  isDone: boolean;
};

export type WeeklyPlanView = {
  id: number;
  enrollmentId: number;
  weekStart: Date;
  motto: string | null;
  coachNote: string | null;
  status: PlanStatus;
  tasks: PlanTaskView[];
};

/** Tamamlanma özeti: yapılan/toplam + yüzde. */
export function planCompletion(tasks: Pick<PlanTaskView, "isDone">[]): {
  done: number;
  total: number;
  pct: number;
} {
  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

/** Görevleri gün numarasına göre gruplar (1..7; boş günler yer almaz). */
export function groupTasksByDay(
  tasks: PlanTaskView[],
): Map<number, PlanTaskView[]> {
  const byDay = new Map<number, PlanTaskView[]>();
  for (const t of tasks) {
    const list = byDay.get(t.day) ?? [];
    list.push(t);
    byDay.set(t.day, list);
  }
  return byDay;
}

/* -------------------------------------------------------------------------- */
/*  Sorgular                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Bir kaydın (haftanın pazartesisine normalize edilen) haftalık planı +
 * görevleri. `publishedOnly` öğrenci görünümü içindir: taslaklar görünmez.
 */
export async function getWeeklyPlan(
  enrollmentId: number,
  anyDayOfWeek: Date,
  opts?: { publishedOnly?: boolean },
): Promise<WeeklyPlanView | null> {
  const db = getDb();
  const weekStart = mondayOf(anyDayOfWeek);
  const plan = await db.query.weeklyPlans.findFirst({
    where: and(
      eq(weeklyPlans.enrollmentId, enrollmentId),
      eq(weeklyPlans.weekStart, weekStart),
      ...(opts?.publishedOnly
        ? [inArray(weeklyPlans.status, ["published", "completed"])]
        : []),
    ),
    with: {
      tasks: {
        orderBy: [asc(planTasks.day), asc(planTasks.slot), asc(planTasks.id)],
        with: { subject: true, resource: true },
      },
    },
  });
  if (!plan) return null;
  return {
    id: plan.id,
    enrollmentId: plan.enrollmentId,
    weekStart: plan.weekStart,
    motto: plan.motto,
    coachNote: plan.coachNote,
    status: plan.status,
    tasks: plan.tasks.map((t) => ({
      id: t.id,
      day: t.day,
      slot: t.slot,
      subjectId: t.subjectId,
      subjectName: t.subject?.name ?? null,
      resourceId: t.resourceId,
      resourceName: t.resource?.name ?? null,
      description: t.description,
      targetQuestions: t.targetQuestions,
      isDone: t.isDone,
    })),
  };
}

/**
 * Plan yoksa taslak olarak oluşturur (görev ekleme / görüşmeden plan üretme).
 * Aksiyon katmanından çağrılır; db dışarıdan verilir.
 */
export async function getOrCreateWeeklyPlan(
  db: DB,
  enrollmentId: number,
  anyDayOfWeek: Date,
) {
  const weekStart = mondayOf(anyDayOfWeek);
  const where = and(
    eq(weeklyPlans.enrollmentId, enrollmentId),
    eq(weeklyPlans.weekStart, weekStart),
  );
  const existing = await db.query.weeklyPlans.findFirst({ where });
  if (existing) return existing;
  const [created] = await db
    .insert(weeklyPlans)
    .values({ enrollmentId, weekStart })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const raced = await db.query.weeklyPlans.findFirst({ where });
  if (!raced) throw new Error("Program oluşturulamadı");
  return raced;
}

export type WeeklyPlanListItem = {
  id: number;
  weekStart: Date;
  status: PlanStatus;
  motto: string | null;
  taskCount: number;
  doneCount: number;
};

/** Kaydın haftalık planları (görev sayılarıyla), yeniden eskiye. */
export async function listWeeklyPlans(
  enrollmentId: number,
  limit = 12,
): Promise<WeeklyPlanListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: weeklyPlans.id,
      weekStart: weeklyPlans.weekStart,
      status: weeklyPlans.status,
      motto: weeklyPlans.motto,
      taskCount: sql<number>`count(${planTasks.id})`,
      doneCount: sql<number>`coalesce(sum(case when ${planTasks.isDone} then 1 else 0 end), 0)`,
    })
    .from(weeklyPlans)
    .leftJoin(planTasks, eq(planTasks.weeklyPlanId, weeklyPlans.id))
    .where(eq(weeklyPlans.enrollmentId, enrollmentId))
    .groupBy(weeklyPlans.id)
    .orderBy(desc(weeklyPlans.weekStart))
    .limit(limit);
  return rows.map((r) => ({
    ...r,
    taskCount: Number(r.taskCount),
    doneCount: Number(r.doneCount),
  }));
}

export type PendingPlan = {
  planId: number;
  studentId: number;
  studentName: string;
  weekStart: Date;
  taskCount: number;
};

/** Yayınlanmayı bekleyen (taslak) programlar — koç panosu kartı. */
export async function getPlansAwaitingPublish(
  limit = 10,
): Promise<PendingPlan[]> {
  const db = getDb();
  const rows = await db
    .select({
      planId: weeklyPlans.id,
      studentId: students.id,
      studentName: students.fullName,
      weekStart: weeklyPlans.weekStart,
      taskCount: sql<number>`count(${planTasks.id})`,
    })
    .from(weeklyPlans)
    .innerJoin(enrollments, eq(enrollments.id, weeklyPlans.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .leftJoin(planTasks, eq(planTasks.weeklyPlanId, weeklyPlans.id))
    .where(and(eq(weeklyPlans.status, "draft"), isNull(students.deletedAt)))
    .groupBy(weeklyPlans.id)
    .orderBy(desc(weeklyPlans.weekStart))
    .limit(limit);
  return rows.map((r) => ({ ...r, taskCount: Number(r.taskCount) }));
}

export type ResourceOption = { id: number; name: string };

/** Kaydın aktif kaynakları — program görevi "kaynak" seçimi. */
export async function getResourcesForEnrollment(
  enrollmentId: number,
): Promise<ResourceOption[]> {
  const db = getDb();
  return db
    .select({ id: resources.id, name: resources.name })
    .from(resources)
    .where(
      and(eq(resources.enrollmentId, enrollmentId), eq(resources.isActive, true)),
    )
    .orderBy(asc(resources.name));
}

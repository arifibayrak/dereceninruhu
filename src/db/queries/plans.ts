import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, type DB } from "@/db";
import {
  enrollments,
  examTemplates,
  planDayLayouts,
  planTasks,
  resources,
  students,
  weeklyPlans,
} from "@/db/schema";
import { mondayOf } from "@/lib/dates";
import {
  fillLayoutDays,
  parseSubjectIds,
  type DayLayoutEntry,
} from "@/lib/plan-layout";
import type { SessionViewer } from "@/lib/session";

/* -------------------------------------------------------------------------- */
/*  Görünüm tipleri                                                           */
/* -------------------------------------------------------------------------- */

export type PlanStatus = "draft" | "published" | "completed";

export type PlanTaskView = {
  id: number;
  /** 1 = Pazartesi … 7 = Pazar. null = haftalık konu (güne atanmamış). */
  day: number | null;
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
  proposedByStudent: boolean;
  studentSubmittedAt: Date | null;
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

/**
 * Görevleri gün numarasına göre gruplar (1..7; boş günler yer almaz).
 * Haftalık konular (day null) dahil edilmez — onlar "hafta" görünümüne aittir.
 */
export function groupTasksByDay(
  tasks: PlanTaskView[],
): Map<number, PlanTaskView[]> {
  const byDay = new Map<number, PlanTaskView[]>();
  for (const t of tasks) {
    if (t.day == null) continue;
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
        // Güne atanmış görevler gün sırasında; haftalık konular (day null) sona.
        orderBy: [
          sql`${planTasks.day} is null`,
          asc(planTasks.day),
          asc(planTasks.slot),
          asc(planTasks.id),
        ],
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
    proposedByStudent: plan.proposedByStudent,
    studentSubmittedAt: plan.studentSubmittedAt,
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
  /** Öğrenci önerisi mi (koça gönderilmiş) — kart rozeti + sıralama. */
  studentSubmittedAt: Date | null;
};

/**
 * Yayınlanmayı bekleyen (taslak) programlar — koç panosu kartı. Öğrenci
 * önerileri (koça gönderilenler) en üstte.
 */
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
      studentSubmittedAt: weeklyPlans.studentSubmittedAt,
    })
    .from(weeklyPlans)
    .innerJoin(enrollments, eq(enrollments.id, weeklyPlans.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .leftJoin(planTasks, eq(planTasks.weeklyPlanId, weeklyPlans.id))
    .where(and(eq(weeklyPlans.status, "draft"), isNull(students.deletedAt)))
    .groupBy(weeklyPlans.id)
    .orderBy(
      // Koça gönderilmiş öğrenci önerileri önce, sonra en yeni hafta.
      sql`${weeklyPlans.studentSubmittedAt} is null`,
      desc(weeklyPlans.weekStart),
    )
    .limit(limit);
  return rows.map((r) => ({ ...r, taskCount: Number(r.taskCount) }));
}

export type ReusableTask = {
  day: number | null;
  subjectId: number | null;
  resourceId: number | null;
  description: string | null;
  targetQuestions: number | null;
};

/**
 * Geçmiş bir haftanın görevlerini "yeniden kullan"/"kopyala" için sadeleştirir
 * (id/isDone yok; yeni haftaya olduğu gibi eklenebilir). Plan yoksa boş dizi.
 */
export async function getPlanForReuse(
  enrollmentId: number,
  anyDayOfWeek: Date,
): Promise<ReusableTask[]> {
  const db = getDb();
  const weekStart = mondayOf(anyDayOfWeek);
  const plan = await db.query.weeklyPlans.findFirst({
    where: and(
      eq(weeklyPlans.enrollmentId, enrollmentId),
      eq(weeklyPlans.weekStart, weekStart),
    ),
    with: {
      tasks: {
        orderBy: [
          sql`${planTasks.day} is null`,
          asc(planTasks.day),
          asc(planTasks.slot),
          asc(planTasks.id),
        ],
      },
    },
  });
  if (!plan) return [];
  return plan.tasks.map((t) => ({
    day: t.day,
    subjectId: t.subjectId,
    resourceId: t.resourceId,
    description: t.description,
    targetQuestions: t.targetQuestions,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Ders düzeni (haftadan haftaya sabit iskelet)                              */
/* -------------------------------------------------------------------------- */

/** Kaydın 7 günlük ders düzeni — kayıtsız günler boş dizi + varsayılan renkle. */
export async function getPlanDayLayout(
  enrollmentId: number,
): Promise<DayLayoutEntry[]> {
  const db = getDb();
  const rows = await db
    .select({
      day: planDayLayouts.day,
      subjectIds: planDayLayouts.subjectIds,
      color: planDayLayouts.color,
    })
    .from(planDayLayouts)
    .where(eq(planDayLayouts.enrollmentId, enrollmentId));

  return fillLayoutDays(
    rows.map((r) => ({
      day: r.day,
      subjectIds: parseSubjectIds(r.subjectIds),
      color: r.color,
    })),
  );
}

export type LayoutSourceOption = {
  enrollmentId: number;
  studentName: string;
  examCode: string;
  dayCount: number;
};

/**
 * "Başka öğrenciden kopyala" seçenekleri — düzeni DOLU olan diğer kayıtlar.
 * Koç yalnız kendi kadrosunu görür; yönetici tümünü (kadro görünürlük kuralı).
 * Aynı sınav şablonundakiler önce gelir: ders id'leri ancak aynı şablonda
 * anlamlıdır, farklı şablondan kopyalanan dersler düşer.
 */
export async function listLayoutSources(opts: {
  viewer: SessionViewer;
  excludeEnrollmentId: number;
  examTemplateId: number;
}): Promise<LayoutSourceOption[]> {
  const db = getDb();
  const rows = await db
    .select({
      enrollmentId: planDayLayouts.enrollmentId,
      subjectIds: planDayLayouts.subjectIds,
      studentName: students.fullName,
      examCode: examTemplates.code,
      examTemplateId: enrollments.examTemplateId,
    })
    .from(planDayLayouts)
    .innerJoin(enrollments, eq(enrollments.id, planDayLayouts.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(examTemplates, eq(examTemplates.id, enrollments.examTemplateId))
    .where(
      and(
        isNull(students.deletedAt),
        eq(enrollments.status, "active"),
        opts.viewer.role === "coach"
          ? eq(enrollments.coachUserId, opts.viewer.id)
          : undefined,
      ),
    );

  const byEnrollment = new Map<number, LayoutSourceOption>();
  const sameExam = new Set<number>();
  for (const r of rows) {
    if (r.enrollmentId === opts.excludeEnrollmentId) continue;
    if (parseSubjectIds(r.subjectIds).length === 0) continue;
    const existing = byEnrollment.get(r.enrollmentId);
    if (existing) {
      existing.dayCount += 1;
      continue;
    }
    if (r.examTemplateId === opts.examTemplateId) sameExam.add(r.enrollmentId);
    byEnrollment.set(r.enrollmentId, {
      enrollmentId: r.enrollmentId,
      studentName: r.studentName,
      examCode: r.examCode,
      dayCount: 1,
    });
  }

  return [...byEnrollment.values()].sort(
    (a, b) =>
      Number(sameExam.has(b.enrollmentId)) -
        Number(sameExam.has(a.enrollmentId)) ||
      a.studentName.localeCompare(b.studentName, "tr"),
  );
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

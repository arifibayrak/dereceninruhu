import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import {
  getPlanDayLayout,
  getResourcesForEnrollment,
  getWeeklyPlan,
  listLayoutSources,
  listWeeklyPlans,
} from "@/db/queries/plans";
import {
  addDays,
  DAY_NAMES_TR,
  formatWeekLabel,
  mondayOf,
  trDayKey,
  trWeekday,
  weekDays,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  ProgramBuilder,
  type BuilderSubject,
  type BuilderTask,
} from "@/components/app/program-builder";
import { PlanAiDraft } from "@/components/app/plan-ai-draft";
import { Button } from "@/components/ui/button";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Program" };

const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hafta?: string }>;
}) {
  const { id } = await params;
  const { hafta } = await searchParams;
  const studentId = Number(id);
  const { enrollment, viewer } = await resolveCockpit(studentId);

  const now = new Date();
  const anchor =
    hafta && /^\d{4}-\d{2}-\d{2}$/.test(hafta) ? new Date(hafta) : now;
  const planMonday = mondayOf(Number.isNaN(anchor.getTime()) ? now : anchor);
  const currentMonday = mondayOf(now);
  const isPlanCurrentWeek = planMonday.getTime() === currentMonday.getTime();

  const sections = await getSectionsForEnrollment(enrollment);
  const [plan, planWeeks, resources, layout, layoutSources] = await Promise.all([
    getWeeklyPlan(enrollment.id, planMonday),
    listWeeklyPlans(enrollment.id, 8),
    getResourcesForEnrollment(enrollment.id),
    getPlanDayLayout(enrollment.id),
    viewer
      ? listLayoutSources({
          viewer,
          excludeEnrollmentId: enrollment.id,
          examTemplateId: enrollment.examTemplateId,
        })
      : [],
  ]);

  const builderSubjects: BuilderSubject[] = sections.flatMap((s) =>
    s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      sectionName: s.name,
      examCode: s.examCode,
      examName: s.examName,
    })),
  );
  const builderTasks: BuilderTask[] = (plan?.tasks ?? []).map((t) => ({
    id: t.id,
    day: t.day,
    subjectId: t.subjectId,
    subjectName: t.subjectName,
    resourceIds: t.resourceIds,
    resourceNames: t.resourceNames,
    description: t.description,
    targetQuestions: t.targetQuestions,
    isDone: t.isDone,
  }));
  const builderDays = weekDays(planMonday).map((d, i) => ({
    day: i + 1,
    name: DAY_NAMES_TR[i],
    dateLabel: dayMonthFmt.format(d),
  }));
  const planWeekKey = trDayKey(planMonday);
  const prevWeekKey = trDayKey(addDays(planMonday, -7));
  const nextWeekKey = trDayKey(addDays(planMonday, 7));
  const programHref = (weekKey: string) =>
    `/koc/ogrenciler/${studentId}/program?hafta=${weekKey}`;

  return (
    <>
      <CockpitShell studentId={studentId} active="program" />
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Önceki hafta"
            render={<Link href={programHref(prevWeekKey)} />}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="flex flex-col items-center leading-tight">
            <span className="font-heading text-sm font-semibold">
              {formatWeekLabel(planMonday)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isPlanCurrentWeek
                ? "Bu hafta"
                : planMonday.getTime() < currentMonday.getTime()
                  ? "Geçmiş hafta"
                  : "Gelecek hafta"}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Sonraki hafta"
            render={<Link href={programHref(nextWeekKey)} />}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <div className="flex justify-end">
          <PlanAiDraft
            studentId={studentId}
            enrollmentId={enrollment.id}
            weekKey={planWeekKey}
            subjects={builderSubjects.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>

        {planWeeks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Planlı haftalar:
            </span>
            {planWeeks.map((p) => {
              const weekKey = trDayKey(p.weekStart);
              const isActive = weekKey === planWeekKey;
              return (
                <Link
                  key={p.id}
                  href={programHref(weekKey)}
                  className={cn(
                    "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium ring-1 ring-foreground/10 transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full",
                      p.status === "draft" ? "bg-warning" : "bg-success",
                    )}
                  />
                  {formatWeekLabel(p.weekStart)}
                </Link>
              );
            })}
          </div>
        )}

        <ProgramBuilder
          enrollmentId={enrollment.id}
          weekKey={planWeekKey}
          plan={
            plan
              ? {
                  id: plan.id,
                  status: plan.status,
                  motto: plan.motto,
                  coachNote: plan.coachNote,
                  proposedByStudent: plan.proposedByStudent,
                  studentSubmittedAt: plan.studentSubmittedAt,
                }
              : null
          }
          tasks={builderTasks}
          subjects={builderSubjects}
          resources={resources}
          days={builderDays}
          todayDay={isPlanCurrentWeek ? trWeekday(now) : null}
          layout={layout}
          layoutSources={layoutSources}
        />
      </div>
    </>
  );
}

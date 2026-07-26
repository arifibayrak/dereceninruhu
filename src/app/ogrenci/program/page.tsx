import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import {
  getPlanDayLayout,
  getResourcesForEnrollment,
  getWeeklyPlan,
  groupTasksByDay,
} from "@/db/queries/plans";
import { getCurrentUser, type Role } from "@/lib/session";
import {
  addDays,
  DAY_NAMES_TR,
  formatWeekLabel,
  mondayOf,
  trDayKey,
  trWeekday,
  weekDays,
} from "@/lib/dates";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { type ChecklistDay } from "@/components/app/plan-checklist";
import { StudentProgram } from "@/components/app/student-program";
import { type GridTask } from "@/components/app/program-grid";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Haftalık Program" };

const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

export default async function OgrenciProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ hafta?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const { enrollment } = detail;

  const { hafta } = await searchParams;
  const now = new Date();
  const anchor =
    hafta && /^\d{4}-\d{2}-\d{2}$/.test(hafta) ? new Date(hafta) : now;
  const monday = mondayOf(Number.isNaN(anchor.getTime()) ? now : anchor);
  const currentMonday = mondayOf(now);
  const isCurrentWeek = monday.getTime() === currentMonday.getTime();
  const canAuthor = monday.getTime() >= currentMonday.getTime();

  // Taslaklar dahil çek; yalnız öğrencinin KENDİ taslağı ya da yayınlanmış plan
  // görünür (koçun yayınlanmamış taslağı öğrenciye gösterilmez).
  const raw = await getWeeklyPlan(enrollment.id, monday);
  const isPublished =
    raw?.status === "published" || raw?.status === "completed";
  const isOwnDraft = raw?.status === "draft" && raw.proposedByStudent;
  const visible = isPublished || isOwnDraft ? raw : null;
  const status = isPublished ? "published" : isOwnDraft ? "draft-own" : "none";

  const [sections, resources, layout] = await Promise.all([
    getSectionsForEnrollment(enrollment.examTemplateId, enrollment.trackCode),
    getResourcesForEnrollment(enrollment.id),
    getPlanDayLayout(enrollment.id),
  ]);
  // Gün rengi yalnız koç o güne ders atadıysa gösterilir — boş günde renk yok.
  const colorByDay = new Map(
    layout
      .filter((d) => d.subjectIds.length > 0)
      .map((d) => [d.day, d.color] as const),
  );
  const subjects = sections.flatMap((s) =>
    s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      sectionName: s.name,
    })),
  );
  const gridDays = weekDays(monday).map((_, i) => ({
    day: i + 1,
    name: DAY_NAMES_TR[i],
  }));
  const gridTasks: GridTask[] = (visible?.tasks ?? []).map((t) => ({
    id: t.id,
    day: t.day,
    subjectId: t.subjectId,
    subjectName: t.subjectName,
    resourceId: t.resourceId,
    resourceName: t.resourceName,
    description: t.description,
    targetQuestions: t.targetQuestions,
    isDone: t.isDone,
  }));

  const byDay = groupTasksByDay(visible?.tasks ?? []);
  const checklistDays: ChecklistDay[] = weekDays(monday).map((d, i) => ({
    day: i + 1,
    name: DAY_NAMES_TR[i],
    dateLabel: dayMonthFmt.format(d),
    color: colorByDay.get(i + 1),
    tasks: (byDay.get(i + 1) ?? []).map((t) => ({
      id: t.id,
      description: t.description,
      subjectName: t.subjectName,
      resourceName: t.resourceName,
      targetQuestions: t.targetQuestions,
      isDone: t.isDone,
    })),
  }));

  const prevKey = trDayKey(addDays(monday, -7));
  const nextKey = trDayKey(addDays(monday, 7));

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-title">Haftalık program</h1>
        <p className="text-sm text-muted-foreground">
          Koçunun planı ve senin konu planın — yaptıkça işaretle.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Önceki hafta"
          render={<Link href={`/ogrenci/program?hafta=${prevKey}`} />}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="flex flex-col items-center leading-tight">
          <span className="font-heading text-sm font-semibold">
            {formatWeekLabel(monday)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {isCurrentWeek
              ? "Bu hafta"
              : monday.getTime() < currentMonday.getTime()
                ? "Geçmiş hafta"
                : "Gelecek hafta"}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="Sonraki hafta"
          render={<Link href={`/ogrenci/program?hafta=${nextKey}`} />}
        >
          <ChevronRightIcon />
        </Button>
      </div>

      <StudentProgram
        data-tour="program-alan"
        enrollmentId={enrollment.id}
        weekKey={trDayKey(monday)}
        status={status}
        canAuthor={canAuthor}
        planId={visible?.id ?? null}
        studentSubmitted={visible?.studentSubmittedAt != null}
        motto={visible?.motto ?? null}
        coachNote={visible?.coachNote ?? null}
        subjects={subjects}
        resources={resources}
        gridDays={gridDays}
        gridTasks={gridTasks}
        checklistDays={checklistDays}
        todayDay={isCurrentWeek ? trWeekday(now) : null}
      />
    </>
  );
}

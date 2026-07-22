import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClockIcon, SparklesIcon, VideoIcon } from "lucide-react";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import { getWeeklyPlan } from "@/db/queries/plans";
import { getNextSessionForEnrollment } from "@/db/queries/sessions";
import { getStudentInsightInput, getWeekGrid } from "@/db/queries/tracking";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatTrDate, trDayKey, trWeekday } from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import {
  buildStudentInsights,
  computeStreak,
  netTrend,
} from "@/lib/insights";
import { InsightList } from "@/components/app/insight-list";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import {
  TodayPlanTasks,
  type ChecklistTask,
} from "@/components/app/plan-checklist";
import {
  TodayQuickAdd,
  type QuickAddCell,
  type QuickAddSubject,
} from "@/components/app/today-quick-add";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Bugün" };

const sessionFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function OgrenciBugunPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const { student, enrollment } = detail;

  const now = new Date();
  const todayKey = trDayKey(now);
  const [sections, grid, insightInput, weekPlan, nextSession] =
    await Promise.all([
      getSectionsForEnrollment(enrollment.examTemplateId, enrollment.trackCode),
      getWeekGrid(enrollment.id, now),
      getStudentInsightInput(enrollment.id, now),
      getWeeklyPlan(enrollment.id, now, { publishedOnly: true }),
      getNextSessionForEnrollment(enrollment.id, now),
    ]);

  const todayDay = trWeekday(now);
  const todayTasks: ChecklistTask[] = (weekPlan?.tasks ?? [])
    .filter((t) => t.day === todayDay)
    .map((t) => ({
      id: t.id,
      description: t.description,
      subjectName: t.subjectName,
      resourceName: t.resourceName,
      targetQuestions: t.targetQuestions,
      isDone: t.isDone,
    }));

  const insights = buildStudentInsights(insightInput);
  const streak = computeStreak(insightInput.activeDayKeys, now);
  const trend = netTrend(insightInput.netSeries);

  const subjects: QuickAddSubject[] = sections.flatMap((s) =>
    s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      parentSubjectId: sub.parentSubjectId,
      sectionName: s.name,
      // Net önizlemesi için bölüm böleni (LGS 3, YKS/KPSS 4).
      wrongPenaltyDivisor: s.wrongPenaltyDivisor,
    })),
  );
  const todayInitial: Record<number, QuickAddCell> = {};
  for (const [key, cell] of Object.entries(grid)) {
    const [dayKey, subjectId] = key.split(":");
    if (dayKey === todayKey) todayInitial[Number(subjectId)] = cell;
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {formatTrDate(now)}
        </span>
        <h1 className="font-heading text-title">
          Merhaba {student.fullName.split(" ")[0]} 👋
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {enrollment.examCode}
            {enrollment.trackName ? ` · ${enrollment.trackName}` : ""}
          </Badge>
          {enrollment.targetText && (
            <span className="text-sm text-muted-foreground">
              🎯 {enrollment.targetText}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Seri" value={`${formatInt(streak)}`} hint="gün" />
        <StatTile
          label="Bu hafta"
          value={formatInt(insightInput.weekQuestionTotal)}
          hint="soru"
        />
        <StatTile
          label="Son net"
          value={trend.latest !== null ? formatNet(trend.latest) : "—"}
          hint="tam deneme"
        />
      </div>

      <InsightList insights={insights} limit={2} />

      {todayTasks.length > 0 && <TodayPlanTasks tasks={todayTasks} />}

      <div className="flex items-center gap-3 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info/10">
          <CalendarClockIcon className="size-4 text-info" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium">
            {nextSession
              ? `Sonraki görüşme · ${sessionFmt.format(nextSession.scheduledAt)}`
              : "Sonraki görüşme"}
          </span>
          <span className="text-xs text-muted-foreground">
            {nextSession
              ? nextSession.studentVisibleNote ??
                "Koçunla planlı görüşmen var — hazırlıklı gel."
              : "Planlanmış görüşme yok — koçun seninle iletişime geçecek."}
          </span>
        </div>
        {nextSession?.meetingUrl && (
          <a
            href={nextSession.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <VideoIcon className="size-4" />
            Katıl
          </a>
        )}
      </div>

      <Link
        href="/ogrenci/asistan"
        className="flex items-center gap-3 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10 hover:ring-foreground/20"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <SparklesIcon className="size-4 text-primary" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium">Asistana sor</span>
          <span className="text-xs text-muted-foreground">
            Gelişimin hakkında merak ettiğini sor.
          </span>
        </div>
      </Link>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-semibold">
          Bugün kaç soru çözdün?
        </h2>
        <TodayQuickAdd
          enrollmentId={enrollment.id}
          dayKey={todayKey}
          subjects={subjects}
          initial={todayInitial}
        />
      </div>
    </>
  );
}

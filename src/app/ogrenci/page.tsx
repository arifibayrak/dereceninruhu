import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarClockIcon } from "lucide-react";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import { getStudentInsightInput, getWeekGrid } from "@/db/queries/tracking";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatTrDate, trDayKey } from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import {
  buildStudentInsights,
  computeStreak,
  netTrend,
} from "@/lib/insights";
import { InsightList } from "@/components/app/insight-list";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import {
  TodayQuickAdd,
  type QuickAddSubject,
} from "@/components/app/today-quick-add";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Bugün" };

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
  const [sections, grid, insightInput] = await Promise.all([
    getSectionsForEnrollment(enrollment.examTemplateId, enrollment.trackCode),
    getWeekGrid(enrollment.id, now),
    getStudentInsightInput(enrollment.id, now),
  ]);

  const insights = buildStudentInsights(insightInput);
  const streak = computeStreak(insightInput.activeDayKeys, now);
  const trend = netTrend(insightInput.netSeries);

  const subjects: QuickAddSubject[] = sections.flatMap((s) =>
    s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      parentSubjectId: sub.parentSubjectId,
      sectionName: s.name,
    })),
  );
  const todayInitial: Record<number, number> = {};
  for (const [key, count] of Object.entries(grid)) {
    const [dayKey, subjectId] = key.split(":");
    if (dayKey === todayKey) todayInitial[Number(subjectId)] = count;
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

      <div className="flex items-center gap-3 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-info/10">
          <CalendarClockIcon className="size-4 text-info" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Sonraki görüşme</span>
          <span className="text-xs text-muted-foreground">
            Görüşme planlama yakında — koçun seninle iletişime geçecek.
          </span>
        </div>
      </div>

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

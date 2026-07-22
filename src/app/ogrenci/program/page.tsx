import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  QuoteIcon,
} from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { getWeeklyPlan, groupTasksByDay } from "@/db/queries/plans";
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
import { CoachNote } from "@/components/app/coach-note";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import {
  ProgramChecklist,
  type ChecklistDay,
} from "@/components/app/plan-checklist";
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

  const plan = await getWeeklyPlan(enrollment.id, monday, {
    publishedOnly: true,
  });

  const prevKey = trDayKey(addDays(monday, -7));
  const nextKey = trDayKey(addDays(monday, 7));

  const byDay = groupTasksByDay(plan?.tasks ?? []);
  const days: ChecklistDay[] = weekDays(monday).map((d, i) => ({
    day: i + 1,
    name: DAY_NAMES_TR[i],
    dateLabel: dayMonthFmt.format(d),
    tasks: (byDay.get(i + 1) ?? []).map((t) => ({
      id: t.id,
      description: t.description,
      subjectName: t.subjectName,
      resourceName: t.resourceName,
      targetQuestions: t.targetQuestions,
      isDone: t.isDone,
    })),
  }));

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-title">Haftalık program</h1>
        <p className="text-sm text-muted-foreground">
          Koçunun senin için hazırladığı plan — yaptıkça işaretle.
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

      {!plan ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
            <CalendarDaysIcon className="size-5 text-primary" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-heading text-lg font-semibold">
              Program henüz hazır değil
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Koçun bu haftanın programını henüz paylaşmadı. Hazır olduğunda
              burada görünecek.
            </p>
          </div>
        </div>
      ) : (
        <>
          {plan.motto && (
            <div className="flex flex-col gap-1.5 rounded-2xl bg-primary p-5 text-primary-foreground">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase opacity-85">
                <QuoteIcon className="size-3.5" aria-hidden />
                Haftanın mottosu
              </span>
              <p className="font-heading text-lg font-semibold text-balance">
                {plan.motto}
              </p>
            </div>
          )}
          {/*
            Görevler önce, koç notu sonra: öğrenci sayfayı açınca "ne
            yapacağım"ı görsün. Not serbest metin olduğu için ikincil bağlam —
            eskiden en üstteydi ve checklist'i ekranın dışına itiyordu.
          */}
          <ProgramChecklist
            days={days}
            todayDay={isCurrentWeek ? trWeekday(now) : null}
          />
          {plan.coachNote && <CoachNote note={plan.coachNote} />}
        </>
      )}
    </>
  );
}

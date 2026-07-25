import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import { getWeekGrid } from "@/db/queries/tracking";
import { getCurrentUser, type Role } from "@/lib/session";
import {
  addDays,
  formatWeekLabel,
  mondayOf,
  trDayKey,
  weekDays,
} from "@/lib/dates";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import {
  WeekGridForm,
  type GridSection,
} from "@/components/app/week-grid-form";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Soru Takibi" };

export default async function SoruTakibiPage({
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

  const [sections, grid] = await Promise.all([
    getSectionsForEnrollment(enrollment.examTemplateId, enrollment.trackCode),
    getWeekGrid(enrollment.id, monday),
  ]);

  const gridSections: GridSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    // Net önizlemesi için bölüm böleni (LGS 3, YKS/KPSS 4).
    wrongPenaltyDivisor: s.wrongPenaltyDivisor,
    subjects: s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      parentSubjectId: sub.parentSubjectId,
    })),
  }));
  const dayKeys = weekDays(monday).map(trDayKey);
  const prevKey = trDayKey(addDays(monday, -7));
  const nextKey = trDayKey(addDays(monday, 7));

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-title">Soru takibi</h1>
        <p className="text-sm text-muted-foreground">
          Günlük çözdüğün soruları ders ders işle — doğru/yanlış/boş girersen
          netin de hesaplanır. Koçun da aynı tabloyu görüyor.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Önceki hafta"
          render={<Link href={`/ogrenci/soru-takibi?hafta=${prevKey}`} />}
        >
          <ChevronLeftIcon />
        </Button>
        <div className="flex flex-col items-center leading-tight">
          <span className="font-heading text-sm font-semibold">
            {formatWeekLabel(monday)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {isCurrentWeek ? "Bu hafta" : "Geçmiş hafta"}
          </span>
        </div>
        {isCurrentWeek ? (
          <Button
            variant="outline"
            size="icon"
            aria-label="Sonraki hafta"
            disabled
          >
            <ChevronRightIcon />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            aria-label="Sonraki hafta"
            render={<Link href={`/ogrenci/soru-takibi?hafta=${nextKey}`} />}
          >
            <ChevronRightIcon />
          </Button>
        )}
      </div>

      <WeekGridForm
        data-tour="sorular-izgara"
        enrollmentId={enrollment.id}
        dayKeys={dayKeys}
        todayKey={isCurrentWeek ? trDayKey(now) : null}
        sections={gridSections}
        initial={grid}
      />
    </>
  );
}

import type { Metadata } from "next";

import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import { getSubjectBreakdown, getWeekGrid } from "@/db/queries/tracking";
import { formatWeekLabel, trDayKey, weekDays } from "@/lib/dates";
import { SubjectBreakdownTable } from "@/components/app/subject-breakdown-table";
import { WeekGridForm, type GridSection } from "@/components/app/week-grid-form";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Soru Takibi" };

export default async function SoruTakibiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { enrollment } = await resolveCockpit(studentId);
  const now = new Date();

  const sections = await getSectionsForEnrollment(
    enrollment.examTemplateId,
    enrollment.trackCode,
  );
  const [grid, breakdown] = await Promise.all([
    getWeekGrid(enrollment.id, now),
    getSubjectBreakdown(enrollment.id, 8, now),
  ]);

  const gridSections: GridSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    wrongPenaltyDivisor: s.wrongPenaltyDivisor,
    subjects: s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      parentSubjectId: sub.parentSubjectId,
    })),
  }));
  const dayKeys = weekDays(now).map(trDayKey);

  return (
    <>
      <CockpitShell studentId={studentId} active="soru-takibi" />
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-base font-semibold">
            Bu hafta · {formatWeekLabel(now)}
          </h2>
          <span className="text-xs text-muted-foreground">
            Koç olarak düzenleyebilirsin
          </span>
        </div>
        <WeekGridForm
          enrollmentId={enrollment.id}
          dayKeys={dayKeys}
          todayKey={trDayKey(now)}
          sections={gridSections}
          initial={grid}
        />

        <div className="flex flex-col gap-2 pt-4">
          <h2 className="font-heading text-base font-semibold">
            Ders ders soru ve doğruluk
          </h2>
          <p className="text-xs text-muted-foreground">
            Son 8 hafta — öğrencinin Gelişim sayfasında gördüğü tablonun aynısı.
          </p>
          <SubjectBreakdownTable data={breakdown} />
        </div>
      </div>
    </>
  );
}

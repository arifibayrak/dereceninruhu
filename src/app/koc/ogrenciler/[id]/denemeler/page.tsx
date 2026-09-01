import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardListIcon } from "lucide-react";

import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import { getMockList, type MockRow } from "@/db/queries/tracking";
import { formatDelta, formatInt, formatNet } from "@/lib/format";
import { groupMocks, type MockGroup } from "@/lib/mock-groups";
import { buildPaceViews, type PaceView } from "@/lib/pace";
import { formatMinutes } from "@/lib/study";
import { cn } from "@/lib/utils";
import { AnalysisToggle } from "@/components/app/analysis-toggle";
import { MockActions } from "@/components/app/mock-actions";
import { MockCreateDialog } from "@/components/app/mock-create-dialog";
import type { MockSection } from "@/components/app/mock-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AnalizPanel } from "../analiz-panel";
import { CockpitShell, resolveCockpit } from "../_cockpit";

export const metadata: Metadata = { title: "Denemeler" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function DenemelerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { enrollment } = await resolveCockpit(studentId);

  const sections = await getSectionsForEnrollment(enrollment);
  const mocks = await getMockList(enrollment.id);
  // Tempo, aynı dersin bir önceki denemesiyle kıyaslanır (bkz. @/lib/pace).
  const paces = buildPaceViews(mocks);
  /*
   * Genel ve branş denemeleri alt alta tek listede değil, ayrı ayrı: her branş
   * dersi ve her genel deneme bölümü kendi bloğunda, kendi ortalaması ve son
   * denemeye göre farkıyla (bkz. @/lib/mock-groups).
   */
  const groups = groupMocks(mocks);

  const mockSections: MockSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    wrongPenaltyDivisor: s.wrongPenaltyDivisor,
    examTemplateId: s.examTemplateId,
    examCode: s.examCode,
    examName: s.examName,
    subjects: s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      isScored: sub.isScored,
      parentSubjectId: sub.parentSubjectId,
      officialQuestionCount: sub.officialQuestionCount,
    })),
  }));

  return (
    <>
      <CockpitShell studentId={studentId} active="denemeler" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold">
            Denemeler · {formatInt(mocks.length)}
          </h2>
          <MockCreateDialog
            enrollmentId={enrollment.id}
            sections={mockSections}
          />
        </div>
        {mocks.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            Henüz deneme girilmedi. İlk denemeyi ekleyerek başla.
          </div>
        ) : (
          groups.map((group) => (
            <MockGroupCard
              key={group.key}
              group={group}
              paces={paces}
              studentId={studentId}
            />
          ))
        )}
        <AnalizPanel enrollmentId={enrollment.id} />
      </div>
    </>
  );
}

/** Tek bir grubun kartı: başlık + özet + o gruba ait denemeler. */
function MockGroupCard({
  group,
  paces,
  studentId,
}: {
  group: MockGroup<MockRow>;
  paces: Map<number, PaceView>;
  studentId: number;
}) {
  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/10">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-foreground/10 px-4 py-3">
        <Badge variant={group.kind === "full" ? "secondary" : "outline"}>
          {group.kind === "full" ? "Genel" : "Branş"}
        </Badge>
        <h3 className="font-heading text-sm font-semibold">{group.title}</h3>
        {group.subtitle && (
          <span className="text-xs text-muted-foreground">
            {group.subtitle}
          </span>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs tabular-nums text-muted-foreground">
          <span>{formatInt(group.count)} deneme</span>
          <span>ort. {formatNet(group.avgNet)}</span>
          <span>en iyi {formatNet(group.bestNet)}</span>
          <span className="flex items-center gap-1">
            son
            <span className="font-semibold text-foreground">
              {formatNet(group.lastNet)}
            </span>
            {group.deltaNet !== null && group.deltaNet !== 0 && (
              <span
                className={cn(
                  "font-medium",
                  group.deltaNet > 0 ? "text-success" : "text-warning",
                )}
                title="Bu grubun bir önceki denemesine göre"
              >
                {formatDelta(group.deltaNet)}
              </span>
            )}
          </span>
        </div>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Tarih</TableHead>
            <TableHead>Deneme</TableHead>
            <TableHead>Süre / tempo</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="pr-4 text-right">Analiz</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.mocks.map((m) => {
            const pace = paces.get(m.id);
            return (
              <TableRow key={m.id}>
                <TableCell className="pl-4 text-muted-foreground">
                  {dateFmt.format(m.takenOn)}
                </TableCell>
                <TableCell className="font-medium">
                  {m.name?.trim() || m.publisher?.trim() || group.title}
                </TableCell>
                <TableCell className="tabular-nums">
                  {pace ? (
                    <span className="flex flex-col leading-tight">
                      <span>{formatMinutes(m.durationMinutes ?? 0)}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {pace.label}
                        {pace.deltaLabel && (
                          <span
                            className={cn(
                              "font-medium",
                              pace.faster === true && "text-success",
                              pace.faster === false && "text-warning",
                            )}
                            title="Aynı dersin bir önceki denemesine göre"
                          >
                            {pace.deltaLabel}
                          </span>
                        )}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatNet(m.totalNet)}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <span className="inline-flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      render={
                        <Link
                          href={`/koc/ogrenciler/${studentId}/deneme/${m.id}/analiz`}
                        />
                      }
                    >
                      <ClipboardListIcon data-icon="inline-start" />
                      Analiz
                    </Button>
                    <AnalysisToggle mockExamId={m.id} done={m.analysisDone} />
                    <MockActions
                      mockExamId={m.id}
                      label={
                        m.name?.trim() || m.publisher?.trim() || group.title
                      }
                    />
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

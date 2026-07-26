import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardListIcon } from "lucide-react";

import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import { getMockList } from "@/db/queries/tracking";
import { combinedMockLabel } from "@/lib/exam";
import { formatInt, formatNet } from "@/lib/format";
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

  const sections = await getSectionsForEnrollment(
    enrollment.examTemplateId,
    enrollment.trackCode,
  );
  const mocks = await getMockList(enrollment.id);

  const mockSections: MockSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    wrongPenaltyDivisor: s.wrongPenaltyDivisor,
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
            combinedLabel={combinedMockLabel(enrollment.examCode)}
          />
        </div>
        {mocks.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            Henüz deneme girilmedi. İlk denemeyi ekleyerek başla.
          </div>
        ) : (
          <div className="rounded-xl bg-card ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Tarih</TableHead>
                  <TableHead>Deneme</TableHead>
                  <TableHead>Bölüm</TableHead>
                  <TableHead>Kapsam</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="pr-4 text-right">Analiz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mocks.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4 text-muted-foreground">
                      {dateFmt.format(m.takenOn)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {m.name?.trim() || m.publisher?.trim() || m.sectionCode}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.sectionName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.scope === "full" ? "secondary" : "outline"}>
                        {m.scope === "full" ? "Tam" : "Branş"}
                      </Badge>
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
                            m.name?.trim() ||
                            m.publisher?.trim() ||
                            m.sectionName
                          }
                        />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <AnalizPanel enrollmentId={enrollment.id} />
      </div>
    </>
  );
}

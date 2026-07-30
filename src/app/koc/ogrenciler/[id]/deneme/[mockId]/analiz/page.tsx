import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import {
  getMockDetail,
  getMockTopicErrors,
  getTopicGroupsForExam,
} from "@/db/queries/analiz";
import { getEnrollmentDetailByStudentId } from "@/db/queries/enrollment";
import { formatPace, secondsPerQuestion } from "@/lib/pace";
import { formatMinutes } from "@/lib/study";
import { SectionHeading } from "@/components/brand/section-heading";
import { TopicErrorForm } from "@/components/app/topic-error-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Deneme Analizi" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function DenemeAnalizPage({
  params,
}: {
  params: Promise<{ id: string; mockId: string }>;
}) {
  const { id, mockId } = await params;
  const studentId = Number(id);
  const mockExamId = Number(mockId);
  if (
    !Number.isInteger(studentId) ||
    studentId <= 0 ||
    !Number.isInteger(mockExamId) ||
    mockExamId <= 0
  ) {
    notFound();
  }

  const detail = await getEnrollmentDetailByStudentId(studentId);
  if (!detail) notFound();
  const mock = await getMockDetail(mockExamId);
  // Deneme bu öğrencinin aktif kaydına ait olmalı.
  if (!mock || mock.enrollmentId !== detail.enrollment.id) notFound();

  const [groups, initial] = await Promise.all([
    getTopicGroupsForExam(detail.enrollment),
    getMockTopicErrors(mockExamId),
  ]);

  const backHref = `/koc/ogrenciler/${studentId}/denemeler`;
  const pace = secondsPerQuestion(mock.durationMinutes, mock.questionCount);
  const paceLabel = pace
    ? ` · ${formatMinutes(mock.durationMinutes ?? 0)} · ${formatPace(pace)}`
    : "";

  return (
    <>
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href={backHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {detail.student.fullName}
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionHeading
            eyebrow="Deneme analizi"
            title={mock.label}
            description={`${mock.sectionName} · ${dateFmt.format(mock.takenOn)}${paceLabel} — hangi konudan kaç soru kaçtı? (yanlış + boş)`}
          />
          {mock.analysisDone ? (
            <Badge className="bg-success/10 text-success">Analiz yapıldı</Badge>
          ) : (
            <Badge className="bg-warning/10 text-warning">Analiz bekliyor</Badge>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Bu sınav için konu listesi bulunamadı. Önce konu seed&apos;ini çalıştırın
          (<code className="font-mono text-xs">pnpm db:seed:topics</code>).
        </div>
      ) : (
        <TopicErrorForm
          mockExamId={mockExamId}
          groups={groups}
          initial={initial}
          onSavedHref={backHref}
        />
      )}
    </>
  );
}

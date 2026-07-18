import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import {
  getMockDetail,
  getMockTopicErrors,
  getTopicGroupsForExam,
} from "@/db/queries/analiz";
import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { getCurrentUser } from "@/lib/session";
import { TopicErrorForm } from "@/components/app/topic-error-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Deneme Analizi" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
});

/** Öğrenci kendi denemesinin konu-eksik analizini girer. */
export default async function OgrenciDenemeAnalizPage({
  params,
}: {
  params: Promise<{ mockId: string }>;
}) {
  const { mockId } = await params;
  const mockExamId = Number(mockId);
  if (!Number.isInteger(mockExamId) || mockExamId <= 0) notFound();

  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) notFound();

  const mock = await getMockDetail(mockExamId);
  // Yalnız kendi kaydının denemesi (sunucu tarafı yetki; action da ayrıca doğrular).
  if (!mock || mock.enrollmentId !== detail.enrollment.id) notFound();

  const [groups, initial] = await Promise.all([
    getTopicGroupsForExam(
      detail.enrollment.examTemplateId,
      detail.enrollment.trackCode,
    ),
    getMockTopicErrors(mockExamId),
  ]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/ogrenci/denemeler" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Denemeler
        </Button>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-title">{mock.label}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {mock.sectionName} · {dateFmt.format(mock.takenOn)}
            {mock.analysisDone ? (
              <Badge className="bg-success/10 text-success">Analiz yapıldı</Badge>
            ) : (
              <Badge className="bg-warning/10 text-warning">
                Analiz bekliyor
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Hangi konudan kaç soru kaçırdın? (yanlış + boş)
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
          Konu listesi henüz hazır değil — koçuna haber ver.
        </div>
      ) : (
        <TopicErrorForm
          mockExamId={mockExamId}
          groups={groups}
          initial={initial}
          onSavedHref="/ogrenci/analiz"
        />
      )}
    </>
  );
}

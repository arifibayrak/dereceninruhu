import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRightIcon, LibraryIcon } from "lucide-react";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import { countContentForEnrollment } from "@/db/queries/icerik";
import {
  getResourceDayQuestions,
  getTopicResourceMatrix,
  listResourcesWithStats,
} from "@/db/queries/konular";
import { trDayKey } from "@/lib/dates";
import { formatInt } from "@/lib/format";
import { getCurrentUser, type Role } from "@/lib/session";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { Badge } from "@/components/ui/badge";
import { ResourceManager } from "@/components/app/resource-manager";
import { ResourceQuestionLogger } from "@/components/app/resource-question-logger";
import { TopicResourceMatrix } from "@/components/app/topic-resource-matrix";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Kaynaklar" };

export default async function OgrenciKaynaklarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const { enrollment } = detail;
  const now = new Date();

  const [sections, resourceStats, todayQ, matrix, contentCounts] =
    await Promise.all([
      getSectionsForEnrollment(enrollment),
      listResourcesWithStats(enrollment.id, now),
      getResourceDayQuestions(enrollment.id, now),
      getTopicResourceMatrix(enrollment.id, enrollment),
      countContentForEnrollment(enrollment.id, enrollment.examTemplateId),
    ]);

  const subjectOptions = sections.flatMap((s) =>
    s.loggable.map((sub) => ({ id: sub.id, name: `${sub.name} (${s.name})` })),
  );
  const loggerItems = resourceStats
    .filter((r) => r.isActive)
    .map((r) => ({
      id: r.id,
      name: r.name,
      subjectName: r.subjectName,
      today: todayQ[r.id] ?? 0,
      total: r.totalQuestions,
    }));

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-title">Kaynaklar</h1>
        <p className="text-sm text-muted-foreground">
          Kaynaklarını ekle, her kaynaktan kaç soru çözdüğünü gir, biten
          konuları işaretle.
        </p>
      </div>

      {/*
        Koçun paylaştığı içerikler ayrı bir sayfada duruyor ve alt menüde yeri
        yok — öğrenci kaynak ararken en çok buraya baktığı için kısayol başa
        konuldu. Görülmemiş içerik varsa rozetle öne çıkar.
      */}
      <Link
        href="/ogrenci/icerik"
        className="flex items-center gap-3 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10 hover:ring-foreground/20"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-info/10">
          <LibraryIcon className="size-4.5 text-info" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
            Koçundan içerikler
            {contentCounts.unseen > 0 && (
              <Badge className="h-5 bg-primary/10 px-1.5 text-[10px] text-primary">
                {formatInt(contentCounts.unseen)} yeni
              </Badge>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {contentCounts.total > 0
              ? `${formatInt(contentCounts.total)} video, PDF ve not seni bekliyor.`
              : "Koçunun paylaştığı video, PDF ve notlar burada görünür."}
          </span>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <ResourceManager
        data-tour="kaynaklar-yonetim"
        enrollmentId={enrollment.id}
        resources={resourceStats}
        subjects={subjectOptions}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bugün kaynak başına soru</CardTitle>
          <CardDescription>
            Her kaynaktan bugün kaç soru çözdüğünü gir — koçun kaynak kaynak
            görür.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResourceQuestionLogger
            enrollmentId={enrollment.id}
            dayKey={trDayKey(now)}
            resources={loggerItems}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Konu × kaynak takibi</CardTitle>
          <CardDescription>
            Her konunun hangi kaynakta bittiğini işaretle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicResourceMatrix
            enrollmentId={enrollment.id}
            groups={matrix.groups}
            resources={matrix.resources.map((r) => ({
              id: r.id,
              name: r.name,
              subjectId: r.subjectId,
            }))}
            initialDone={matrix.done}
          />
        </CardContent>
      </Card>
    </>
  );
}

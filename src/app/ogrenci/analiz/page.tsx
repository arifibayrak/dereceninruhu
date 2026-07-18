import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getTopicDeficits,
  getTopicHeatmap,
} from "@/db/queries/analiz";
import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import { getTopicResourceMatrix } from "@/db/queries/konular";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatInt } from "@/lib/format";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { TopicDeficitList } from "@/components/app/topic-deficit-list";
import { TopicHeatmap } from "@/components/app/topic-heatmap";
import { TopicResourceMatrix } from "@/components/app/topic-resource-matrix";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Eksik Konular" };

export default async function OgrenciAnalizPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const enrollmentId = detail.enrollment.id;

  const [deficits, heatmap, matrix] = await Promise.all([
    getTopicDeficits(enrollmentId),
    getTopicHeatmap(enrollmentId),
    getTopicResourceMatrix(
      enrollmentId,
      detail.enrollment.examTemplateId,
      detail.enrollment.trackCode,
    ),
  ]);
  const totalDeficit = deficits.reduce((acc, d) => acc + d.total, 0);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-title">Eksik konular</h1>
        <p className="text-sm text-muted-foreground">
          Deneme analizlerinden toplam{" "}
          <strong className="text-foreground">{formatInt(totalDeficit)}</strong>{" "}
          eksik
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toplam eksik sıralaması</CardTitle>
          <CardDescription>
            En çok soru kaçırdığın konular — çalışma önceliğin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicDeficitList deficits={deficits} limit={10} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konu ısı haritası</CardTitle>
          <CardDescription>
            Deneme deneme eksikler — koyulaşan hücre tekrarlayan eksik demek.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicHeatmap data={heatmap} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kaynak takibi</CardTitle>
          <CardDescription>
            Konu × kaynak — bitirdiğin fasikülü/testi işaretle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopicResourceMatrix
            enrollmentId={enrollmentId}
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

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import {
  getResourceDayQuestions,
  getTopicResourceMatrix,
  listResourcesWithStats,
} from "@/db/queries/konular";
import { trDayKey } from "@/lib/dates";
import { getCurrentUser, type Role } from "@/lib/session";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
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

  const [sections, resourceStats, todayQ, matrix] = await Promise.all([
    getSectionsForEnrollment(enrollment.examTemplateId, enrollment.trackCode),
    listResourcesWithStats(enrollment.id, now),
    getResourceDayQuestions(enrollment.id, now),
    getTopicResourceMatrix(
      enrollment.id,
      enrollment.examTemplateId,
      enrollment.trackCode,
    ),
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
          Kaynaklarını ekle, her kaynaktan kaç soru çözdüğünü gir, biten konuları
          işaretle.
        </p>
      </div>

      <ResourceManager
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

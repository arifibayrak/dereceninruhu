import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import { getTopicResourceMatrix, listResources } from "@/db/queries/konular";
import { ResourceManager } from "@/components/app/resource-manager";
import { TopicResourceMatrix } from "@/components/app/topic-resource-matrix";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Kokpit "Konular" sekmesi — kaynak CRUD + konu×kaynak "Bitti" matrisi. */
export async function KonularTab({
  enrollmentId,
  examTemplateId,
  trackCode,
}: {
  enrollmentId: number;
  examTemplateId: number;
  trackCode: string | null;
}) {
  const [matrix, allResources, sections] = await Promise.all([
    getTopicResourceMatrix(enrollmentId, examTemplateId, trackCode),
    listResources(enrollmentId),
    getSectionsForEnrollment(examTemplateId, trackCode),
  ]);
  const subjectOptions = sections.flatMap((s) =>
    s.loggable.map((sub) => ({ id: sub.id, name: `${sub.name} (${s.name})` })),
  );

  return (
    <div className="flex flex-col gap-4">
      <ResourceManager
        enrollmentId={enrollmentId}
        resources={allResources}
        subjects={subjectOptions}
      />
      <Card>
        <CardHeader>
          <CardTitle>Konu × kaynak takibi</CardTitle>
          <CardDescription>
            Ders seç; her konunun hangi kaynakta bittiğini işaretle. Öğrenci de
            kendi tarafından işaretleyebilir.
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
    </div>
  );
}

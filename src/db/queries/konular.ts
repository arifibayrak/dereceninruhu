import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { resources, subjects, topicResourceProgress } from "@/db/schema";
import { getTopicGroupsForExam, type SubjectTopicGroup } from "./analiz";

/* -------------------------------------------------------------------------- */
/*  Kaynaklar                                                                 */
/* -------------------------------------------------------------------------- */

export type ResourceRow = {
  id: number;
  name: string;
  author: string | null;
  notes: string | null;
  subjectId: number | null;
  subjectName: string | null;
  isActive: boolean;
};

/** Kaydın tüm kaynakları (arşivlenenler dahil), ada göre. */
export async function listResources(
  enrollmentId: number,
): Promise<ResourceRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: resources.id,
      name: resources.name,
      author: resources.author,
      notes: resources.notes,
      subjectId: resources.subjectId,
      subjectName: subjects.name,
      isActive: resources.isActive,
    })
    .from(resources)
    .leftJoin(subjects, eq(subjects.id, resources.subjectId))
    .where(eq(resources.enrollmentId, enrollmentId))
    .orderBy(asc(resources.name));
  return rows;
}

/* -------------------------------------------------------------------------- */
/*  Konu × kaynak "Bitti" matrisi                                             */
/* -------------------------------------------------------------------------- */

export type TopicResourceMatrix = {
  groups: SubjectTopicGroup[];
  resources: ResourceRow[];
  /** `${topicId}:${resourceId}` → true (Bitti). */
  done: Record<string, boolean>;
};

/** Kokpit "Konular" sekmesi + öğrenci analiz sayfası matris verisi. */
export async function getTopicResourceMatrix(
  enrollmentId: number,
  examTemplateId: number,
  trackCode: string | null,
): Promise<TopicResourceMatrix> {
  const db = getDb();
  const [groups, resourceRows, progressRows] = await Promise.all([
    getTopicGroupsForExam(examTemplateId, trackCode),
    listResources(enrollmentId),
    db
      .select({
        topicId: topicResourceProgress.topicId,
        resourceId: topicResourceProgress.resourceId,
        isDone: topicResourceProgress.isDone,
      })
      .from(topicResourceProgress)
      .where(eq(topicResourceProgress.enrollmentId, enrollmentId)),
  ]);

  const done: Record<string, boolean> = {};
  for (const r of progressRows) {
    if (r.isDone) done[`${r.topicId}:${r.resourceId}`] = true;
  }
  return {
    groups,
    resources: resourceRows.filter((r) => r.isActive),
    done,
  };
}

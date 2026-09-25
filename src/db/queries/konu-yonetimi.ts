import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { examTemplates, subjects, topics } from "@/db/schema";
import { examSortIndex } from "@/lib/tracks";

/** /koc/konular sol menüsü: sınav → bölüm → ders, konu sayılarıyla. */
export type TopicAdminExam = {
  code: string;
  name: string;
  sections: {
    id: number;
    name: string;
    subjects: {
      id: number;
      name: string;
      /** Alt ders ise üst dersin adı ("Geometri" → "Matematik"). */
      parentName: string | null;
      activeCount: number;
      inactiveCount: number;
    }[];
  }[];
};

export async function getTopicAdminTree(): Promise<TopicAdminExam[]> {
  const db = getDb();
  const [templates, counts] = await Promise.all([
    db.query.examTemplates.findMany({
      where: eq(examTemplates.isActive, true),
      with: {
        sections: {
          orderBy: asc(sql`sort_order`),
          with: {
            subjects: {
              where: eq(subjects.isActive, true),
              orderBy: asc(subjects.sortOrder),
            },
          },
        },
      },
    }),
    db
      .select({
        subjectId: topics.subjectId,
        active: sql<number>`sum(case when ${topics.isActive} then 1 else 0 end)`,
        total: sql<number>`count(*)`,
      })
      .from(topics)
      .groupBy(topics.subjectId),
  ]);

  const countBy = new Map(counts.map((c) => [c.subjectId, c]));
  return templates
    .sort((a, b) => examSortIndex(a.code) - examSortIndex(b.code))
    .map((tpl) => ({
      code: tpl.code,
      name: tpl.name,
      sections: tpl.sections.map((sec) => {
        const nameById = new Map(sec.subjects.map((s) => [s.id, s.name]));
        return {
          id: sec.id,
          name: sec.name,
          subjects: sec.subjects.map((s) => {
            const c = countBy.get(s.id);
            const active = Number(c?.active ?? 0);
            return {
              id: s.id,
              name: s.name,
              parentName: s.parentSubjectId
                ? (nameById.get(s.parentSubjectId) ?? null)
                : null,
              activeCount: active,
              inactiveCount: Number(c?.total ?? 0) - active,
            };
          }),
        };
      }),
    }));
}

export type TopicAdminRow = {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

/** Dersin TÜM konuları: önce aktifler (sırayla), sonra pasifler. */
export async function getSubjectTopicsForAdmin(
  subjectId: number,
): Promise<TopicAdminRow[]> {
  return getDb()
    .select({
      id: topics.id,
      name: topics.name,
      sortOrder: topics.sortOrder,
      isActive: topics.isActive,
    })
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .orderBy(desc(topics.isActive), asc(topics.sortOrder), asc(topics.id));
}

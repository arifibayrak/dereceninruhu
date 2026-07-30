import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  contentItems,
  contentViews,
  contentVisibility,
  enrollments,
  examTemplates,
  subjects,
  topics,
  users,
} from "@/db/schema";
import type { ContentType } from "@/lib/content";

/* -------------------------------------------------------------------------- */
/*  Koç görünümü                                                              */
/* -------------------------------------------------------------------------- */

export type CoachContentRow = {
  id: number;
  type: ContentType;
  title: string;
  url: string | null;
  body: string | null;
  /** Cihazdan yüklenen dosya (R2) — varsa `url` yerine bu açılır. */
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  examCode: string | null;
  subjectName: string | null;
  topicName: string | null;
  isLibrary: boolean;
  createdAt: Date;
  /** İçeriği oluşturan koç/yönetici — "kim ekledi" etiketi + sahiplik. */
  createdByUserId: string | null;
  createdByName: string | null;
  /** Atanan kayıt id'leri (atama diyaloğu önseçimi). */
  assignedEnrollmentIds: number[];
  viewCount: number;
};

/** Koç içerik listesi — atamalar + izlenme + oluşturan bilgisiyle (herkes görür). */
export async function listContentForCoach(): Promise<CoachContentRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: contentItems.id,
      type: contentItems.type,
      title: contentItems.title,
      url: contentItems.url,
      body: contentItems.body,
      fileKey: contentItems.fileKey,
      fileName: contentItems.fileName,
      fileSize: contentItems.fileSize,
      examCode: examTemplates.code,
      subjectName: subjects.name,
      topicName: topics.name,
      isLibrary: contentItems.isLibrary,
      createdAt: contentItems.createdAt,
      createdByUserId: contentItems.createdByUserId,
      createdByName: users.name,
    })
    .from(contentItems)
    .leftJoin(examTemplates, eq(examTemplates.id, contentItems.examTemplateId))
    .leftJoin(subjects, eq(subjects.id, contentItems.subjectId))
    .leftJoin(topics, eq(topics.id, contentItems.topicId))
    .leftJoin(users, eq(users.id, contentItems.createdByUserId))
    .orderBy(desc(contentItems.createdAt), desc(contentItems.id));

  const ids = rows.map((r) => r.id);
  const assignedBy = new Map<number, number[]>();
  const viewsBy = new Map<number, number>();
  if (ids.length > 0) {
    const assignments = await db
      .select({
        contentItemId: contentVisibility.contentItemId,
        enrollmentId: contentVisibility.enrollmentId,
      })
      .from(contentVisibility)
      .where(inArray(contentVisibility.contentItemId, ids));
    for (const a of assignments) {
      const list = assignedBy.get(a.contentItemId) ?? [];
      list.push(a.enrollmentId);
      assignedBy.set(a.contentItemId, list);
    }
    const views = await db
      .select({
        contentItemId: contentViews.contentItemId,
        count: sql<number>`count(*)`,
      })
      .from(contentViews)
      .where(inArray(contentViews.contentItemId, ids))
      .groupBy(contentViews.contentItemId);
    for (const v of views) viewsBy.set(v.contentItemId, Number(v.count));
  }

  return rows.map((r) => ({
    ...r,
    assignedEnrollmentIds: assignedBy.get(r.id) ?? [],
    viewCount: viewsBy.get(r.id) ?? 0,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Öğrenci görünümü                                                          */
/* -------------------------------------------------------------------------- */

export type StudentContentRow = {
  id: number;
  type: ContentType;
  title: string;
  url: string | null;
  body: string | null;
  fileKey: string | null;
  fileName: string | null;
  fileSize: number | null;
  subjectName: string | null;
  topicName: string | null;
  /** Doğrudan atandı mı (kütüphane yerine kişiye özel). */
  isAssigned: boolean;
  viewedAt: Date | null;
};

/**
 * Öğrencinin görebildiği içerik: sınavına uyan kütüphane içeriği
 * (examTemplateId NULL = tüm sınavlar) + kendisine atananlar.
 */
export async function listContentForEnrollment(
  enrollmentId: number,
  examTemplateId: number,
): Promise<StudentContentRow[]> {
  const db = getDb();

  const assigned = await db
    .select({ contentItemId: contentVisibility.contentItemId })
    .from(contentVisibility)
    .where(eq(contentVisibility.enrollmentId, enrollmentId));
  const assignedIds = new Set(assigned.map((a) => a.contentItemId));

  const visibility = or(
    and(
      eq(contentItems.isLibrary, true),
      or(
        isNull(contentItems.examTemplateId),
        eq(contentItems.examTemplateId, examTemplateId),
      ),
    ),
    assignedIds.size > 0
      ? inArray(contentItems.id, [...assignedIds])
      : sql`0 = 1`,
  );

  const rows = await db
    .select({
      id: contentItems.id,
      type: contentItems.type,
      title: contentItems.title,
      url: contentItems.url,
      body: contentItems.body,
      fileKey: contentItems.fileKey,
      fileName: contentItems.fileName,
      fileSize: contentItems.fileSize,
      subjectName: subjects.name,
      topicName: topics.name,
      viewedAt: contentViews.viewedAt,
    })
    .from(contentItems)
    .leftJoin(subjects, eq(subjects.id, contentItems.subjectId))
    .leftJoin(topics, eq(topics.id, contentItems.topicId))
    .leftJoin(
      contentViews,
      and(
        eq(contentViews.contentItemId, contentItems.id),
        eq(contentViews.enrollmentId, enrollmentId),
      ),
    )
    .where(visibility)
    .orderBy(desc(contentItems.createdAt), desc(contentItems.id));

  return rows.map((r) => ({
    ...r,
    isAssigned: assignedIds.has(r.id),
    viewedAt: r.viewedAt ?? null,
  }));
}

/** Öğrenciye görünen içerik sayacı — rozet/kısayol için (satırları çekmez). */
export type ContentCounts = { total: number; unseen: number };

/**
 * Kaynaklar sayfasındaki kısayolun rozeti. Görünürlük kuralı
 * `listContentForEnrollment` ile AYNI olmalı — yoksa rozet bir sayı, sayfa
 * başka bir sayı gösterir.
 */
export async function countContentForEnrollment(
  enrollmentId: number,
  examTemplateId: number,
): Promise<ContentCounts> {
  const db = getDb();

  const assigned = await db
    .select({ contentItemId: contentVisibility.contentItemId })
    .from(contentVisibility)
    .where(eq(contentVisibility.enrollmentId, enrollmentId));
  const assignedIds = new Set(assigned.map((a) => a.contentItemId));

  const visibility = or(
    and(
      eq(contentItems.isLibrary, true),
      or(
        isNull(contentItems.examTemplateId),
        eq(contentItems.examTemplateId, examTemplateId),
      ),
    ),
    assignedIds.size > 0
      ? inArray(contentItems.id, [...assignedIds])
      : sql`0 = 1`,
  );

  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      unseen: sql<number>`sum(case when ${contentViews.viewedAt} is null then 1 else 0 end)`,
    })
    .from(contentItems)
    .leftJoin(
      contentViews,
      and(
        eq(contentViews.contentItemId, contentItems.id),
        eq(contentViews.enrollmentId, enrollmentId),
      ),
    )
    .where(visibility);

  return { total: Number(row?.total ?? 0), unseen: Number(row?.unseen ?? 0) };
}

/* -------------------------------------------------------------------------- */
/*  Atama seçenekleri (sınava göre hızlı seçim)                               */
/* -------------------------------------------------------------------------- */

export type ContentAssignOption = {
  enrollmentId: number;
  label: string;
  /**
   * Hazırlandığı sınav kodları — iki sınava birden hazırlanan öğrencide iki
   * kod olur (bkz. enrollments.secondaryExamTemplateId). Atama diyaloğundaki
   * "tüm YKS/LGS/KPSS" hızlı seçimi bunun üzerinden çalışır.
   */
  examCodes: string[];
  /** Sınıf (varsa) — isim yanında küçük etiket. */
  grade: string | null;
};

/**
 * İçerik atanabilecek aktif öğrenciler, sınav kodlarıyla.
 * `coachUserId` verilirse yalnız o koçun öğrencileri (yönetici için null).
 */
export async function getContentAssignOptions(
  coachUserId?: string | null,
): Promise<ContentAssignOption[]> {
  const db = getDb();
  const rows = await db.query.enrollments.findMany({
    where: coachUserId
      ? and(
          eq(enrollments.status, "active"),
          eq(enrollments.coachUserId, coachUserId),
        )
      : eq(enrollments.status, "active"),
    columns: { id: true },
    with: {
      student: { columns: { fullName: true, grade: true, status: true } },
      examTemplate: { columns: { code: true } },
      secondaryExamTemplate: { columns: { code: true } },
    },
  });

  return rows
    .filter((r) => r.student?.status === "active")
    .map((r) => ({
      enrollmentId: r.id,
      label: r.student.fullName,
      examCodes: [
        r.examTemplate?.code,
        r.secondaryExamTemplate?.code,
      ].filter((c): c is string => !!c),
      grade: r.student.grade?.trim() || null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "tr"));
}

/* -------------------------------------------------------------------------- */
/*  Form seçenekleri (ders/konu ağacı)                                        */
/* -------------------------------------------------------------------------- */

export type ContentFormOptions = {
  exams: { id: number; code: string; name: string }[];
  /** Ders seçenekleri, sınav id'siyle (bölüm adı etikete gömülü). */
  subjects: {
    id: number;
    examTemplateId: number;
    label: string;
  }[];
  /** Konu seçenekleri, ders id'siyle. */
  topics: { id: number; subjectId: number; name: string }[];
};

/** İçerik oluşturma formunun sınav → ders → konu seçenekleri. */
export async function getContentFormOptions(): Promise<ContentFormOptions> {
  const db = getDb();
  const templates = await db.query.examTemplates.findMany({
    where: eq(examTemplates.isActive, true),
    orderBy: asc(examTemplates.id),
    with: {
      sections: {
        orderBy: asc(sql`sort_order`),
        with: {
          subjects: {
            where: eq(subjects.isActive, true),
            orderBy: asc(subjects.sortOrder),
            with: {
              topics: {
                where: eq(topics.isActive, true),
                orderBy: [asc(topics.sortOrder), asc(topics.id)],
              },
            },
          },
        },
      },
    },
  });

  const out: ContentFormOptions = { exams: [], subjects: [], topics: [] };
  for (const tpl of templates) {
    out.exams.push({ id: tpl.id, code: tpl.code, name: tpl.name });
    for (const sec of tpl.sections) {
      for (const sub of sec.subjects) {
        out.subjects.push({
          id: sub.id,
          examTemplateId: tpl.id,
          label: `${sub.name} (${sec.name})`,
        });
        for (const t of sub.topics) {
          out.topics.push({ id: t.id, subjectId: sub.id, name: t.name });
        }
      }
    }
  }
  return out;
}

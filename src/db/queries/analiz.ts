import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { getDb } from "@/db";
import {
  enrollments,
  examSections,
  examTemplates,
  mockExamResults,
  mockExams,
  mockTopicErrors,
  subjects,
  topics,
} from "@/db/schema";
import { chunkForD1 } from "@/lib/d1";
import {
  combinedMockLabel,
  examScopesOf,
  subjectAppliesToTrack,
} from "@/lib/exam";
import type { ExamScopeSource } from "@/db/queries/enrollment";

/* -------------------------------------------------------------------------- */
/*  Deneme + konu listeleri (analiz giriş ekranı)                             */
/* -------------------------------------------------------------------------- */

export type MockDetail = {
  id: number;
  enrollmentId: number;
  takenOn: Date;
  scope: "full" | "branch";
  label: string;
  sectionName: string;
  analysisDone: boolean;
  /** Çözüm süresi (dk) — girilmemişse null. */
  durationMinutes: number | null;
  /** D+Y+B toplamı — tempo (sn/soru) paydası. */
  questionCount: number;
};

/** Deneme başlığı — analiz giriş sayfası üstü. */
export async function getMockDetail(
  mockExamId: number,
): Promise<MockDetail | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: mockExams.id,
      enrollmentId: mockExams.enrollmentId,
      takenOn: mockExams.takenOn,
      scope: mockExams.scope,
      name: mockExams.name,
      publisher: mockExams.publisher,
      analysisDone: mockExams.analysisDone,
      isCombined: mockExams.isCombined,
      durationMinutes: mockExams.durationMinutes,
      templateCode: examTemplates.code,
      sectionName: examSections.name,
      sectionCode: examSections.code,
      // Tek denemenin soru sayısı — bağıntılı alt sorgu (sonuç satırları
      // ayrı tabloda; join edilse başlık alanları çoğalırdı).
      questionCount: sql<number>`(
        select coalesce(sum(${mockExamResults.correctCount} + ${mockExamResults.wrongCount} + ${mockExamResults.blankCount}), 0)
        from ${mockExamResults}
        where ${mockExamResults.mockExamId} = ${mockExams.id}
      )`,
    })
    .from(mockExams)
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .innerJoin(examTemplates, eq(examTemplates.id, examSections.examTemplateId))
    .where(eq(mockExams.id, mockExamId));
  if (!row) return null;
  // Birleşik denemede anchor bölümün adı yanıltıcı — şablon adını göster.
  const combined = row.isCombined ? combinedMockLabel(row.templateCode) : null;
  return {
    id: row.id,
    enrollmentId: row.enrollmentId,
    takenOn: row.takenOn,
    scope: row.scope,
    label:
      row.name?.trim() ||
      row.publisher?.trim() ||
      (combined ? row.templateCode : row.sectionCode),
    sectionName: combined ?? row.sectionName,
    analysisDone: row.analysisDone,
    durationMinutes: row.durationMinutes ?? null,
    questionCount: Number(row.questionCount),
  };
}

export type SubjectTopicGroup = {
  subjectId: number;
  subjectName: string;
  sectionName: string;
  chartColor: string | null;
  topics: { id: number; name: string }[];
};

/**
 * Kaydın sınav(lar)ındaki tüm konular, ders bazında gruplu (alan filtreli).
 * Alt dersler (GEO/MANTIK…) kendi konularıyla ayrı grup olarak gelir.
 * Çift sınavlı kayıtta iki şablonun konuları da döner.
 */
export async function getTopicGroupsForExam(
  source: ExamScopeSource,
): Promise<SubjectTopicGroup[]> {
  const db = getDb();
  const scopes = examScopesOf(source);
  const trackOf = new Map(scopes.map((s) => [s.examTemplateId, s.trackCode]));
  const rank = new Map(scopes.map((s, i) => [s.examTemplateId, i]));
  const sections = await db.query.examSections.findMany({
    where: inArray(
      examSections.examTemplateId,
      scopes.map((s) => s.examTemplateId),
    ),
    orderBy: asc(examSections.sortOrder),
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
  });

  const groups: SubjectTopicGroup[] = [];
  // Birincil sınavın bölümleri önce, ikincil sonra — her biri kendi sırasında.
  const ordered = [...sections].sort(
    (a, b) =>
      (rank.get(a.examTemplateId) ?? 0) - (rank.get(b.examTemplateId) ?? 0) ||
      a.sortOrder - b.sortOrder,
  );
  for (const section of ordered) {
    const trackCode = trackOf.get(section.examTemplateId) ?? null;
    for (const subject of section.subjects) {
      if (!subjectAppliesToTrack({ trackCodes: subject.trackCodes }, trackCode))
        continue;
      if (subject.topics.length === 0) continue;
      groups.push({
        subjectId: subject.id,
        subjectName: subject.name,
        sectionName: section.name,
        chartColor: subject.chartColor,
        topics: subject.topics.map((t) => ({ id: t.id, name: t.name })),
      });
    }
  }
  return groups;
}

/** Denemenin mevcut konu-eksik satırları: topicId → errorCount. */
export async function getMockTopicErrors(
  mockExamId: number,
): Promise<Record<number, number>> {
  const db = getDb();
  const rows = await db
    .select({
      topicId: mockTopicErrors.topicId,
      errorCount: mockTopicErrors.errorCount,
    })
    .from(mockTopicErrors)
    .where(eq(mockTopicErrors.mockExamId, mockExamId));
  const out: Record<number, number> = {};
  for (const r of rows) out[r.topicId] = r.errorCount;
  return out;
}

/* -------------------------------------------------------------------------- */
/*  TOPLAM EKSİK + ısı haritası                                               */
/* -------------------------------------------------------------------------- */

export type TopicDeficit = {
  topicId: number;
  topicName: string;
  /**
   * Konunun KENDİ dersi — alt ders olabilir (Geometri, Kimya…). Üst derse
   * katlanmaz: "Fen Bilimleri" altında toplanınca baskın alt ders (Fizik)
   * listeyi yer ve Biyoloji hiç görünmez — ders ders ayırmanın amacı buydu.
   * Analiz GİRİŞ ekranı da (getTopicGroupsForExam) alt dersleri ayrı gösterir.
   */
  subjectId: number;
  subjectName: string;
  /** Alt derslerin kendi rengi yok — üst dersin rengi kullanılır. */
  chartColor: string | null;
  /** TOPLAM EKSİK = SUM(error_count) tüm denemelerde. */
  total: number;
};

/** Yalnız renk devralmak için: alt derslerin chart_color'ı NULL'dur. */
const parentSubject = alias(subjects, "parent_subject");

/** Konu bazlı toplam eksik sıralaması (çoktan aza). */
export async function getTopicDeficits(
  enrollmentId: number,
): Promise<TopicDeficit[]> {
  const db = getDb();
  const rows = await db
    .select({
      topicId: topics.id,
      topicName: topics.name,
      subjectId: subjects.id,
      subjectName: subjects.name,
      chartColor: sql<
        string | null
      >`coalesce(${subjects.chartColor}, ${parentSubject.chartColor})`,
      total: sql<number>`sum(${mockTopicErrors.errorCount})`,
    })
    .from(mockTopicErrors)
    .innerJoin(mockExams, eq(mockExams.id, mockTopicErrors.mockExamId))
    .innerJoin(topics, eq(topics.id, mockTopicErrors.topicId))
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .leftJoin(parentSubject, eq(parentSubject.id, subjects.parentSubjectId))
    .where(eq(mockExams.enrollmentId, enrollmentId))
    .groupBy(topics.id)
    .orderBy(
      desc(sql`sum(${mockTopicErrors.errorCount})`),
      asc(subjects.sortOrder),
      asc(topics.sortOrder),
    );
  return rows.map((r) => ({ ...r, total: Number(r.total) }));
}

export type HeatmapMock = {
  id: number;
  takenOn: Date;
  label: string;
};

export type TopicHeatmapData = {
  /** Eskiden yeniye — sütunlar. */
  mocks: HeatmapMock[];
  /** Toplam eksik çoktan aza — satırlar. */
  topics: TopicDeficit[];
  /** `${topicId}:${mockId}` → errorCount. */
  cells: Record<string, number>;
};

/** Konu × deneme ısı haritası verisi (yalnız eksik girilen denemeler). */
export async function getTopicHeatmap(
  enrollmentId: number,
  opts?: { maxTopics?: number; maxMocks?: number },
): Promise<TopicHeatmapData> {
  const db = getDb();
  const deficits = await getTopicDeficits(enrollmentId);
  const topicRows = deficits.slice(0, opts?.maxTopics ?? 20);
  if (topicRows.length === 0) return { mocks: [], topics: [], cells: {} };

  const errorRows = await db
    .select({
      mockExamId: mockTopicErrors.mockExamId,
      topicId: mockTopicErrors.topicId,
      errorCount: mockTopicErrors.errorCount,
      takenOn: mockExams.takenOn,
      name: mockExams.name,
      publisher: mockExams.publisher,
      isCombined: mockExams.isCombined,
      templateCode: examTemplates.code,
      sectionCode: examSections.code,
    })
    .from(mockTopicErrors)
    .innerJoin(mockExams, eq(mockExams.id, mockTopicErrors.mockExamId))
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .innerJoin(examTemplates, eq(examTemplates.id, examSections.examTemplateId))
    .where(eq(mockExams.enrollmentId, enrollmentId))
    .orderBy(asc(mockExams.takenOn), asc(mockExams.id));

  const mockById = new Map<number, HeatmapMock>();
  for (const r of errorRows) {
    if (!mockById.has(r.mockExamId)) {
      mockById.set(r.mockExamId, {
        id: r.mockExamId,
        takenOn: r.takenOn,
        label:
          r.name?.trim() ||
          r.publisher?.trim() ||
          (r.isCombined ? r.templateCode : r.sectionCode),
      });
    }
  }
  const mocks = [...mockById.values()].slice(-(opts?.maxMocks ?? 12));
  const mockIds = new Set(mocks.map((m) => m.id));
  const topicIds = new Set(topicRows.map((t) => t.topicId));

  const cells: Record<string, number> = {};
  for (const r of errorRows) {
    if (!mockIds.has(r.mockExamId) || !topicIds.has(r.topicId)) continue;
    cells[`${r.topicId}:${r.mockExamId}`] = r.errorCount;
  }
  return { mocks, topics: topicRows, cells };
}

/* -------------------------------------------------------------------------- */
/*  Kokpit yardımcıları                                                       */
/* -------------------------------------------------------------------------- */

/** Kaydın id'sinden öğrenci id'sini çözer (analiz sayfası geri bağlantısı). */
export async function getStudentIdForEnrollment(
  enrollmentId: number,
): Promise<number | null> {
  const db = getDb();
  const row = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
    columns: { studentId: true },
  });
  return row?.studentId ?? null;
}

/** Denemelerde konu-eksik girişi olanların id kümesi (liste rozetleri). */
export async function getMocksWithAnalysis(
  mockExamIds: number[],
): Promise<Set<number>> {
  if (mockExamIds.length === 0) return new Set();
  const db = getDb();
  const out = new Set<number>();
  // D1: `in (…)` de 100 parametre sınırına tabi — uzun deneme geçmişi böl.
  for (const part of chunkForD1(mockExamIds, 1)) {
    const rows = await db
      .select({ mockExamId: mockTopicErrors.mockExamId })
      .from(mockTopicErrors)
      .where(inArray(mockTopicErrors.mockExamId, part))
      .groupBy(mockTopicErrors.mockExamId);
    for (const r of rows) out.add(r.mockExamId);
  }
  return out;
}

import { and, asc, desc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  examSections,
  examTemplates,
  mockExamResults,
  mockExams,
  questionLogs,
  students,
  subjects,
} from "@/db/schema";
import { addDays, mondayOf, trDayKey, weekRange } from "@/lib/dates";
import { combinedMockLabel } from "@/lib/exam";
import type { StudentInsightInput } from "@/lib/insights";
import type { SessionViewer } from "@/lib/session";
import { getSectionsForEnrollment } from "@/db/queries/enrollment";
import { getStudyWeekTotal } from "@/db/queries/study";

/* -------------------------------------------------------------------------- */
/*  Soru takibi                                                               */
/* -------------------------------------------------------------------------- */

/** Bir ızgara hücresi — toplam + (varsa) doğru/yanlış/boş kırılımı. */
export type WeekGridCell = {
  total: number;
  correct: number | null;
  wrong: number | null;
  blank: number | null;
};

/** Haftalık ızgara hücreleri: `${dayKey}:${subjectId}` → hücre. */
export async function getWeekGrid(
  enrollmentId: number,
  anyDayOfWeek: Date,
): Promise<Record<string, WeekGridCell>> {
  const db = getDb();
  const { start, end } = weekRange(anyDayOfWeek);
  const rows = await db
    .select({
      logDate: questionLogs.logDate,
      subjectId: questionLogs.subjectId,
      questionCount: questionLogs.questionCount,
      correctCount: questionLogs.correctCount,
      wrongCount: questionLogs.wrongCount,
      blankCount: questionLogs.blankCount,
    })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gte(questionLogs.logDate, start),
        lt(questionLogs.logDate, end),
      ),
    );

  const grid: Record<string, WeekGridCell> = {};
  for (const r of rows) {
    grid[`${trDayKey(r.logDate)}:${r.subjectId}`] = {
      total: r.questionCount,
      correct: r.correctCount,
      wrong: r.wrongCount,
      blank: r.blankCount,
    };
  }
  return grid;
}

/** Bu haftanın toplam soru sayısı. */
export async function getWeekQuestionTotal(
  enrollmentId: number,
  anyDayOfWeek: Date = new Date(),
): Promise<number> {
  const db = getDb();
  const { start, end } = weekRange(anyDayOfWeek);
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${questionLogs.questionCount}), 0)`,
    })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gte(questionLogs.logDate, start),
        lt(questionLogs.logDate, end),
      ),
    );
  return Number(rows[0]?.total ?? 0);
}

/** Tüm zamanların toplam soru sayısı. */
export async function getTotalQuestions(enrollmentId: number): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${questionLogs.questionCount}), 0)`,
    })
    .from(questionLogs)
    .where(eq(questionLogs.enrollmentId, enrollmentId));
  return Number(rows[0]?.total ?? 0);
}

export type WeeklyVolumePoint = {
  /** Haftanın pazartesi günü (trDayKey). */
  weekKey: string;
  weekStart: Date;
  total: number;
};

/** Son N haftanın haftalık soru hacmi (boş haftalar 0 ile döner). */
export async function getWeeklyVolume(
  enrollmentId: number,
  weeks = 8,
  now: Date = new Date(),
): Promise<WeeklyVolumePoint[]> {
  const db = getDb();
  const thisMonday = mondayOf(now);
  const firstMonday = addDays(thisMonday, -7 * (weeks - 1));
  const rows = await db
    .select({
      logDate: questionLogs.logDate,
      questionCount: questionLogs.questionCount,
    })
    .from(questionLogs)
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gte(questionLogs.logDate, firstMonday),
      ),
    );

  const buckets = new Map<string, number>();
  for (const r of rows) {
    const key = trDayKey(mondayOf(r.logDate));
    buckets.set(key, (buckets.get(key) ?? 0) + r.questionCount);
  }

  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(firstMonday, i * 7);
    const weekKey = trDayKey(weekStart);
    return { weekKey, weekStart, total: buckets.get(weekKey) ?? 0 };
  });
}

/** Bir dersin bir haftadaki hacmi + (varsa) doğruluk kırılımı. */
export type SubjectWeekCell = {
  total: number;
  /** Kırılım girilmiş satırların toplamı; hiç girilmemişse null. */
  correct: number | null;
  wrong: number | null;
  blank: number | null;
};

export type SubjectBreakdownRow = {
  subjectId: number;
  subjectName: string;
  sectionId: number;
  sectionName: string;
  parentSubjectId: number | null;
  /** weekKey (pazartesi trDayKey) → o haftanın hücresi. */
  byWeek: Record<string, SubjectWeekCell>;
  /** Tüm dönem toplamı (aynı pencere). */
  total: SubjectWeekCell;
};

export type SubjectBreakdown = {
  /** Sütun başlıkları — eskiden yeniye haftalar. */
  weeks: { weekKey: string; weekStart: Date }[];
  rows: SubjectBreakdownRow[];
};

/**
 * "Ders ders soru ve doğruluk" tablosu — öğrencinin Excel'de kaybettiği görünüm.
 *
 * Son N haftanın ders × hafta ızgarasını, varsa D/Y/B kırılımıyla döner.
 * Kırılım opsiyonel olduğu için `SUM` yerine `SUM(...)` + `COUNT(correct)`
 * kullanılır: hiçbir satırda kırılım yoksa alan `null` kalır ve UI "—" gösterir
 * (0 göstermek "hepsini yanlış yapmış" gibi okunurdu).
 *
 * Yalnız o kayda ait dersler döner; hiç soru girilmemiş dersler listelenmez.
 */
export async function getSubjectBreakdown(
  enrollmentId: number,
  weeks = 8,
  now: Date = new Date(),
): Promise<SubjectBreakdown> {
  const db = getDb();
  const thisMonday = mondayOf(now);
  const firstMonday = addDays(thisMonday, -7 * (weeks - 1));

  const rows = await db
    .select({
      logDate: questionLogs.logDate,
      subjectId: questionLogs.subjectId,
      subjectName: subjects.name,
      sectionId: examSections.id,
      sectionName: examSections.name,
      parentSubjectId: subjects.parentSubjectId,
      sortOrder: subjects.sortOrder,
      questionCount: questionLogs.questionCount,
      correctCount: questionLogs.correctCount,
      wrongCount: questionLogs.wrongCount,
      blankCount: questionLogs.blankCount,
    })
    .from(questionLogs)
    .innerJoin(subjects, eq(subjects.id, questionLogs.subjectId))
    .innerJoin(examSections, eq(examSections.id, subjects.examSectionId))
    .where(
      and(
        eq(questionLogs.enrollmentId, enrollmentId),
        gte(questionLogs.logDate, firstMonday),
      ),
    );

  const weekCols = Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(firstMonday, i * 7);
    return { weekKey: trDayKey(weekStart), weekStart };
  });

  const byId = new Map<number, SubjectBreakdownRow & { sortOrder: number }>();
  /** null'ı korumak için: yalnız kırılımlı satır görüldüğünde alan sayısallaşır. */
  const bump = (cell: SubjectWeekCell, r: (typeof rows)[number]) => {
    cell.total += r.questionCount;
    if (
      r.correctCount !== null &&
      r.wrongCount !== null &&
      r.blankCount !== null
    ) {
      cell.correct = (cell.correct ?? 0) + r.correctCount;
      cell.wrong = (cell.wrong ?? 0) + r.wrongCount;
      cell.blank = (cell.blank ?? 0) + r.blankCount;
    }
  };
  const emptyCell = (): SubjectWeekCell => ({
    total: 0,
    correct: null,
    wrong: null,
    blank: null,
  });

  for (const r of rows) {
    let row = byId.get(r.subjectId);
    if (!row) {
      row = {
        subjectId: r.subjectId,
        subjectName: r.subjectName,
        sectionId: r.sectionId,
        sectionName: r.sectionName,
        parentSubjectId: r.parentSubjectId,
        sortOrder: r.sortOrder,
        byWeek: {},
        total: emptyCell(),
      };
      byId.set(r.subjectId, row);
    }
    const weekKey = trDayKey(mondayOf(r.logDate));
    row.byWeek[weekKey] ??= emptyCell();
    bump(row.byWeek[weekKey], r);
    bump(row.total, r);
  }

  const ordered = [...byId.values()].sort(
    (a, b) =>
      a.sectionId - b.sectionId ||
      a.sortOrder - b.sortOrder ||
      a.subjectName.localeCompare(b.subjectName, "tr"),
  );

  // `sortOrder` yalnız sıralama içindi — döndürülen tipe sızmasın.
  return {
    weeks: weekCols,
    rows: ordered.map((row) => ({
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      sectionId: row.sectionId,
      sectionName: row.sectionName,
      parentSubjectId: row.parentSubjectId,
      byWeek: row.byWeek,
      total: row.total,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/*  Denemeler                                                                 */
/* -------------------------------------------------------------------------- */

export type MockRow = {
  id: number;
  takenOn: Date;
  scope: "full" | "branch";
  publisher: string | null;
  name: string | null;
  analysisDone: boolean;
  sectionName: string;
  sectionCode: string;
  totalNet: number;
  /** Öğrencinin girdiği çözüm süresi (dk) — opsiyonel, tempo bundan çıkar. */
  durationMinutes: number | null;
  /** D+Y+B toplamı — tempo (sn/soru) paydası. */
  questionCount: number;
  /** Denemedeki puanlanan dersler — branş etiketi + tempo kıyas anahtarı. */
  subjectIds: number[];
  subjectNames: string[];
};

/** Deneme listesi (bölüm adı + toplam net + süre/tempo ile), yeniden eskiye. */
export async function getMockList(enrollmentId: number): Promise<MockRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: mockExams.id,
      takenOn: mockExams.takenOn,
      scope: mockExams.scope,
      publisher: mockExams.publisher,
      name: mockExams.name,
      analysisDone: mockExams.analysisDone,
      isCombined: mockExams.isCombined,
      durationMinutes: mockExams.durationMinutes,
      templateCode: examTemplates.code,
      sectionName: examSections.name,
      sectionCode: examSections.code,
      totalNet: sql<number>`coalesce(sum(${mockExamResults.net}), 0)`,
      questionCount: sql<number>`coalesce(sum(${mockExamResults.correctCount} + ${mockExamResults.wrongCount} + ${mockExamResults.blankCount}), 0)`,
      subjectIds: sql<
        string | null
      >`group_concat(${mockExamResults.subjectId}, ',')`,
      subjectNames: sql<string | null>`group_concat(${subjects.name}, '|')`,
    })
    .from(mockExams)
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .innerJoin(
      examTemplates,
      eq(examTemplates.id, examSections.examTemplateId),
    )
    .leftJoin(mockExamResults, eq(mockExamResults.mockExamId, mockExams.id))
    .leftJoin(subjects, eq(subjects.id, mockExamResults.subjectId))
    .where(eq(mockExams.enrollmentId, enrollmentId))
    .groupBy(mockExams.id)
    .orderBy(desc(mockExams.takenOn), desc(mockExams.id));
  return rows.map((r) => ({
    ...r,
    ...mockSectionLabels(r),
    totalNet: Number(r.totalNet),
    questionCount: Number(r.questionCount),
    subjectIds: splitConcat(r.subjectIds, ",").map(Number).filter(Number.isFinite),
    subjectNames: splitConcat(r.subjectNames, "|"),
  }));
}

/** `group_concat` çıktısı → dizi (boş/NULL güvenli). */
function splitConcat(raw: string | null, sep: string): string[] {
  if (!raw) return [];
  return raw
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Birleşik denemede (KPSS GY + GK) anchor bölümün adı yanıltıcıdır — etiketi
 * şablonun birleşik adıyla değiştirir. Tek bölümlü denemede aynen bırakır.
 */
function mockSectionLabels(row: {
  isCombined: boolean;
  templateCode: string;
  sectionName: string;
  sectionCode: string;
}): { sectionName: string; sectionCode: string } {
  const combined = row.isCombined
    ? combinedMockLabel(row.templateCode)
    : null;
  return combined
    ? { sectionName: combined, sectionCode: row.templateCode }
    : { sectionName: row.sectionName, sectionCode: row.sectionCode };
}

/**
 * Düzenleme formunun beklediği şekil. Sonuçlar veritabanında zaten PUANLANAN
 * derse toplanmış tutulur; form da onları ebeveyn satırında gösterir (alt ders
 * kırılımı girişte toplandığı için geri getirilemez — bu bilinçli).
 */
export type MockEditData = {
  mockExamId: number;
  enrollmentId: number;
  examSectionId: number;
  combined: boolean;
  scope: "full" | "branch";
  publisher: string;
  name: string;
  /** `YYYY-MM-DD` (TRT) — `<input type="date">` için. */
  takenOn: string;
  /** Çözüm süresi (dk) — girilmemişse null. */
  durationMinutes: number | null;
  results: {
    subjectId: number;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
  }[];
};

/**
 * Düzenleme formunun ÇALIŞMASI için gereken her şey tek pakette: kaydın
 * kendisi + o kaydın sınavına ait bölüm/ders ızgarası. Böylece düğme hangi
 * listede olursa olsun (öğrenci listesi, kokpit, haftalık pano) aynı bileşen
 * yeter — sayfaların ders listesini peşin taşımasına gerek kalmaz.
 */
export type MockEditPayload = {
  mock: MockEditData;
  sections: {
    id: number;
    name: string;
    wrongPenaltyDivisor: number;
    /** Bölümün sınavı — çift sınavlı kayıtta form seçenekleri buna göre gruplanır. */
    examTemplateId: number;
    examCode: string;
    examName: string;
    subjects: {
      id: number;
      name: string;
      isScored: boolean;
      parentSubjectId: number | null;
      officialQuestionCount: number | null;
    }[];
  }[];
};

/** Tek denemenin düzenlenebilir alanları + D/Y/B satırları + ders ızgarası. */
export async function getMockForEdit(
  mockExamId: number,
): Promise<MockEditPayload | null> {
  const db = getDb();
  const exam = await db.query.mockExams.findFirst({
    where: eq(mockExams.id, mockExamId),
  });
  if (!exam) return null;

  const enrollment = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, exam.enrollmentId),
    with: {
      examTemplate: true,
      track: true,
      secondaryExamTemplate: true,
      secondaryTrack: true,
    },
  });
  if (!enrollment) return null;

  const [results, sections] = await Promise.all([
    db
      .select({
        subjectId: mockExamResults.subjectId,
        correctCount: mockExamResults.correctCount,
        wrongCount: mockExamResults.wrongCount,
        blankCount: mockExamResults.blankCount,
      })
      .from(mockExamResults)
      .where(eq(mockExamResults.mockExamId, mockExamId)),
    getSectionsForEnrollment({
      examTemplateId: enrollment.examTemplateId,
      trackCode: enrollment.track?.code ?? null,
      secondaryExamTemplateId: enrollment.secondaryExamTemplateId,
      secondaryTrackCode: enrollment.secondaryTrack?.code ?? null,
    }),
  ]);

  return {
    mock: {
      mockExamId: exam.id,
      enrollmentId: exam.enrollmentId,
      examSectionId: exam.examSectionId,
      combined: exam.isCombined,
      scope: exam.scope,
      publisher: exam.publisher ?? "",
      name: exam.name ?? "",
      takenOn: trDayKey(exam.takenOn),
      durationMinutes: exam.durationMinutes ?? null,
      results,
    },
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      wrongPenaltyDivisor: s.wrongPenaltyDivisor,
      examTemplateId: s.examTemplateId,
      examCode: s.examCode,
      examName: s.examName,
      subjects: s.loggable.map((sub) => ({
        id: sub.id,
        name: sub.name,
        isScored: sub.isScored,
        parentSubjectId: sub.parentSubjectId,
        officialQuestionCount: sub.officialQuestionCount,
      })),
    })),
  };
}

export type NetSeriesPoint = {
  mockExamId: number;
  takenOn: Date;
  label: string;
  net: number;
};

/** Tam (full) denemelerin toplam net serisi, eskiden yeniye. */
export async function getNetSeries(
  enrollmentId: number,
): Promise<NetSeriesPoint[]> {
  const db = getDb();
  const rows = await db
    .select({
      mockExamId: mockExams.id,
      takenOn: mockExams.takenOn,
      name: mockExams.name,
      publisher: mockExams.publisher,
      isCombined: mockExams.isCombined,
      templateCode: examTemplates.code,
      sectionCode: examSections.code,
      net: sql<number>`coalesce(sum(${mockExamResults.net}), 0)`,
    })
    .from(mockExams)
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .innerJoin(
      examTemplates,
      eq(examTemplates.id, examSections.examTemplateId),
    )
    .leftJoin(mockExamResults, eq(mockExamResults.mockExamId, mockExams.id))
    .where(
      and(eq(mockExams.enrollmentId, enrollmentId), eq(mockExams.scope, "full")),
    )
    .groupBy(mockExams.id)
    .orderBy(asc(mockExams.takenOn), asc(mockExams.id));
  return rows.map((r) => ({
    mockExamId: r.mockExamId,
    takenOn: r.takenOn,
    label:
      r.name?.trim() ||
      r.publisher?.trim() ||
      (r.isCombined ? r.templateCode : r.sectionCode),
    net: Number(r.net),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Insight girdisi                                                           */
/* -------------------------------------------------------------------------- */

/** buildStudentInsights için tüm ham veriyi tek seferde toplar. */
export async function getStudentInsightInput(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<StudentInsightInput> {
  const db = getDb();

  /*
   * Seri (streak) bugünden geriye yürür, o yüzden yalnız YAKIN geçmiş gerekir.
   * Eskiden bu sorgu öğrencinin TÜM soru kayıtlarını satır satır okuyordu (bir
   * yıl × ~30 ders ≈ 10 bin satır) sadece "hangi günler dolu" kümesini çıkarmak
   * için. `group by` sunucuda tekilleştirir, tarih penceresi de indeksi o
   * aralığa daraltır — sınav hazırlığı 400 günü aşmadığı için seri kısalmaz.
   */
  const streakWindowStart = addDays(now, -400);

  const [activeDays, lastLogRows, lastMockRows, thisWeek, lastWeek, thisWeekStudy, lastWeekStudy, series] =
    await Promise.all([
      db
        .select({ logDate: questionLogs.logDate })
        .from(questionLogs)
        .where(
          and(
            eq(questionLogs.enrollmentId, enrollmentId),
            gt(questionLogs.questionCount, 0),
            gte(questionLogs.logDate, streakWindowStart),
          ),
        )
        .groupBy(questionLogs.logDate),
      db
        .select({ last: sql<number | null>`max(${questionLogs.logDate})` })
        .from(questionLogs)
        .where(
          and(
            eq(questionLogs.enrollmentId, enrollmentId),
            gt(questionLogs.questionCount, 0),
          ),
        ),
      db
        .select({ last: sql<number | null>`max(${mockExams.takenOn})` })
        .from(mockExams)
        .where(eq(mockExams.enrollmentId, enrollmentId)),
      getWeekQuestionTotal(enrollmentId, now),
      getWeekQuestionTotal(enrollmentId, addDays(now, -7)),
      getStudyWeekTotal(enrollmentId, now),
      getStudyWeekTotal(enrollmentId, addDays(now, -7)),
      getNetSeries(enrollmentId),
    ]);

  const activeDayKeys = [...new Set(activeDays.map((r) => trDayKey(r.logDate)))];

  const lastSec = Math.max(
    Number(lastLogRows[0]?.last ?? 0),
    Number(lastMockRows[0]?.last ?? 0),
  );
  const lastActivity = lastSec > 0 ? new Date(lastSec * 1000) : null;

  return {
    activeDayKeys,
    lastActivity,
    weekQuestionTotal: thisWeek,
    lastWeekQuestionTotal: lastWeek,
    weekStudyMinutes: thisWeekStudy,
    lastWeekStudyMinutes: lastWeekStudy,
    netSeries: series.map((p) => ({ takenOn: p.takenOn, net: p.net })),
    now,
  };
}

/* -------------------------------------------------------------------------- */
/*  Haftalık deneme panosu (koç/yönetici — kadro geneli)                      */
/* -------------------------------------------------------------------------- */

export type WeeklyMockRow = {
  mockId: number;
  studentId: number;
  studentName: string;
  examCode: string;
  sectionName: string;
  name: string | null;
  publisher: string | null;
  scope: "full" | "branch";
  takenOn: Date;
  totalNet: number;
  analysisDone: boolean;
  /** Çözüm süresi (dk) + tempo paydası — branş denemelerinde hız takibi. */
  durationMinutes: number | null;
  questionCount: number;
  /** Branş denemesinde hangi ders(ler) — pano ders ders okunsun diye. */
  subjectNames: string[];
};

/**
 * Bir haftada (Pzt–Paz) kadro genelinde girilen tüm denemeler + toplam net.
 * Yönetici tüm kadroyu; koç yalnız kendi öğrencilerini görür (coachScope).
 * Sıralama JS'te (tek haftalık küçük küme): net azalan ya da isim.
 */
export async function getWeeklyMockResults(opts: {
  weekAnchor: Date;
  viewer: SessionViewer;
  sort?: "net" | "isim";
}): Promise<WeeklyMockRow[]> {
  const db = getDb();
  const { start, end } = weekRange(opts.weekAnchor);
  const scope =
    opts.viewer.role === "coach"
      ? eq(enrollments.coachUserId, opts.viewer.id)
      : undefined;

  const rows = await db
    .select({
      mockId: mockExams.id,
      studentId: students.id,
      studentName: students.fullName,
      examCode: examTemplates.code,
      sectionName: examSections.name,
      isCombined: mockExams.isCombined,
      name: mockExams.name,
      publisher: mockExams.publisher,
      scope: mockExams.scope,
      takenOn: mockExams.takenOn,
      analysisDone: mockExams.analysisDone,
      durationMinutes: mockExams.durationMinutes,
      totalNet: sql<number>`coalesce(sum(${mockExamResults.net}), 0)`,
      questionCount: sql<number>`coalesce(sum(${mockExamResults.correctCount} + ${mockExamResults.wrongCount} + ${mockExamResults.blankCount}), 0)`,
      subjectNames: sql<string | null>`group_concat(${subjects.name}, '|')`,
    })
    .from(mockExams)
    .innerJoin(enrollments, eq(enrollments.id, mockExams.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(examSections, eq(examSections.id, mockExams.examSectionId))
    .innerJoin(
      examTemplates,
      eq(examTemplates.id, examSections.examTemplateId),
    )
    .leftJoin(mockExamResults, eq(mockExamResults.mockExamId, mockExams.id))
    // Ders adı yalnız satır etiketi için; sonuç satırları zaten okunuyor.
    .leftJoin(subjects, eq(subjects.id, mockExamResults.subjectId))
    .where(
      and(
        gte(mockExams.takenOn, start),
        lt(mockExams.takenOn, end),
        isNull(students.deletedAt),
        scope,
      ),
    )
    .groupBy(mockExams.id);

  const mapped: WeeklyMockRow[] = rows.map((r) => ({
    ...r,
    // Birleşikte "Genel Yetenek" yerine "KPSS Denemesi" gösterilir.
    sectionName:
      (r.isCombined ? combinedMockLabel(r.examCode) : null) ?? r.sectionName,
    totalNet: Number(r.totalNet),
    questionCount: Number(r.questionCount),
    subjectNames: splitConcat(r.subjectNames, "|"),
  }));

  if (opts.sort === "isim") {
    mapped.sort((a, b) => a.studentName.localeCompare(b.studentName, "tr"));
  } else {
    mapped.sort((a, b) => b.totalNet - a.totalNet);
  }
  return mapped;
}

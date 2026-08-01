"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  examSections,
  mockExamResults,
  mockExams,
  mockTopicErrors,
  questionLogs,
  subjects,
} from "@/db/schema";
import { getMockForEdit, type MockEditPayload } from "@/db/queries/tracking";
import { chunkForD1 } from "@/lib/d1";
import { computeNet, rollUpChildren, type SubjectCounts } from "@/lib/net";
import { normalizeQuestionEntry } from "@/lib/question-log";
import { startOfTrtDay } from "@/lib/dates";
import {
  createMockSchema,
  questionLogUpsertSchema,
  updateMockSchema,
} from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

/** Soru takibi: upsert one day's per-subject counts (the grid is an upsert). */
export async function upsertQuestionLogs(
  input: unknown,
): Promise<ActionResult<{ count: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = questionLogUpsertSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const { enrollmentId, logDate, entries } = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, enrollmentId, user);

    const day = startOfTrtDay(logDate);
    // Toplam D/Y/B'den TÜRETİLİR; kırılım yoksa NULL yazılır (kısmi satır yok).
    const rows: {
      enrollmentId: number;
      logDate: Date;
      subjectId: number;
      questionCount: number;
      correctCount: number | null;
      wrongCount: number | null;
      blankCount: number | null;
    }[] = [];
    for (const e of entries) {
      const normalized = normalizeQuestionEntry(e);
      if (!normalized) return actionError("Geçersiz soru girişi.");
      rows.push({ enrollmentId, logDate: day, subjectId: e.subjectId, ...normalized });
    }

    // D1: sorgu başına 100 parametre sınırı — satır başına 9 `?` harcanıyor
    // (7 sütun + created_at/updated_at), o yüzden ders listesi büyüdükçe böl.
    for (const part of chunkForD1(rows, 9)) {
      await db
        .insert(questionLogs)
        .values(part)
        .onConflictDoUpdate({
          target: [
            questionLogs.enrollmentId,
            questionLogs.logDate,
            questionLogs.subjectId,
          ],
          set: {
            questionCount: sql`excluded.question_count`,
            // Kırılım temizlendiğinde NULL'a dönebilmeli — bu yüzden hepsi set.
            correctCount: sql`excluded.correct_count`,
            wrongCount: sql`excluded.wrong_count`,
            blankCount: sql`excluded.blank_count`,
            updatedAt: new Date(),
          },
        });
    }

    return { ok: true, data: { count: rows.length } };
  });
}

/** Deneme girişi/düzenlemesi için ortak hesap girdisi. */
type MockPayload = {
  examSectionId: number;
  combined: boolean;
  results: {
    subjectId: number;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
  }[];
};

/** Yazmaya hazır deneme: anchor bölüm + netleri hesaplanmış sonuç satırları. */
type PreparedMock = {
  anchorSectionId: number;
  rows: {
    subjectId: number;
    correctCount: number;
    wrongCount: number;
    blankCount: number;
    net: number;
  }[];
};

/**
 * Net hesabının TEK yeri (giriş + düzenleme aynı yoldan geçer): alt dersler
 * puanlanan ebeveyne toplanır, her ders kendi bölümünün yanlış böleniyle
 * hesaplanır. Hata durumunda fırlatır; `guarded` mesajı kullanıcıya taşır.
 */
async function prepareMock(
  db: ReturnType<typeof getDb>,
  v: MockPayload,
): Promise<PreparedMock> {
  const section = await db.query.examSections.findFirst({
    where: eq(examSections.id, v.examSectionId),
  });
  if (!section) throw new Error("Deneme bölümü bulunamadı.");

  /*
   * Birleşik deneme (KPSS GY + GK) tek oturumdur: dersler şablonun BÜTÜN
   * bölümlerinden gelebilir. Anchor satır şablonun ilk bölümüdür; her dersin
   * neti kendi bölümünün böleniyle hesaplanır (bölenler bölümden bölüme
   * değişebilir, örn. LGS 3 / YKS 4).
   */
  const scopeSections = v.combined
    ? await db
        .select({
          id: examSections.id,
          sortOrder: examSections.sortOrder,
          wrongPenaltyDivisor: examSections.wrongPenaltyDivisor,
        })
        .from(examSections)
        .where(eq(examSections.examTemplateId, section.examTemplateId))
    : [section];

  // Roll child subjects (GEO/MANTIK…) up into their scored parent before net.
  const sectionSubjects = await db
    .select({
      id: subjects.id,
      examSectionId: subjects.examSectionId,
      parentSubjectId: subjects.parentSubjectId,
      isScored: subjects.isScored,
    })
    .from(subjects)
    .where(
      scopeSections.length === 1
        ? eq(subjects.examSectionId, scopeSections[0].id)
        : inArray(
            subjects.examSectionId,
            scopeSections.map((s) => s.id),
          ),
    );

  const divisorOfSection = new Map(
    scopeSections.map((s) => [s.id, s.wrongPenaltyDivisor]),
  );
  const sectionOfSubject = new Map(
    sectionSubjects.map((s) => [s.id, s.examSectionId]),
  );
  /** Puanlanan dersin neti, kendi bölümünün böleniyle. */
  const divisorOfSubject = (subjectId: number) =>
    divisorOfSection.get(sectionOfSubject.get(subjectId) ?? -1) ??
    section.wrongPenaltyDivisor;

  // Anchor = şablonun ilk bölümü, böylece etiket/sıralama deterministik olur.
  const anchorSectionId = v.combined
    ? [...scopeSections].sort((a, b) => a.sortOrder - b.sortOrder)[0].id
    : section.id;

  const counts = new Map<number, SubjectCounts>();
  for (const r of v.results) {
    counts.set(r.subjectId, {
      correct: r.correctCount,
      wrong: r.wrongCount,
      blank: r.blankCount,
    });
  }
  const rolled = rollUpChildren(counts, sectionSubjects);
  if (rolled.size === 0) throw new Error("Puanlanan ders bulunamadı.");

  return {
    anchorSectionId,
    rows: [...rolled.entries()].map(([subjectId, c]) => ({
      subjectId,
      correctCount: c.correct,
      wrongCount: c.wrong,
      blankCount: c.blank ?? 0,
      net: computeNet(c.correct, c.wrong, divisorOfSubject(subjectId)),
    })),
  };
}

/** Deneme girişi: net server-side hesaplanır; alt dersler scored derse toplanır. */
export async function createMock(
  input: unknown,
): Promise<ActionResult<{ mockExamId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = createMockSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, v.enrollmentId, user);

    const { anchorSectionId, rows } = await prepareMock(db, v);

    const [exam] = await db
      .insert(mockExams)
      .values({
        enrollmentId: v.enrollmentId,
        examSectionId: anchorSectionId,
        isCombined: v.combined,
        scope: v.scope,
        publisher: v.publisher?.trim() || null,
        name: v.name?.trim() || null,
        takenOn: startOfTrtDay(v.takenOn),
        durationMinutes: v.durationMinutes ?? null,
      })
      .returning({ id: mockExams.id });

    // Satır başına 6 `?` — birleşik denemelerde ders sayısı arttıkça böl.
    for (const part of chunkForD1(rows, 6)) {
      await db
        .insert(mockExamResults)
        .values(part.map((r) => ({ ...r, mockExamId: exam.id })));
    }

    return { ok: true, data: { mockExamId: exam.id } };
  });
}

/**
 * Deneme düzenleme: sonuç satırları toptan değiştirilir (netler yeniden
 * hesaplanır — snapshot kuralı kaydın KENDİ yazımı için geçerlidir, düzeltme
 * zaten yeni bir yazımdır). Kayıt öğrencinin kendi kaydına bağlı olmalı.
 */
export async function updateMock(
  input: unknown,
): Promise<ActionResult<{ mockExamId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = updateMockSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();

    const existing = await db.query.mockExams.findFirst({
      where: eq(mockExams.id, v.mockExamId),
    });
    if (!existing) return actionError("Deneme bulunamadı.");
    // Yetki denemenin KENDİ kaydından okunur — istemcinin gönderdiğinden değil.
    await assertEnrollmentAccess(db, existing.enrollmentId, user);

    const { anchorSectionId, rows } = await prepareMock(db, v);

    await db
      .update(mockExams)
      .set({
        examSectionId: anchorSectionId,
        isCombined: v.combined,
        scope: v.scope,
        publisher: v.publisher?.trim() || null,
        name: v.name?.trim() || null,
        takenOn: startOfTrtDay(v.takenOn),
        durationMinutes: v.durationMinutes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(mockExams.id, v.mockExamId));

    await db
      .delete(mockExamResults)
      .where(eq(mockExamResults.mockExamId, v.mockExamId));
    for (const part of chunkForD1(rows, 6)) {
      await db
        .insert(mockExamResults)
        .values(part.map((r) => ({ ...r, mockExamId: v.mockExamId })));
    }

    // Bölüm/kapsam değiştiyse eski konu-eksik analizi başka bir sınavın
    // konularına aitti — yanlış veri taşımaktansa temizlenir.
    if (
      existing.examSectionId !== anchorSectionId ||
      existing.isCombined !== v.combined
    ) {
      await db
        .delete(mockTopicErrors)
        .where(eq(mockTopicErrors.mockExamId, v.mockExamId));
      await db
        .update(mockExams)
        .set({ analysisDone: false })
        .where(eq(mockExams.id, v.mockExamId));
    }

    return { ok: true, data: { mockExamId: v.mockExamId } };
  });
}

/** Deneme silme — sonuç satırları ve konu-eksik analizi de gider. */
export async function deleteMock(
  mockExamId: number,
): Promise<ActionResult<{ mockExamId: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const id = Number(mockExamId);
    if (!Number.isInteger(id) || id <= 0) return actionError("Geçersiz deneme.");
    const db = getDb();

    const existing = await db.query.mockExams.findFirst({
      where: eq(mockExams.id, id),
    });
    if (!existing) return actionError("Deneme bulunamadı.");
    await assertEnrollmentAccess(db, existing.enrollmentId, user);

    // FK sırası: önce çocuklar (SQLite'ta cascade tanımlı değil).
    await db.delete(mockTopicErrors).where(eq(mockTopicErrors.mockExamId, id));
    await db.delete(mockExamResults).where(eq(mockExamResults.mockExamId, id));
    await db.delete(mockExams).where(eq(mockExams.id, id));

    return { ok: true, data: { mockExamId: id } };
  });
}

/**
 * Düzenleme diyaloğu açılırken kaydı çeker. İstemciye peşin gönderilmez —
 * liste sayfaları yüzlerce satır olabiliyor, form verisi ihtiyaç anında iner.
 */
export async function loadMockForEdit(
  mockExamId: number,
): Promise<ActionResult<MockEditPayload>> {
  return guarded(async () => {
    const user = await requireUser();
    const db = getDb();
    const data = await getMockForEdit(Number(mockExamId));
    if (!data) return actionError("Deneme bulunamadı.");
    await assertEnrollmentAccess(db, data.mock.enrollmentId, user);
    return { ok: true, data };
  });
}

/** Coach flags "deneme analizi yapıldı". */
export async function setAnalysisDone(
  mockExamId: number,
  done: boolean,
): Promise<ActionResult<{ mockExamId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const db = getDb();
    await db
      .update(mockExams)
      .set({ analysisDone: done, updatedAt: new Date() })
      .where(eq(mockExams.id, mockExamId));
    return { ok: true, data: { mockExamId } };
  });
}

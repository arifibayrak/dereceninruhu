import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  examSections,
  students,
  subjects,
} from "@/db/schema";
import {
  examScopesOf,
  filterSubjectsForTrack,
  loggableSubjects,
  scoredSubjects,
  type ExamScope,
  type SubjectRow,
} from "@/lib/exam";

/** Cockpit/öğrenci başlığı için öğrenci + aktif kayıt + sınav + alan. */
export type EnrollmentDetail = {
  student: {
    id: number;
    fullName: string;
    phone: string | null;
    parentPhone: string | null;
    grade: string | null;
    field: string | null;
    school: string | null;
    dershane: string | null;
    email: string | null;
    telegram: string | null;
    city: string | null;
    birthYear: number | null;
    inviteCode: string | null;
    userId: string | null;
    status: "active" | "inactive" | "alumni";
  };
  enrollment: {
    id: number;
    examTemplateId: number;
    targetText: string | null;
    startDate: Date | null;
    examCode: string;
    examName: string;
    trackCode: string | null;
    trackName: string | null;
    /**
     * İkinci sınav — öğrenci aynı dönemde iki sınava hazırlanıyorsa dolu
     * (ör. Ekim'de ortaöğretim KPSS + 2027 YKS). NULL = tek sınav.
     */
    secondaryExamTemplateId: number | null;
    secondaryExamCode: string | null;
    secondaryExamName: string | null;
    secondaryTrackCode: string | null;
    secondaryTrackName: string | null;
    /** Atanan koç — null = henüz atanmadı. */
    coachUserId: string | null;
    coachName: string | null;
    /** Koçun Cal.com randevu linki — öğrenci görüşmelerini buradan planlar. */
    coachCalBookingUrl: string | null;
    /** Öğrenci görüşmelerini ilk planladığında damgalanır (gerekli-adım nudge'ı). */
    callsScheduledAt: Date | null;
  };
};

/** Öğrencinin (id ile) aktif kaydı — koç kokpiti girişi. */
export async function getEnrollmentDetailByStudentId(
  studentId: number,
): Promise<EnrollmentDetail | null> {
  const db = getDb();
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });
  if (!student) return null;
  // Gizlenmiş (soft-delete) öğrenci: kokpit 404, öğrencinin kendi sayfaları
  // boş (giriş engeli), ajan işlem yapamaz. Geri getirmek deletedAt'i temizler.
  if (student.deletedAt) return null;
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active"),
    ),
    with: {
      examTemplate: true,
      track: true,
      coach: true,
      secondaryExamTemplate: true,
      secondaryTrack: true,
    },
  });
  if (!enrollment) return null;
  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      phone: student.phone,
      parentPhone: student.parentPhone,
      grade: student.grade,
      field: student.field,
      school: student.school,
      dershane: student.dershane,
      email: student.email,
      telegram: student.telegram,
      city: student.city,
      birthYear: student.birthYear,
      inviteCode: student.inviteCode,
      userId: student.userId,
      status: student.status,
    },
    enrollment: {
      id: enrollment.id,
      examTemplateId: enrollment.examTemplateId,
      targetText: enrollment.targetText,
      startDate: enrollment.startDate,
      examCode: enrollment.examTemplate.code,
      examName: enrollment.examTemplate.name,
      trackCode: enrollment.track?.code ?? null,
      trackName: enrollment.track?.name ?? null,
      secondaryExamTemplateId: enrollment.secondaryExamTemplateId,
      secondaryExamCode: enrollment.secondaryExamTemplate?.code ?? null,
      secondaryExamName: enrollment.secondaryExamTemplate?.name ?? null,
      secondaryTrackCode: enrollment.secondaryTrack?.code ?? null,
      secondaryTrackName: enrollment.secondaryTrack?.name ?? null,
      coachUserId: enrollment.coachUserId,
      coachName: enrollment.coach?.name ?? null,
      coachCalBookingUrl: enrollment.coach?.calBookingUrl ?? null,
      callsScheduledAt: enrollment.callsScheduledAt,
    },
  };
}

/** Oturumdaki öğrenci kullanıcısından aktif kaydını çözer. */
export async function getEnrollmentDetailByUserId(
  userId: string,
): Promise<EnrollmentDetail | null> {
  const db = getDb();
  const student = await db.query.students.findFirst({
    where: eq(students.userId, userId),
  });
  if (!student) return null;
  return getEnrollmentDetailByStudentId(student.id);
}

/** Bir bölümün alan-filtreli ders listeleri (soru takibi + deneme girişi). */
export type SectionSubjects = {
  id: number;
  code: string;
  name: string;
  wrongPenaltyDivisor: number;
  /** Bölümün ait olduğu sınav — çift sınavlı kayıtta ders/bölüm etiketi. */
  examTemplateId: number;
  examCode: string;
  examName: string;
  /** İkinci sınavın bölümü mü — arayüzde rozet/filtre sırası için. */
  isSecondary: boolean;
  /** Alan-filtreli, sıralı — soru takibi satırları (alt dersler dahil). */
  loggable: SubjectRow[];
  /** Yalnız puanlanan dersler — deneme sonuç satırları. */
  scored: SubjectRow[];
};

/**
 * Ders/bölüm çözen sorguların girdisi: kaydın sınav(lar)ı. `EnrollmentDetail`
 * içindeki `enrollment` nesnesi olduğu gibi verilebilir.
 */
export type ExamScopeSource = {
  examTemplateId: number;
  trackCode: string | null;
  secondaryExamTemplateId?: number | null;
  secondaryTrackCode?: string | null;
};

/**
 * Kaydın sınav(lar)ındaki bölümler + alan-filtreli dersler.
 *
 * Çift sınavlı kayıtta İKİ şablonun bölümleri arka arkaya döner: önce birincil
 * sınav (kendi sortOrder'ında), sonra ikincil. Ders id'leri bölüme özgü
 * olduğundan (KPSS Türkçesi ≠ TYT Türkçesi) çakışma olmaz; her bölüm kendi
 * sınavının alan koduyla filtrelenir.
 */
export async function getSectionsForEnrollment(
  source: ExamScopeSource,
): Promise<SectionSubjects[]> {
  const db = getDb();
  const scopes = examScopesOf(source);
  const rows = await db.query.examSections.findMany({
    where: inArray(
      examSections.examTemplateId,
      scopes.map((s) => s.examTemplateId),
    ),
    orderBy: asc(examSections.sortOrder),
    with: {
      examTemplate: true,
      subjects: {
        where: eq(subjects.isActive, true),
        orderBy: asc(subjects.sortOrder),
      },
    },
  });

  const trackOf = new Map<number, ExamScope>(
    scopes.map((s) => [s.examTemplateId, s]),
  );
  // Sınav sırası: birincil önce, ikincil sonra — her biri kendi sortOrder'ında.
  const rank = new Map(scopes.map((s, i) => [s.examTemplateId, i]));
  const ordered = [...rows].sort(
    (a, b) =>
      (rank.get(a.examTemplateId) ?? 0) - (rank.get(b.examTemplateId) ?? 0) ||
      a.sortOrder - b.sortOrder,
  );

  return ordered.map((section) => {
    const subjectRows: SubjectRow[] = section.subjects.map((s) => ({
      id: s.id,
      examSectionId: s.examSectionId,
      code: s.code,
      name: s.name,
      parentSubjectId: s.parentSubjectId,
      isScored: s.isScored,
      trackCodes: s.trackCodes,
      officialQuestionCount: s.officialQuestionCount,
      sortOrder: s.sortOrder,
      chartColor: s.chartColor,
    }));
    const scope = trackOf.get(section.examTemplateId);
    const forTrack = filterSubjectsForTrack(subjectRows, scope?.trackCode ?? null);
    return {
      id: section.id,
      code: section.code,
      name: section.name,
      wrongPenaltyDivisor: section.wrongPenaltyDivisor,
      examTemplateId: section.examTemplateId,
      examCode: section.examTemplate.code,
      examName: section.examTemplate.name,
      isSecondary: (rank.get(section.examTemplateId) ?? 0) > 0,
      loggable: loggableSubjects(forTrack),
      scored: scoredSubjects(forTrack),
    };
  });
}

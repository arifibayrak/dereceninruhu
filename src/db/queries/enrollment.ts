import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  enrollments,
  examSections,
  students,
  subjects,
} from "@/db/schema";
import {
  filterSubjectsForTrack,
  loggableSubjects,
  scoredSubjects,
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
    /** Atanan koç — null = henüz atanmadı. */
    coachUserId: string | null;
    coachName: string | null;
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
  const enrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.studentId, studentId),
      eq(enrollments.status, "active"),
    ),
    with: { examTemplate: true, track: true, coach: true },
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
      coachUserId: enrollment.coachUserId,
      coachName: enrollment.coach?.name ?? null,
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
  /** Alan-filtreli, sıralı — soru takibi satırları (alt dersler dahil). */
  loggable: SubjectRow[];
  /** Yalnız puanlanan dersler — deneme sonuç satırları. */
  scored: SubjectRow[];
};

/** Kaydın sınav şablonundaki bölümler + alan-filtreli dersler. */
export async function getSectionsForEnrollment(
  examTemplateId: number,
  trackCode: string | null,
): Promise<SectionSubjects[]> {
  const db = getDb();
  const sections = await db.query.examSections.findMany({
    where: eq(examSections.examTemplateId, examTemplateId),
    orderBy: asc(examSections.sortOrder),
    with: {
      subjects: {
        where: eq(subjects.isActive, true),
        orderBy: asc(subjects.sortOrder),
      },
    },
  });

  return sections.map((section) => {
    const rows: SubjectRow[] = section.subjects.map((s) => ({
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
    const forTrack = filterSubjectsForTrack(rows, trackCode);
    return {
      id: section.id,
      code: section.code,
      name: section.name,
      wrongPenaltyDivisor: section.wrongPenaltyDivisor,
      loggable: loggableSubjects(forTrack),
      scored: scoredSubjects(forTrack),
    };
  });
}

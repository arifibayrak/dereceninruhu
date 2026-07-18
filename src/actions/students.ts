"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { enrollments, examTemplates, students, tracks } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import {
  createStudentSchema,
  updateStudentProfileSchema,
} from "@/lib/validation";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";

const clean = (v?: string) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

function newInviteCode(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export type CreatedStudent = {
  studentId: number;
  enrollmentId: number;
  inviteCode: string;
  invitePath: string;
};

/** Coach creates a student + their active enrollment + a WhatsApp davet code. */
export async function createStudent(
  input: unknown,
): Promise<ActionResult<CreatedStudent>> {
  return guarded(async () => {
    const coach = await requireCoach();
    const parsed = createStudentSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      return actionError("Lütfen formu kontrol edin.", fieldErrors);
    }
    const v = parsed.data;
    const db = getDb();

    const template = await db.query.examTemplates.findFirst({
      where: eq(examTemplates.code, v.examCode),
    });
    if (!template) return actionError("Sınav şablonu bulunamadı.");

    let trackId: number | null = null;
    if (v.trackCode) {
      const track = await db.query.tracks.findFirst({
        where: and(
          eq(tracks.examTemplateId, template.id),
          eq(tracks.code, v.trackCode),
        ),
      });
      if (!track) return actionError("Seçilen alan bulunamadı.");
      trackId = track.id;
    }

    const inviteCode = newInviteCode();

    const [student] = await db
      .insert(students)
      .values({
        fullName: v.fullName.trim(),
        phone: v.phone ? normalizePhone(v.phone) : null,
        parentPhone: v.parentPhone ? normalizePhone(v.parentPhone) : null,
        grade: clean(v.grade),
        field: clean(v.field),
        school: clean(v.school),
        dershane: clean(v.dershane),
        inviteCode,
        status: "active",
      })
      .returning({ id: students.id });

    const [enrollment] = await db
      .insert(enrollments)
      .values({
        studentId: student.id,
        examTemplateId: template.id,
        trackId,
        coachUserId: coach.id,
        targetText: clean(v.targetText),
        startDate: v.startDate ?? new Date(),
        status: "active",
      })
      .returning({ id: enrollments.id });

    return {
      ok: true,
      data: {
        studentId: student.id,
        enrollmentId: enrollment.id,
        inviteCode,
        invitePath: `/davet/${inviteCode}`,
      },
    };
  });
}

/** Update a student's profile + their active enrollment's target (coach). */
export async function updateStudent(
  studentId: number,
  input: unknown,
): Promise<ActionResult<{ studentId: number }>> {
  return guarded(async () => {
    await requireCoach();
    const parsed = updateStudentProfileSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const v = parsed.data;
    const db = getDb();

    await db
      .update(students)
      .set({
        fullName: v.fullName.trim(),
        phone: v.phone ? normalizePhone(v.phone) : null,
        parentPhone: v.parentPhone ? normalizePhone(v.parentPhone) : null,
        grade: clean(v.grade),
        field: clean(v.field),
        school: clean(v.school),
        dershane: clean(v.dershane),
        updatedAt: new Date(),
      })
      .where(eq(students.id, studentId));

    await db
      .update(enrollments)
      .set({ targetText: clean(v.targetText), updatedAt: new Date() })
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.status, "active"),
        ),
      );

    return { ok: true, data: { studentId } };
  });
}

/**
 * Öğrenci kendi profilini günceller (self-servis).
 * Giriş telefonu (users.phoneNumber, PIN girişi) bilinçli olarak KAPSAM DIŞI —
 * yalnız `students` + aktif `enrollments.targetText` güncellenir.
 */
export async function updateMyProfile(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = updateStudentProfileSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const db = getDb();

    const student = await db.query.students.findFirst({
      where: eq(students.userId, user.id),
    });
    if (!student) {
      return actionError(
        "Öğrenci profili bulunamadı. Daveti tamamladıysan tekrar giriş yap.",
      );
    }

    const v = parsed.data;

    await db
      .update(students)
      .set({
        fullName: v.fullName.trim(),
        phone: v.phone ? normalizePhone(v.phone) : null,
        parentPhone: v.parentPhone ? normalizePhone(v.parentPhone) : null,
        grade: clean(v.grade),
        field: clean(v.field),
        school: clean(v.school),
        dershane: clean(v.dershane),
        updatedAt: new Date(),
      })
      .where(eq(students.id, student.id));

    await db
      .update(enrollments)
      .set({ targetText: clean(v.targetText), updatedAt: new Date() })
      .where(
        and(
          eq(enrollments.studentId, student.id),
          eq(enrollments.status, "active"),
        ),
      );

    return { ok: true, data: undefined };
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  enrollmentPackages,
  enrollments,
  privateLessons,
} from "@/db/schema";
import {
  assignPackageSchema,
  deletePrivateLessonSchema,
  upsertPrivateLessonSchema,
} from "@/lib/validation-paket";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireCoach,
  type ActionResult,
  type SessionUser,
} from "@/actions/_guard";

/**
 * Paket atama ve özel ders kayıtları — tamamı koç/yönetici.
 *
 * Öğrenci bu tabloları YAZAMAZ: paket ne satın alındığının, ders de ne
 * verildiğinin kaydıdır; ikisi de ticari gerçeğe aittir. Öğrenci yalnız okur
 * (/ogrenci/ozel-ders). Yetki `assertEnrollmentAccess` ile aksiyon katmanında
 * verilir — koç yalnız kendi kadrosuna, yönetici hepsine dokunur
 * (`src/actions/muhasebe.ts` deseninin aynısı).
 */
async function assertEnrollmentAccess(enrollmentId: number, user: SessionUser) {
  const db = getDb();
  const row = await db.query.enrollments.findFirst({
    where: eq(enrollments.id, enrollmentId),
  });
  if (!row) throw new Error("Kayıt bulunamadı");
  if (user.role === "coach" && row.coachUserId !== user.id) {
    throw new Error("Bu öğrenci sana atanmadı");
  }
  return row;
}

/** Paketin gerçekten bu kayda ait olduğunu doğrular (id uydurulamasın). */
async function assertPackageBelongs(
  enrollmentPackageId: number,
  enrollmentId: number,
) {
  const db = getDb();
  const row = await db.query.enrollmentPackages.findFirst({
    where: eq(enrollmentPackages.id, enrollmentPackageId),
  });
  if (!row || row.enrollmentId !== enrollmentId) {
    throw new Error("Paket bu öğrenciye ait değil");
  }
  return row;
}

function revalidateStudent(studentId: number) {
  revalidatePath(`/koc/ogrenciler/${studentId}`);
  revalidatePath(`/koc/ogrenciler/${studentId}/paket`);
  revalidatePath("/ogrenci/ozel-ders");
  revalidatePath("/ogrenci");
  revalidatePath("/ogrenci/program");
}

/**
 * Öğrenciye paket atar ya da mevcut atamayı günceller.
 *
 * Ad ve fiyat SNAPSHOT olarak yazılır: katalogdaki fiyat sonradan değişince
 * geçmiş atamalar ve onlara bağlı faturalar bozulmasın.
 */
export async function assignPackage(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = assignPackageSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    const enrollment = await assertEnrollmentAccess(v.enrollmentId, user);

    const values = {
      enrollmentId: v.enrollmentId,
      packageId: v.packageId ?? null,
      nameSnapshot: v.name,
      priceKurusSnapshot: v.priceTl,
      kind: v.kind,
      lessonHoursGranted: v.lessonHours,
      startsOn: v.startsOn ?? null,
      endsOn: v.endsOn ?? null,
      status: v.status,
      note: v.note?.trim() ? v.note.trim() : null,
    };

    let id: number;
    if (v.enrollmentPackageId) {
      await assertPackageBelongs(v.enrollmentPackageId, v.enrollmentId);
      await db
        .update(enrollmentPackages)
        .set(values)
        .where(eq(enrollmentPackages.id, v.enrollmentPackageId));
      id = v.enrollmentPackageId;
    } else {
      const [row] = await db
        .insert(enrollmentPackages)
        .values(values)
        .returning({ id: enrollmentPackages.id });
      if (!row) return actionError("Paket kaydedilemedi.");
      id = row.id;
    }

    revalidateStudent(enrollment.studentId);
    return { ok: true, data: { id } };
  });
}

export async function deleteEnrollmentPackage(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    const user = await requireCoach();
    const id = Number((input as { enrollmentPackageId?: unknown })?.enrollmentPackageId);
    if (!Number.isInteger(id) || id <= 0) return actionError("Geçersiz paket.");
    const db = getDb();
    const row = await db.query.enrollmentPackages.findFirst({
      where: eq(enrollmentPackages.id, id),
    });
    if (!row) return actionError("Paket bulunamadı.");
    const enrollment = await assertEnrollmentAccess(row.enrollmentId, user);

    /*
     * Silmeden önce derslerin bağını çöz: FK'yi kırmadan ders kaydı ayakta
     * kalsın. Ders VERİLMİŞTİR — paket kaydı yanlış diye o gerçek silinmez,
     * yalnız hak dışına ("ekstra ders") düşer.
     */
    await db
      .update(privateLessons)
      .set({ enrollmentPackageId: null })
      .where(eq(privateLessons.enrollmentPackageId, id));
    await db.delete(enrollmentPackages).where(eq(enrollmentPackages.id, id));

    revalidateStudent(enrollment.studentId);
    return { ok: true, data: undefined };
  });
}

/** Özel ders kaydı ekler ya da günceller. */
export async function upsertPrivateLesson(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = upsertPrivateLessonSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    const enrollment = await assertEnrollmentAccess(v.enrollmentId, user);

    if (v.enrollmentPackageId) {
      await assertPackageBelongs(v.enrollmentPackageId, v.enrollmentId);
    }

    const values = {
      enrollmentId: v.enrollmentId,
      enrollmentPackageId: v.enrollmentPackageId ?? null,
      subjectId: v.subjectId ?? null,
      topicId: v.topicId ?? null,
      instructorUserId: v.instructorUserId ?? null,
      instructorProfileId: v.instructorProfileId ?? null,
      scheduledAt: v.scheduledAt ?? null,
      heldAt: v.heldAt ?? null,
      durationMinutes: v.durationMinutes,
      status: v.status,
      countsAgainstQuota: v.countsAgainstQuota,
      note: v.note?.trim() ? v.note.trim() : null,
      studentVisibleNote: v.studentVisibleNote?.trim()
        ? v.studentVisibleNote.trim()
        : null,
      meetingUrl: v.meetingUrl?.trim() ? v.meetingUrl.trim() : null,
    };

    let id: number;
    if (v.lessonId) {
      const existing = await db.query.privateLessons.findFirst({
        where: eq(privateLessons.id, v.lessonId),
      });
      if (!existing || existing.enrollmentId !== v.enrollmentId) {
        return actionError("Ders bu öğrenciye ait değil.");
      }
      await db
        .update(privateLessons)
        .set(values)
        .where(eq(privateLessons.id, v.lessonId));
      id = v.lessonId;
    } else {
      const [row] = await db
        .insert(privateLessons)
        .values(values)
        .returning({ id: privateLessons.id });
      if (!row) return actionError("Ders kaydedilemedi.");
      id = row.id;
    }

    revalidateStudent(enrollment.studentId);
    return { ok: true, data: { id } };
  });
}

export async function deletePrivateLesson(
  input: unknown,
): Promise<ActionResult<void>> {
  return guarded(async () => {
    const user = await requireCoach();
    const parsed = deletePrivateLessonSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz ders.");
    const db = getDb();
    const row = await db.query.privateLessons.findFirst({
      where: eq(privateLessons.id, parsed.data.lessonId),
    });
    if (!row) return actionError("Ders bulunamadı.");
    const enrollment = await assertEnrollmentAccess(row.enrollmentId, user);

    await db
      .delete(privateLessons)
      .where(eq(privateLessons.id, parsed.data.lessonId));
    revalidateStudent(enrollment.studentId);
    return { ok: true, data: undefined };
  });
}

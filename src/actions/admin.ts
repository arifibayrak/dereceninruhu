"use server";

import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";

import { getDb, type DB } from "@/db";
import { enrollments, users } from "@/db/schema";
import { getAuth } from "@/lib/auth";
import { isOwnerEmail } from "@/lib/owner";
import {
  assignStudentCoachSchema,
  bulkAssignCoachSchema,
  createAdminSchema,
  updateUserRoleSchema,
} from "@/lib/validation-admin";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

/** Atama sonrası kadro/pano/yönetim görünümlerini tazeler. */
function revalidateRosterViews() {
  revalidatePath("/koc");
  revalidatePath("/koc/ogrenciler");
  revalidatePath("/koc/yonetim");
}

/** Atama hedefinin koç ya da yönetici olduğunu doğrular. */
async function assertCoachTarget(db: DB, coachUserId: string): Promise<void> {
  const target = await db.query.users.findFirst({
    where: eq(users.id, coachUserId),
    columns: { id: true, role: true },
  });
  if (!target || (target.role !== "coach" && target.role !== "admin")) {
    throw new Error("Seçilen kullanıcı koç ya da yönetici değil.");
  }
}

/** Yönetici ekle — yalnız mevcut yönetici; hesap signUpEmail ile açılır. */
export async function createAdmin(
  input: unknown,
): Promise<ActionResult<{ email: string }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = createAdminSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        "Lütfen formu kontrol edin.",
        fieldErrorsOf(parsed.error.issues),
      );
    }
    const { name, email, password } = parsed.data;
    const db = getDb();

    let userId: string;
    try {
      const res = await getAuth().api.signUpEmail({
        body: { email, password, name },
      });
      userId = res.user.id;
    } catch {
      return actionError("Bu e-posta ile bir hesap zaten var.");
    }

    // role is input:false — set it server-side via drizzle.
    await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidatePath("/koc/yonetim");
    return { ok: true, data: { email } };
  });
}

/**
 * Rol değişimi (koç ↔ yönetici). Son yönetici koça çevrilemez —
 * sistem yöneticisiz kalamaz.
 */
export async function updateUserRole(
  input: unknown,
): Promise<ActionResult<{ userId: string }>> {
  return guarded(async () => {
    const actor = await requireAdmin();
    const parsed = updateUserRoleSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz rol isteği.");
    const { userId, role } = parsed.data;

    const db = getDb();
    const target = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, role: true, email: true },
    });
    if (!target) return actionError("Kullanıcı bulunamadı.");
    if (target.role === "student") {
      return actionError("Öğrenci hesabının rolü buradan değiştirilemez.");
    }
    // Hesap sahibinin (Arif) rolünü yalnız kendisi değiştirebilir.
    if (isOwnerEmail(target.email) && !isOwnerEmail(actor.email)) {
      return actionError(
        "Bu hesabın rolü yalnız hesap sahibi tarafından değiştirilebilir.",
      );
    }
    if (target.role === role) return { ok: true, data: { userId } };

    if (target.role === "admin" && role === "coach") {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"));
      if (admins.length <= 1) {
        return actionError(
          "Son yönetici koça çevrilemez — önce başka bir yönetici ekle.",
        );
      }
    }

    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));

    revalidateRosterViews();
    return { ok: true, data: { userId } };
  });
}

/** Öğrencinin (aktif kaydının) koçunu atar/değiştirir; null = kaldırır. */
export async function assignStudentCoach(
  input: unknown,
): Promise<ActionResult<{ enrollmentId: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = assignStudentCoachSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz atama isteği.");
    const { enrollmentId, coachUserId } = parsed.data;

    const db = getDb();
    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, enrollmentId),
      columns: { id: true, studentId: true },
    });
    if (!enrollment) return actionError("Kayıt bulunamadı.");
    if (coachUserId) await assertCoachTarget(db, coachUserId);

    await db
      .update(enrollments)
      .set({ coachUserId, updatedAt: new Date() })
      .where(eq(enrollments.id, enrollmentId));

    revalidateRosterViews();
    revalidatePath(`/koc/ogrenciler/${enrollment.studentId}`);
    return { ok: true, data: { enrollmentId } };
  });
}

/** Toplu atama — seçilen kayıtların hepsini aynı koça bağlar. */
export async function bulkAssignStudentCoach(
  input: unknown,
): Promise<ActionResult<{ updated: number }>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = bulkAssignCoachSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz toplu atama isteği.");
    const { enrollmentIds, coachUserId } = parsed.data;

    const db = getDb();
    if (coachUserId) await assertCoachTarget(db, coachUserId);

    const updated = await db
      .update(enrollments)
      .set({ coachUserId, updatedAt: new Date() })
      .where(inArray(enrollments.id, enrollmentIds))
      .returning({ id: enrollments.id });
    if (updated.length === 0) return actionError("Atanacak kayıt bulunamadı.");

    revalidateRosterViews();
    return { ok: true, data: { updated: updated.length } };
  });
}

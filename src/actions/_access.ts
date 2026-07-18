import { eq } from "drizzle-orm";
import { type DB } from "@/db";
import { enrollments, students } from "@/db/schema";
import type { SessionUser } from "@/actions/_guard";

/**
 * Koçlar (2 kişilik ekip, ikisi de her şeyi görür) geçer; öğrenciler yalnız
 * kendi kayıtlarına yazabilir. Server-Action katmanındaki tek yetki kapısı.
 */
export async function assertEnrollmentAccess(
  db: DB,
  enrollmentId: number,
  user: SessionUser,
): Promise<void> {
  if (user.role === "coach" || user.role === "admin") return;
  const rows = await db
    .select({ userId: students.userId })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(eq(enrollments.id, enrollmentId));
  if (!rows[0] || rows[0].userId !== user.id) {
    throw new Error("Bu kayıt sana ait değil");
  }
}

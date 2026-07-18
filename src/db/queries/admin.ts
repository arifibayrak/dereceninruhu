import { asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { enrollments, users } from "@/db/schema";

export type StaffRole = "admin" | "coach";

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  /** Kendisine atanmış aktif kayıt (öğrenci) sayısı. */
  activeStudentCount: number;
  createdAt: Date;
};

/** Ekip listesi (yönetici + koç) + atanmış aktif öğrenci sayıları. */
export async function listStaff(): Promise<StaffRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(inArray(users.role, ["admin", "coach"]))
    .orderBy(asc(users.name));

  const counts = await db
    .select({
      coachUserId: enrollments.coachUserId,
      count: sql<number>`count(*)`,
    })
    .from(enrollments)
    .where(eq(enrollments.status, "active"))
    .groupBy(enrollments.coachUserId);
  const countBy = new Map(
    counts.map((c) => [c.coachUserId, Number(c.count)]),
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role === "admin" ? "admin" : "coach",
    activeStudentCount: countBy.get(r.id) ?? 0,
    createdAt: r.createdAt,
  }));
}

export type CoachOption = {
  id: string;
  name: string;
  role: StaffRole;
};

/** Koç atama seçicileri için koç + yönetici listesi. */
export async function listCoaches(): Promise<CoachOption[]> {
  const db = getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(inArray(users.role, ["admin", "coach"]))
    .orderBy(asc(users.name));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role === "admin" ? "admin" : "coach",
  }));
}

import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  enrollments,
  examTemplates,
  mockExams,
  questionLogs,
  students,
} from "@/db/schema";
import { selectInChunks } from "@/lib/d1";
import { normalizePhone } from "@/lib/phone";

/**
 * Telefon numarası bu sistemde KİMLİKTİR: giriş e-postası (`phoneToEmail`) ondan
 * türetilir, davet/aktivasyon eşlemesi ondan yapılır. Bu yüzden aynı numaraya
 * iki öğrenci kaydı olamaz — olduğunda öğrenci "hesabı var ama giremiyorum"
 * durumuna düşer (PIN yanlış kayda sıfırlanır, verisi iki kayda bölünür).
 */

export type PhoneMatch = {
  studentId: number;
  fullName: string;
  /** Bu kayda bağlı bir giriş hesabı var mı. */
  hasAccount: boolean;
};

/**
 * Aynı telefona sahip GİZLENMEMİŞ öğrenciler (`excludeStudentId` hariç).
 * Gizlenen (soft-delete) kayıtlar sayılmaz — numara yeniden kullanılabilir.
 */
export async function findStudentsByPhone(
  rawPhone: string,
  excludeStudentId?: number,
): Promise<PhoneMatch[]> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return [];
  const db = getDb();
  const rows = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      userId: students.userId,
    })
    .from(students)
    .where(
      and(
        eq(students.phone, phone),
        isNull(students.deletedAt),
        excludeStudentId ? ne(students.id, excludeStudentId) : undefined,
      ),
    );
  return rows.map((r) => ({
    studentId: r.studentId,
    fullName: r.fullName,
    hasAccount: r.userId != null,
  }));
}

export type DuplicateStudent = {
  studentId: number;
  fullName: string;
  phone: string | null;
  examCode: string | null;
  hasAccount: boolean;
  /** Soru + deneme giriş sayısı — hangi kaydın "dolu" olduğunu gösterir. */
  entryCount: number;
  createdAt: Date;
};

export type DuplicateGroup = {
  /** Grubu tekilleştiren anahtar (normalize telefon ya da normalize ad). */
  key: string;
  kind: "phone" | "name";
  label: string;
  students: DuplicateStudent[];
};

/** Türkçe duyarlı ad normalizasyonu (İ/ı/ş… + boşluk farklarını siler). */
function foldName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Yinelenen öğrenci kayıtları (yönetici temizliği için):
 *  - `phone`: aynı numarada birden çok kayıt → giriş kırılır, ACİL.
 *  - `name`: numarası olmayan ama adı birebir aynı kayıtlar → muhtemel çift
 *    kayıt (Excel/CSV aktarımı iki kez düşmüş olabilir).
 * Gizlenen kayıtlar listelenmez.
 */
export async function getDuplicateGroups(): Promise<DuplicateGroup[]> {
  const db = getDb();

  const rows = await db
    .select({
      studentId: students.id,
      fullName: students.fullName,
      phone: students.phone,
      userId: students.userId,
      createdAt: students.createdAt,
    })
    .from(students)
    .where(isNull(students.deletedAt));

  const byPhone = new Map<string, typeof rows>();
  const byName = new Map<string, typeof rows>();
  for (const r of rows) {
    if (r.phone) {
      const key = normalizePhone(r.phone);
      if (!key) continue;
      byPhone.set(key, [...(byPhone.get(key) ?? []), r]);
    } else {
      const key = foldName(r.fullName);
      if (key.length < 2) continue;
      byName.set(key, [...(byName.get(key) ?? []), r]);
    }
  }

  const groupsRaw = [
    ...[...byPhone].filter(([, v]) => v.length > 1).map(([key, v]) => ({
      key,
      kind: "phone" as const,
      label: `0${key}`,
      rows: v,
    })),
    ...[...byName].filter(([, v]) => v.length > 1).map(([key, v]) => ({
      key,
      kind: "name" as const,
      label: v[0].fullName,
      rows: v,
    })),
  ];
  if (groupsRaw.length === 0) return [];

  const ids = groupsRaw.flatMap((g) => g.rows.map((r) => r.studentId));

  // D1: `in (…)` başına 100 parametre — kadro büyüdükçe parçalanır.
  const [enrollmentRows, qCounts, mCounts] = await Promise.all([
    selectInChunks(ids, (part) =>
      db
        .select({
          studentId: enrollments.studentId,
          status: enrollments.status,
          examCode: examTemplates.code,
        })
        .from(enrollments)
        .innerJoin(
          examTemplates,
          eq(examTemplates.id, enrollments.examTemplateId),
        )
        .where(inArray(enrollments.studentId, part)),
    ),
    selectInChunks(ids, (part) =>
      db
        .select({
          studentId: enrollments.studentId,
          n: sql<number>`count(*)`,
        })
        .from(questionLogs)
        .innerJoin(enrollments, eq(enrollments.id, questionLogs.enrollmentId))
        .where(inArray(enrollments.studentId, part))
        .groupBy(enrollments.studentId),
    ),
    selectInChunks(ids, (part) =>
      db
        .select({
          studentId: enrollments.studentId,
          n: sql<number>`count(*)`,
        })
        .from(mockExams)
        .innerJoin(enrollments, eq(enrollments.id, mockExams.enrollmentId))
        .where(inArray(enrollments.studentId, part))
        .groupBy(enrollments.studentId),
    ),
  ]);

  const examBy = new Map<number, string>();
  for (const e of enrollmentRows) {
    // Aktif kayıt öncelikli; yoksa ilk bulunan.
    if (e.status === "active" || !examBy.has(e.studentId)) {
      examBy.set(e.studentId, e.examCode);
    }
  }
  const countBy = new Map<number, number>();
  for (const c of [...qCounts, ...mCounts]) {
    countBy.set(c.studentId, (countBy.get(c.studentId) ?? 0) + Number(c.n));
  }

  return groupsRaw
    .map((g) => ({
      key: g.key,
      kind: g.kind,
      label: g.label,
      students: g.rows
        .map((r) => ({
          studentId: r.studentId,
          fullName: r.fullName,
          phone: r.phone,
          examCode: examBy.get(r.studentId) ?? null,
          hasAccount: r.userId != null,
          entryCount: countBy.get(r.studentId) ?? 0,
          createdAt: r.createdAt,
        }))
        /*
         * Önerilen "kalacak" kayıt en üstte: EN ÇOK VERİSİ olan. Giriş hesabı
         * ölçüt değil — birleştirme hesabı zaten kalan kayda taşıyor; asıl
         * kayıp riski taşınamayan veri değil, yanlış kaydın seçilmesi.
         */
        .sort(
          (a, b) =>
            b.entryCount - a.entryCount ||
            Number(b.hasAccount) - Number(a.hasAccount) ||
            a.studentId - b.studentId,
        ),
    }))
    .sort(
      (a, b) =>
        // Telefon çakışmaları önce (giriş kıran gerçek hata).
        Number(b.kind === "phone") - Number(a.kind === "phone") ||
        a.label.localeCompare(b.label, "tr"),
    );
}

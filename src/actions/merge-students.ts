"use server";

import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getDb } from "@/db";
import { enrollments, sessions, students, users } from "@/db/schema";
import { syncLoginPhone } from "@/lib/auth-identity";
import {
  actionError,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

/**
 * `enrollment_id` taşıyan TÜM tablolar (bkz. src/db/schema.ts). Takip verisi
 * öğrenciye değil KAYDA bağlı olduğu için birleştirme bu tabloları taşır.
 * Yeni bir enrollment-scoped tablo eklendiğinde buraya da eklenmeli.
 */
const ENROLLMENT_TABLES = [
  "resources",
  "subject_assignments",
  "weekly_plans",
  "question_logs",
  "study_logs",
  "mock_exams",
  "topic_resource_progress",
  "coaching_sessions",
  "content_visibility",
  "content_views",
  "fee_plans",
  "invoices",
  "payments",
  "payment_notices",
  "transcripts",
  "ai_proposals",
  "chat_threads",
  "ai_audit_log",
] as const;

const mergeSchema = z
  .object({
    keepStudentId: z.coerce.number().int().positive(),
    dropStudentId: z.coerce.number().int().positive(),
  })
  .refine((v) => v.keepStudentId !== v.dropStudentId, {
    message: "Aynı kayıt kendisiyle birleştirilemez.",
  });

export type MergeResult = {
  keepStudentId: number;
  keepName: string;
  dropName: string;
  /** Taşınan satır sayısı (tüm takip tabloları toplamı). */
  movedRows: number;
  /** Aynı gün+ders çakışmasında toplanan soru kaydı sayısı. */
  summedQuestionLogs: number;
  /** Kalacak kayıtta zaten aynısı olduğu için atılan satır sayısı. */
  droppedRows: number;
};

/**
 * Yönetici: aynı kişiye ait iki öğrenci kaydını BİRLEŞTİRİR.
 *
 * Neden gerekli: telefon eşsiz olmadığı için aynı numarayla ikinci kayıt
 * açılabiliyordu. Öğrencinin verisi ikiye bölünüyor, giriş hesabı kayıtlardan
 * yalnız birine bağlanıyor, koç PIN'i diğerine sıfırlayınca öğrenci giremiyordu.
 *
 * Ne yapar: `dropStudentId` kaydının tüm takip verisini `keepStudentId`
 * kaydının aktif kayıt satırına (enrollment) taşır, boş kalan profil alanlarını
 * doldurur, giriş hesabını tek hesapta toplar ve eski kaydı gizler (soft-delete
 * — satır DB'de kalır). Aynı anahtardaki çakışmalarda kalan kayıt kazanır;
 * soru kayıtlarında (gün+ders) sayılar TOPLANIR, silinmez.
 */
export async function mergeStudents(
  input: unknown,
): Promise<ActionResult<MergeResult>> {
  return guarded<MergeResult>(async () => {
    await requireAdmin();
    const parsed = mergeSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? "Geçersiz birleştirme isteği.",
      );
    }
    const { keepStudentId, dropStudentId } = parsed.data;
    const db = getDb();

    const keep = await db.query.students.findFirst({
      where: eq(students.id, keepStudentId),
    });
    const drop = await db.query.students.findFirst({
      where: eq(students.id, dropStudentId),
    });
    if (!keep || !drop) return actionError("Öğrenci kaydı bulunamadı.");
    if (drop.deletedAt) return actionError("Bu kayıt zaten gizlenmiş.");

    const now = new Date();

    const keepEnrollments = await db
      .select({ id: enrollments.id, status: enrollments.status })
      .from(enrollments)
      .where(eq(enrollments.studentId, keepStudentId))
      .orderBy(desc(enrollments.id));
    const dropEnrollments = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(eq(enrollments.studentId, dropStudentId))
      .orderBy(desc(enrollments.id));

    let movedRows = 0;
    let droppedRows = 0;
    let summedQuestionLogs = 0;

    const target =
      keepEnrollments.find((e) => e.status === "active") ?? keepEnrollments[0];

    if (dropEnrollments.length > 0) {
      if (!target) {
        // Kalan kaydın hiç kayıt satırı yok → eskinin kayıtlarını olduğu gibi
        // devral (veri taşımaya gerek yok).
        await db
          .update(enrollments)
          .set({ studentId: keepStudentId, updatedAt: now })
          .where(eq(enrollments.studentId, dropStudentId));
      } else {
        const fromIds = dropEnrollments.map((e) => e.id).join(",");

        // Soru kayıtları: (kayıt, gün, ders) eşsiz. Çakışanları SİLMEK yerine
        // kalan satırın üzerine TOPLA — soru hacmi bu sistemin ana metriği.
        const sumCol = (col: string) =>
          `CASE WHEN k.${col} IS NULL AND (SELECT SUM(d.${col}) FROM question_logs d WHERE d.enrollment_id IN (${fromIds}) AND d.log_date = k.log_date AND d.subject_id = k.subject_id) IS NULL THEN NULL ELSE COALESCE(k.${col}, 0) + COALESCE((SELECT SUM(d.${col}) FROM question_logs d WHERE d.enrollment_id IN (${fromIds}) AND d.log_date = k.log_date AND d.subject_id = k.subject_id), 0) END`;
        const summed = await db.run(
          sql.raw(
            `UPDATE question_logs AS k SET
               question_count = ${sumCol("question_count")},
               correct_count = ${sumCol("correct_count")},
               wrong_count = ${sumCol("wrong_count")},
               blank_count = ${sumCol("blank_count")},
               updated_at = ${Math.floor(now.getTime() / 1000)}
             WHERE k.enrollment_id = ${target.id}
               AND EXISTS (SELECT 1 FROM question_logs d
                           WHERE d.enrollment_id IN (${fromIds})
                             AND d.log_date = k.log_date
                             AND d.subject_id = k.subject_id)`,
          ),
        );
        summedQuestionLogs = rowsWritten(summed);

        for (const table of ENROLLMENT_TABLES) {
          // OR IGNORE: eşsiz anahtar çakışırsa (aynı hafta planı, aynı ders
          // ataması…) kalan kaydın satırı korunur.
          const moved = await db.run(
            sql.raw(
              `UPDATE OR IGNORE "${table}" SET enrollment_id = ${target.id} WHERE enrollment_id IN (${fromIds})`,
            ),
          );
          movedRows += rowsWritten(moved);
          // Taşınamayanlar tanım gereği kopya → eski kayıt silinebilsin diye kaldır.
          const dropped = await db.run(
            sql.raw(
              `DELETE FROM "${table}" WHERE enrollment_id IN (${fromIds})`,
            ),
          );
          droppedRows += rowsWritten(dropped);
        }

        await db
          .delete(enrollments)
          .where(eq(enrollments.studentId, dropStudentId));
      }
    }

    // --- profil: kalan kayıtta BOŞ olan alanları eskisinden doldur ---
    const fill: Record<string, unknown> = {};
    const carry = [
      "phone",
      "parentPhone",
      "grade",
      "field",
      "school",
      "dershane",
      "email",
      "telegram",
      "city",
    ] as const;
    for (const key of carry) {
      if (keep[key] == null && drop[key] != null) fill[key] = drop[key];
    }
    if (keep.birthYear == null && drop.birthYear != null) {
      fill.birthYear = drop.birthYear;
    }
    if (drop.notes) {
      fill.notes = [keep.notes, drop.notes].filter(Boolean).join("\n");
    }

    // --- giriş hesabı: tek hesapta topla ---
    let keepUserId = keep.userId;
    if (!keepUserId && drop.userId) {
      keepUserId = drop.userId;
      fill.userId = drop.userId;
    } else if (keep.userId && drop.userId && keep.userId !== drop.userId) {
      // İki ayrı hesap: eskisini emekliye ayır — aynı telefonun iki girişi olamaz.
      await db.delete(sessions).where(eq(sessions.userId, drop.userId));
      await db
        .update(users)
        .set({
          email: `birlestirildi-${drop.userId}@ogrenci.dereceninruhu.local`,
          phoneNumber: null,
          updatedAt: now,
        })
        .where(eq(users.id, drop.userId));
    }

    if (Object.keys(fill).length > 0) {
      await db
        .update(students)
        .set({ ...fill, updatedAt: now })
        .where(eq(students.id, keepStudentId));
    }

    // Giriş kimliğini birleşmiş kaydın telefonuna eşitle.
    const finalPhone = (fill.phone as string | undefined) ?? keep.phone;
    if (keepUserId && finalPhone) {
      const synced = await syncLoginPhone(db, keepUserId, finalPhone);
      if (!synced.ok) return actionError(synced.error);
    }

    // --- eski kaydı gizle (veri silinmez) ---
    await db
      .update(students)
      .set({
        userId: null,
        deletedAt: now,
        status: "inactive",
        inviteCode: null,
        notes: [
          drop.notes,
          `#${dropStudentId} kaydı #${keepStudentId} (${keep.fullName}) ile birleştirildi.`,
        ]
          .filter(Boolean)
          .join("\n"),
        updatedAt: now,
      })
      .where(eq(students.id, dropStudentId));

    revalidatePath("/koc/ogrenciler");
    revalidatePath(`/koc/ogrenciler/${keepStudentId}`);
    revalidatePath("/koc");

    return {
      ok: true,
      data: {
        keepStudentId,
        keepName: keep.fullName,
        dropName: drop.fullName,
        movedRows,
        summedQuestionLogs,
        droppedRows,
      },
    };
  });
}

/** D1 `meta.changes` — sürücüler arasında adı değişebildiği için savunmacı okuma. */
function rowsWritten(res: unknown): number {
  const meta = (res as { meta?: { changes?: number; rows_written?: number } })
    ?.meta;
  return Number(meta?.changes ?? meta?.rows_written ?? 0);
}


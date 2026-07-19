"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb } from "@/db";
import { enrollments, examTemplates, students, tracks } from "@/db/schema";
import { normalizePhone } from "@/lib/phone";
import { parseRosterCsv } from "@/lib/csv";
import {
  importRosterSchema,
  mapRosterStatus,
  rosterRowSchema,
  type RosterRowInput,
} from "@/lib/validation-import";
import {
  actionError,
  guarded,
  requireAdmin,
  type ActionResult,
} from "@/actions/_guard";

export type ImportError = { lineNo: number; message: string };

export type ImportSummary = {
  committed: boolean;
  createCount: number;
  updateCount: number;
  deactivateCount: number;
  phonelessCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: ImportError[];
  unknownHeaders: string[];
  createSamples: string[];
  deactivateSamples: string[];
  phonelessSamples: string[];
};

function newInviteCode(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

/** Diakritik/Türkçe büyük-küçük farklarını temizleyip durum kelimesini eşler. */
function foldStatus(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw
    .trim()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  const map: Record<string, string> = {
    aktif: "aktif",
    active: "aktif",
    pasif: "pasif",
    passive: "pasif",
    inactive: "pasif",
    mezun: "mezun",
    alumni: "mezun",
    graduate: "mezun",
    graduated: "mezun",
  };
  return map[s] ?? s; // bilinmeyen değer geçer → zod hata verir
}

type ResolvedRow = {
  lineNo: number;
  row: RosterRowInput;
  phone: string; // 10 hane
  examTemplateId: number;
  trackId: number | null;
};

/**
 * Yönetici — CSV kadro içe aktarımı + eşitleme. Telefonla upsert; listede
 * OLMAYAN aktif öğrenciler pasife alınır. İki aşamalı: commit:false önizleme
 * (yazma yok), commit:true uygular. `enrollments_one_active_per_student_uq`
 * korunur (tek aktif kayıt), telefonsuz öğrenciler asla pasife alınmaz.
 */
export async function importRoster(
  input: unknown,
): Promise<ActionResult<ImportSummary>> {
  return guarded(async () => {
    await requireAdmin();
    const parsed = importRosterSchema.safeParse(input);
    if (!parsed.success) return actionError("Geçersiz istek.");
    const { csv, commit } = parsed.data;

    const { rows: csvRows, unknownHeaders } = parseRosterCsv(csv);
    if (csvRows.length === 0) {
      return actionError("CSV'de veri satırı bulunamadı.");
    }

    const db = getDb();

    // --- referans veriler (sınav şablonu + alan id'leri) ---
    const templateRows = await db
      .select({ id: examTemplates.id, code: examTemplates.code })
      .from(examTemplates);
    const templateByCode = new Map(templateRows.map((t) => [t.code, t.id]));
    const trackRows = await db
      .select({
        id: tracks.id,
        code: tracks.code,
        examTemplateId: tracks.examTemplateId,
      })
      .from(tracks);
    const trackByKey = new Map(
      trackRows.map((t) => [`${t.examTemplateId}:${t.code}`, t.id]),
    );

    // --- satırları doğrula + çöz ---
    const errors: ImportError[] = [];
    const imported = new Map<string, ResolvedRow>();
    let duplicateCount = 0;

    for (const { lineNo, values } of csvRows) {
      const candidate = {
        fullName: values.fullName,
        phone: values.phone,
        examCode: values.examCode?.toUpperCase(),
        trackCode: values.trackCode?.toUpperCase() || undefined,
        targetText: values.targetText || undefined,
        grade: values.grade || undefined,
        status: foldStatus(values.status),
      };
      const res = rosterRowSchema.safeParse(candidate);
      if (!res.success) {
        errors.push({
          lineNo,
          message: res.error.issues.map((i) => i.message).join(" "),
        });
        continue;
      }
      const row = res.data;

      const examTemplateId = templateByCode.get(row.examCode);
      if (!examTemplateId) {
        errors.push({ lineNo, message: `Sınav bulunamadı: ${row.examCode}` });
        continue;
      }
      let trackId: number | null = null;
      if (row.trackCode) {
        const tid = trackByKey.get(`${examTemplateId}:${row.trackCode}`);
        if (!tid) {
          errors.push({
            lineNo,
            message: `Alan bulunamadı: ${row.examCode}/${row.trackCode}`,
          });
          continue;
        }
        trackId = tid;
      }

      const phone = normalizePhone(row.phone);
      if (imported.has(phone)) duplicateCount++;
      imported.set(phone, { lineNo, row, phone, examTemplateId, trackId });
    }

    // --- mevcut öğrenciler + kayıtlar ---
    const studentRows = await db
      .select({
        id: students.id,
        fullName: students.fullName,
        phone: students.phone,
        userId: students.userId,
        status: students.status,
      })
      .from(students);
    const enrollmentRows = await db
      .select({
        id: enrollments.id,
        studentId: enrollments.studentId,
        status: enrollments.status,
      })
      .from(enrollments);

    const activeEnrByStudent = new Map<number, number>();
    const pausedEnrByStudent = new Map<number, number[]>();
    for (const e of enrollmentRows) {
      if (e.status === "active") activeEnrByStudent.set(e.studentId, e.id);
      else if (e.status === "paused") {
        const arr = pausedEnrByStudent.get(e.studentId) ?? [];
        arr.push(e.id);
        pausedEnrByStudent.set(e.studentId, arr);
      }
    }

    type ExistingStudent = (typeof studentRows)[number];
    const existingByPhone = new Map<string, ExistingStudent[]>();
    for (const s of studentRows) {
      if (!s.phone) continue;
      const key = normalizePhone(s.phone);
      const arr = existingByPhone.get(key) ?? [];
      arr.push(s);
      existingByPhone.set(key, arr);
    }

    // --- planı çıkar ---
    const toCreate: ResolvedRow[] = [];
    const toUpdate: { student: ExistingStudent; entry: ResolvedRow }[] = [];
    for (const [phone, entry] of imported) {
      const matches = existingByPhone.get(phone);
      if (!matches || matches.length === 0) {
        toCreate.push(entry);
        continue;
      }
      const target =
        matches.find((m) => m.userId != null) ??
        matches.reduce((a, b) => (b.id > a.id ? b : a));
      toUpdate.push({ student: target, entry });
    }

    // Eşitleme: listede olmayan AKTİF (aktif kayıtlı) öğrenciler pasife.
    const toDeactivate: ExistingStudent[] = [];
    const phoneless: ExistingStudent[] = [];
    for (const s of studentRows) {
      if (s.status !== "active" || !activeEnrByStudent.has(s.id)) continue;
      if (!s.phone) {
        phoneless.push(s);
        continue;
      }
      if (!imported.has(normalizePhone(s.phone))) toDeactivate.push(s);
    }

    const summary: ImportSummary = {
      committed: false,
      createCount: toCreate.length,
      updateCount: toUpdate.length,
      deactivateCount: toDeactivate.length,
      phonelessCount: phoneless.length,
      duplicateCount,
      errorCount: errors.length,
      errors: errors.slice(0, 30),
      unknownHeaders,
      createSamples: toCreate.slice(0, 8).map((r) => r.row.fullName),
      deactivateSamples: toDeactivate.slice(0, 8).map((s) => s.fullName),
      phonelessSamples: phoneless.slice(0, 8).map((s) => s.fullName),
    };

    if (!commit) return { ok: true, data: summary };

    // ----------------------------- COMMIT -----------------------------
    const now = new Date();

    for (const entry of toCreate) {
      const status = mapRosterStatus(entry.row.status);
      const [student] = await db
        .insert(students)
        .values({
          fullName: entry.row.fullName,
          phone: entry.phone,
          grade: entry.row.grade ?? null,
          inviteCode: newInviteCode(),
          status,
        })
        .returning({ id: students.id });
      await db.insert(enrollments).values({
        studentId: student.id,
        examTemplateId: entry.examTemplateId,
        trackId: entry.trackId,
        coachUserId: null,
        targetText: entry.row.targetText ?? null,
        startDate: now,
        status: status === "active" ? "active" : "paused",
      });
    }

    for (const { student, entry } of toUpdate) {
      const status = mapRosterStatus(entry.row.status);
      await db
        .update(students)
        .set({
          fullName: entry.row.fullName,
          phone: entry.phone,
          status,
          // grade/targetText yalnız CSV'de doluysa güncellenir (üzerine yazma yok).
          ...(entry.row.grade ? { grade: entry.row.grade } : {}),
          updatedAt: now,
        })
        .where(eq(students.id, student.id));

      const activeId = activeEnrByStudent.get(student.id);
      if (status === "active") {
        if (activeId) {
          await db
            .update(enrollments)
            .set({
              examTemplateId: entry.examTemplateId,
              trackId: entry.trackId,
              ...(entry.row.targetText
                ? { targetText: entry.row.targetText }
                : {}),
              updatedAt: now,
            })
            .where(eq(enrollments.id, activeId));
        } else {
          const paused = pausedEnrByStudent.get(student.id)?.[0];
          if (paused) {
            await db
              .update(enrollments)
              .set({
                examTemplateId: entry.examTemplateId,
                trackId: entry.trackId,
                ...(entry.row.targetText
                  ? { targetText: entry.row.targetText }
                  : {}),
                status: "active",
                updatedAt: now,
              })
              .where(eq(enrollments.id, paused));
          } else {
            await db.insert(enrollments).values({
              studentId: student.id,
              examTemplateId: entry.examTemplateId,
              trackId: entry.trackId,
              coachUserId: null,
              targetText: entry.row.targetText ?? null,
              startDate: now,
              status: "active",
            });
          }
        }
      } else if (activeId) {
        // pasif/mezun → aktif kaydı duraklat.
        await db
          .update(enrollments)
          .set({ status: "paused", updatedAt: now })
          .where(eq(enrollments.id, activeId));
      }
    }

    for (const s of toDeactivate) {
      await db
        .update(students)
        .set({ status: "inactive", updatedAt: now })
        .where(eq(students.id, s.id));
      await db
        .update(enrollments)
        .set({ status: "paused", updatedAt: now })
        .where(
          and(
            eq(enrollments.studentId, s.id),
            eq(enrollments.status, "active"),
          ),
        );
    }

    revalidatePath("/koc/ogrenciler");
    revalidatePath("/koc");
    return { ok: true, data: { ...summary, committed: true } };
  });
}

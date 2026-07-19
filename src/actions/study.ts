"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, getR2 } from "@/db";
import { studyLogs } from "@/db/schema";
import { startOfTrtDay } from "@/lib/dates";
import { createStudyLogSchema } from "@/lib/validation-study";
import {
  actionError,
  fieldErrorsOf,
  guarded,
  requireUser,
  type ActionResult,
} from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

/** İzin verilen kanıt görsel türleri → uzantı. */
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_PROOF_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Bir çalışma bloğu kaydı (kronometre "bitir" ya da manuel giriş). Her satır
 * bağımsız bir oturum; günlük toplam SUM ile. Öğrenci yalnız kendi kaydına.
 */
export async function createStudyLog(
  input: unknown,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const parsed = createStudyLogSchema.safeParse(input);
    if (!parsed.success) {
      return actionError("Geçersiz giriş.", fieldErrorsOf(parsed.error.issues));
    }
    const v = parsed.data;
    const db = getDb();
    await assertEnrollmentAccess(db, v.enrollmentId, user);

    const [row] = await db
      .insert(studyLogs)
      .values({
        enrollmentId: v.enrollmentId,
        logDate: startOfTrtDay(v.logDate),
        subjectId: v.subjectId ?? null,
        minutes: v.minutes,
        source: v.source,
        note: v.note?.trim() || null,
        proofKey: v.proofKey?.trim() || null,
      })
      .returning({ id: studyLogs.id });

    revalidatePath("/ogrenci/kronometre");
    revalidatePath("/ogrenci");
    return { ok: true, data: { id: row.id } };
  });
}

/** Yanlış girilen çalışma kaydını sil (sahibi ya da koç). Kanıt görselini de temizler. */
export async function deleteStudyLog(
  id: number,
): Promise<ActionResult<{ id: number }>> {
  return guarded(async () => {
    const user = await requireUser();
    const db = getDb();
    const row = await db.query.studyLogs.findFirst({
      where: eq(studyLogs.id, id),
    });
    if (!row) return actionError("Kayıt bulunamadı.");
    await assertEnrollmentAccess(db, row.enrollmentId, user);

    await db.delete(studyLogs).where(eq(studyLogs.id, id));
    if (row.proofKey) {
      // Best-effort — görsel silinmese de kayıt gitti.
      try {
        await getR2().delete(row.proofKey);
      } catch {
        // yut
      }
    }
    revalidatePath("/ogrenci/kronometre");
    revalidatePath("/ogrenci");
    return { ok: true, data: { id } };
  });
}

/**
 * Kanıt ekran görüntüsünü R2'ye yükler → dahili `/api/uploads/…` yolu döner.
 * Özel klasör: `study-proofs/{enrollmentId}/…` — servis yolu kimlik doğrular.
 */
export async function uploadStudyProof(
  formData: FormData,
): Promise<ActionResult<{ key: string; url: string }>> {
  return guarded(async () => {
    const user = await requireUser();
    const enrollmentId = Number(formData.get("enrollmentId"));
    if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
      return actionError("Kayıt bulunamadı.");
    }
    const db = getDb();
    await assertEnrollmentAccess(db, enrollmentId, user);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return actionError("Dosya bulunamadı.");
    }
    if (file.size > MAX_PROOF_BYTES) {
      return actionError("Görsel en fazla 5 MB olabilir.");
    }
    const ext = IMAGE_EXT[file.type];
    if (!ext) {
      return actionError("Yalnız görsel yükleyebilirsin (JPG, PNG, WebP).");
    }
    const key = `study-proofs/${enrollmentId}/${crypto.randomUUID()}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await getR2().put(key, bytes, { httpMetadata: { contentType: file.type } });
    return { ok: true, data: { key, url: `/api/uploads/${key}` } };
  });
}

import { eq } from "drizzle-orm";

import { getDb, getR2 } from "@/db";
import { transcripts } from "@/db/schema";
import { requireCoach } from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

// R2'ye yazar; her istek taze işlenir.
export const dynamic = "force-dynamic";

// Canlı mikrofon kaydı (webm/opus ~24 kbps) → 1 saat ≈ 11 MB. Server Action
// gövde sınırından (8 MB) kaçınmak için bu route handler kullanılır; Workers
// istek gövdesi limiti bunun çok üstünde. Yine de makul bir tavan koyuyoruz.
const MAX_AUDIO_BYTES = 80 * 1024 * 1024;

/**
 * Canlı transkriptin ses parçasını R2'ye yükler.
 * Anahtar: `transcripts/{id}/live-{index}.{webm|mp4}`; `audioR2Key` prefix'i
 * (yoksa) ayarlanır. YALNIZ koç/yönetici ve ilgili enrollment'a erişimi olan.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const transcriptId = Number(id);
  if (!Number.isInteger(transcriptId) || transcriptId <= 0) {
    return Response.json({ ok: false, error: "Geçersiz transkript." }, { status: 400 });
  }

  let user;
  try {
    user = await requireCoach();
  } catch {
    return Response.json({ ok: false, error: "Yetkisiz." }, { status: 401 });
  }

  const db = getDb();
  const t = await db.query.transcripts.findFirst({
    where: eq(transcripts.id, transcriptId),
  });
  if (!t) {
    return Response.json({ ok: false, error: "Transkript bulunamadı." }, { status: 404 });
  }
  try {
    await assertEnrollmentAccess(db, t.enrollmentId, user);
  } catch {
    return Response.json({ ok: false, error: "Yetkisiz." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Dosya yok." }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return Response.json({ ok: false, error: "Kayıt çok büyük." }, { status: 413 });
  }

  const idxRaw = Number(form.get("index"));
  const index = Number.isInteger(idxRaw) && idxRaw >= 0 ? idxRaw : 0;
  const ext = (file.type || "").includes("mp4") ? "mp4" : "webm";
  // Zaman damgası öneki: tekrar-açıp-sürdürme (append) turlarında index 0'dan
  // başladığı için çakışmayı önler; sözlüksel sıralama = kronolojik sıra.
  const stamp = String(Date.now());
  const key = `transcripts/${transcriptId}/live-${stamp}-${String(index).padStart(3, "0")}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  await getR2().put(key, bytes, {
    httpMetadata: { contentType: file.type || "audio/webm" },
  });

  if (!t.audioR2Key) {
    await db
      .update(transcripts)
      .set({ audioR2Key: `transcripts/${transcriptId}/`, updatedAt: new Date() })
      .where(eq(transcripts.id, transcriptId));
  }

  return Response.json({ ok: true, data: { key } });
}

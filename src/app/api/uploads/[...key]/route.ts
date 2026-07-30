import { eq } from "drizzle-orm";

import { getDb, getR2 } from "@/db";
import { transcripts } from "@/db/schema";
import { requireCoach, requireUser } from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

// R2'den okunur → istek başına, önbelleğe alınmaz (obje içeriği CDN'de cachelenir).
export const dynamic = "force-dynamic";

function notFound() {
  return new Response("Not found", { status: 404 });
}

/**
 * R2 dosyalarını servis eder. Önekler:
 *  - `profiles/…`     → herkese açık (koç profil görselleri), uzun cache.
 *  - `study-proofs/…` → ÖZEL çalışma kanıtları; yalnız kaydın sahibi öğrenci
 *    veya koç/yönetici görebilir (anahtar: study-proofs/{enrollmentId}/…).
 *  - `transcripts/…`  → ÖZEL görüşme ses kayıtları; YALNIZ koç/yönetici ve
 *    transkriptin enrollment'ına erişimi olan (anahtar: transcripts/{id}/…).
 *  - `content/…`      → İçerik kütüphanesi dosyaları; oturum açmış herkes
 *    (kütüphane zaten tüm öğrencilere açık, anahtarlar tahmin edilemez).
 * Başka hiçbir önek bu yoldan sızmaz.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;
  const objectKey = key.join("/");
  if (objectKey.includes("..")) return notFound();

  const isProfile = objectKey.startsWith("profiles/");
  const isProof = objectKey.startsWith("study-proofs/");
  const isTranscript = objectKey.startsWith("transcripts/");
  const isContent = objectKey.startsWith("content/");
  if (!isProfile && !isProof && !isTranscript && !isContent) return notFound();

  if (isContent) {
    // İçerik kütüphanesi: oturum yeterli (öğrenci/koç). Anonim erişim yok.
    try {
      await requireUser();
    } catch {
      return notFound();
    }
  }

  if (isProof) {
    const enrollmentId = Number(key[1]);
    if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) return notFound();
    try {
      const user = await requireUser();
      await assertEnrollmentAccess(getDb(), enrollmentId, user);
    } catch {
      return notFound();
    }
  }

  if (isTranscript) {
    const transcriptId = Number(key[1]);
    if (!Number.isInteger(transcriptId) || transcriptId <= 0) return notFound();
    try {
      // Görüşme sesi hassastır → YALNIZ koç/yönetici (öğrenciye açık değil).
      const user = await requireCoach();
      const db = getDb();
      const t = await db.query.transcripts.findFirst({
        where: eq(transcripts.id, transcriptId),
        columns: { enrollmentId: true },
      });
      if (!t) return notFound();
      await assertEnrollmentAccess(db, t.enrollmentId, user);
    } catch {
      return notFound();
    }
  }

  const obj = await getR2().get(objectKey);
  if (!obj) return notFound();

  const headers = new Headers();
  headers.set(
    "Content-Type",
    obj.httpMetadata?.contentType ?? "application/octet-stream",
  );
  headers.set(
    "Cache-Control",
    isProof || isTranscript
      ? "private, no-store"
      : isContent
        ? "private, max-age=3600"
        : "public, max-age=31536000, immutable",
  );
  const disposition = obj.httpMetadata?.contentDisposition;
  if (isContent && disposition) {
    headers.set("Content-Disposition", disposition);
  }
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
  return new Response(obj.body as ReadableStream, { headers });
}

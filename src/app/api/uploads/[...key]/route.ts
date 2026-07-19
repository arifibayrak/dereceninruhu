import { getDb, getR2 } from "@/db";
import { requireUser } from "@/actions/_guard";
import { assertEnrollmentAccess } from "@/actions/_access";

// R2'den okunur → istek başına, önbelleğe alınmaz (obje içeriği CDN'de cachelenir).
export const dynamic = "force-dynamic";

function notFound() {
  return new Response("Not found", { status: 404 });
}

/**
 * R2 dosyalarını servis eder. İki önek:
 *  - `profiles/…`     → herkese açık (koç profil görselleri), uzun cache.
 *  - `study-proofs/…` → ÖZEL çalışma kanıtları; yalnız kaydın sahibi öğrenci
 *    veya koç/yönetici görebilir (anahtar: study-proofs/{enrollmentId}/…).
 * Başka hiçbir önek (ör. `transcripts/…`) bu yoldan sızmaz.
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
  if (!isProfile && !isProof) return notFound();

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

  const obj = await getR2().get(objectKey);
  if (!obj) return notFound();

  const headers = new Headers();
  headers.set(
    "Content-Type",
    obj.httpMetadata?.contentType ?? "application/octet-stream",
  );
  headers.set(
    "Cache-Control",
    isProof ? "private, no-store" : "public, max-age=31536000, immutable",
  );
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
  return new Response(obj.body as ReadableStream, { headers });
}

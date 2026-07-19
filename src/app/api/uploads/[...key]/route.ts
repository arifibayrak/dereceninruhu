import { getR2 } from "@/db";

// R2'den okunur → istek başına, önbelleğe alınmaz (obje içeriği CDN'de cachelenir).
export const dynamic = "force-dynamic";

/**
 * Herkese açık profil görsellerini R2'den servis eder (`/api/uploads/profiles/…`).
 * GÜVENLİK: yalnız `profiles/` önekli anahtarlar döner — transkript ses
 * kayıtları (`transcripts/…`) vb. bu yoldan ASLA sızmaz.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;
  const objectKey = key.join("/");
  if (!objectKey.startsWith("profiles/") || objectKey.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const obj = await getR2().get(objectKey);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set(
    "Content-Type",
    obj.httpMetadata?.contentType ?? "application/octet-stream",
  );
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (obj.httpEtag) headers.set("ETag", obj.httpEtag);
  return new Response(obj.body as ReadableStream, { headers });
}

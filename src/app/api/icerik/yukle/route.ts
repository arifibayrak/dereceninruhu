import { getR2 } from "@/db";
import { requireCoach } from "@/actions/_guard";
import {
  MAX_CONTENT_FILE_BYTES,
  formatFileSize,
  uploadExtFor,
} from "@/lib/content";

/**
 * İçerik kütüphanesi dosya yükleme uçları — koç/yönetici, `content/…` önekine.
 *
 * Neden Server Action değil: aksiyon gövde sınırı (next.config, 8 MB) tüm
 * aksiyonlar için geçerli; PDF/doküman için ayrı bir uç daha güvenli.
 * Dosya `/api/uploads/content/…` üzerinden (oturum şart) servis edilir.
 */
export const dynamic = "force-dynamic";

function bad(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  // Çerez tabanlı POST → basit origin kontrolü (SameSite'a ek savunma).
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) {
    return bad("Geçersiz istek.", 403);
  }

  try {
    await requireCoach();
  } catch {
    return bad("Bu işlem için koç yetkisi gerekli.", 403);
  }

  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_CONTENT_FILE_BYTES) {
    return bad(
      `Dosya en fazla ${formatFileSize(MAX_CONTENT_FILE_BYTES)} olabilir.`,
      413,
    );
  }

  let file: unknown;
  try {
    const form = await req.formData();
    file = form.get("file");
  } catch {
    return bad("Dosya okunamadı.");
  }
  if (!(file instanceof File) || file.size === 0) {
    return bad("Dosya bulunamadı.");
  }
  if (file.size > MAX_CONTENT_FILE_BYTES) {
    return bad(
      `Dosya en fazla ${formatFileSize(MAX_CONTENT_FILE_BYTES)} olabilir.`,
      413,
    );
  }

  const ext = uploadExtFor(file.type, file.name);
  if (!ext) {
    return bad(
      "Bu dosya türü desteklenmiyor (PDF, Office belgeleri, görsel, ses/video).",
    );
  }

  const key = `content/${crypto.randomUUID()}.${ext}`;
  const contentType =
    file.type && file.type !== "application/octet-stream"
      ? file.type
      : "application/octet-stream";
  const bytes = new Uint8Array(await file.arrayBuffer());
  await getR2().put(key, bytes, {
    httpMetadata: {
      contentType,
      // Tarayıcıda açılsın; indirilirse özgün adıyla insin (UTF-8 güvenli).
      contentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(
        file.name,
      )}`,
    },
  });

  return Response.json({
    ok: true,
    data: {
      fileKey: key,
      fileName: file.name,
      fileSize: file.size,
      fileType: contentType,
      url: `/api/uploads/${key}`,
    },
  });
}

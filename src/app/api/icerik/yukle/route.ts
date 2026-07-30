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
 *
 * Neden multipart DEĞİL: `formData()` dosyanın tamamını belleğe alır, üstüne
 * `arrayBuffer()` bir kopya daha çıkarır — Worker'ın 128 MB izolat belleği
 * büyük dosyada patlar. Bunun yerine dosya HAM GÖVDE olarak gelir ve
 * `req.body` akışı doğrudan R2'ye bağlanır; bellekte tam kopya tutulmaz.
 * Dosya adı/türü başlıklarda taşınır.
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
  // R2'ye akış yazabilmek için uzunluk BİLİNMELİ; tarayıcı dosya gövdesinde
  // Content-Length'i hep gönderir, yoksa istek zaten kullanılamaz.
  if (!Number.isFinite(declared) || declared <= 0) {
    return bad("Dosya bulunamadı.");
  }
  if (declared > MAX_CONTENT_FILE_BYTES) {
    return bad(
      `Dosya en fazla ${formatFileSize(MAX_CONTENT_FILE_BYTES)} olabilir.`,
      413,
    );
  }

  // Dosya adı başlıkta URL-kodlu gelir (başlıklar ASCII; Türkçe ad bozulmasın).
  let fileName = "";
  try {
    fileName = decodeURIComponent(req.headers.get("x-file-name") ?? "").trim();
  } catch {
    return bad("Dosya adı okunamadı.");
  }
  if (!fileName) return bad("Dosya bulunamadı.");

  const declaredType = req.headers.get("content-type") ?? "";
  const ext = uploadExtFor(declaredType, fileName);
  if (!ext) {
    return bad(
      "Bu dosya türü desteklenmiyor (PDF, Office belgeleri, görsel, ses/video).",
    );
  }
  if (!req.body) return bad("Dosya bulunamadı.");

  const key = `content/${crypto.randomUUID()}.${ext}`;
  const contentType =
    declaredType && declaredType !== "application/octet-stream"
      ? declaredType
      : "application/octet-stream";

  // Akış doğrudan R2'ye — dosya bellekte toplanmaz.
  const object = await getR2().put(key, req.body, {
    httpMetadata: {
      contentType,
      // Tarayıcıda açılsın; indirilirse özgün adıyla insin (UTF-8 güvenli).
      contentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(
        fileName,
      )}`,
    },
  });
  // Boyut R2'nin yazdığı gerçek bayt sayısıdır — istemcinin beyanı değil.
  const fileSize = object?.size ?? declared;
  if (fileSize === 0) {
    await getR2().delete(key);
    return bad("Dosya boş.");
  }

  return Response.json({
    ok: true,
    data: {
      fileKey: key,
      fileName,
      fileSize,
      fileType: contentType,
      url: `/api/uploads/${key}`,
    },
  });
}

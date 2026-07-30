import { getR2 } from "@/db";
import { requireCoach } from "@/actions/_guard";
import {
  MAX_CONTENT_FILE_BYTES,
  UPLOAD_CHUNK_BYTES,
  formatFileSize,
  isContentKey,
  uploadExtFor,
} from "@/lib/content";

/**
 * İçerik kütüphanesi dosya yükleme ucu — koç/yönetici, `content/…` önekine.
 * Dosya `/api/uploads/content/…` üzerinden (oturum şart) servis edilir.
 *
 * Neden Server Action değil: aksiyon gövde sınırı (next.config, 8 MB) tüm
 * aksiyonlar için geçerli; PDF/doküman için ayrı bir uç daha güvenli.
 *
 * Neden `formData()` DEĞİL: dosyanın tamamını belleğe alır, üstüne
 * `arrayBuffer()` bir kopya daha çıkarır — Worker'ın 128 MB izolat belleği
 * büyük dosyada patlar. Dosya HAM GÖVDE olarak gelir, `req.body` akışı
 * doğrudan R2'ye bağlanır; ad/tür başlıklarda taşınır.
 *
 * İki mod (`faz` sorgu parametresi):
 *  - yok       → tek istekte yükleme (küçük dosya).
 *  - basla     → R2 multipart oturumu açar, `uploadId` döner.
 *  - parca     → tek parçayı yazar (ham gövde), `etag` döner.
 *  - bitir     → parçaları birleştirip nesneyi tamamlar.
 *  - iptal     → yarım kalan oturumu siler.
 * Parçalama, Cloudflare'in istek gövdesi limitini TEK DOSYANIN değil tek
 * PARÇANIN tavanı hâline getirir; 250 MB'lık dosya 50 MB'lık dilimlerle iner.
 */
export const dynamic = "force-dynamic";

function bad(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

/** Başlıktaki URL-kodlu dosya adı (başlıklar ASCII; Türkçe ad bozulmasın). */
function fileNameOf(req: Request): string | null {
  try {
    const raw = decodeURIComponent(req.headers.get("x-file-name") ?? "").trim();
    return raw || null;
  } catch {
    return null;
  }
}

/** Yüklenen dosyanın R2'deki adı + tarayıcıya dönecek başlık bilgisi. */
function objectMeta(fileName: string, contentType: string) {
  return {
    contentType,
    // Tarayıcıda açılsın; indirilirse özgün adıyla insin (UTF-8 güvenli).
    contentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(
      fileName,
    )}`,
  };
}

/** İstemcinin bildirdiği tür → saklanacak tür. */
function normalizeType(declaredType: string): string {
  return declaredType && declaredType !== "application/octet-stream"
    ? declaredType
    : "application/octet-stream";
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

  const faz = new URL(req.url).searchParams.get("faz");
  switch (faz) {
    case "basla":
      return startMultipart(req);
    case "parca":
      return uploadPart(req);
    case "bitir":
      return completeMultipart(req);
    case "iptal":
      return abortMultipart(req);
    case null:
      return singleShot(req);
    default:
      return bad("Geçersiz istek.");
  }
}

/* -------------------------------------------------------------------------- */
/*  Tek istekte yükleme (parça boyutunun altındaki dosyalar)                  */
/* -------------------------------------------------------------------------- */

async function singleShot(req: Request) {
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

  const fileName = fileNameOf(req);
  if (!fileName) return bad("Dosya bulunamadı.");

  const declaredType = req.headers.get("content-type") ?? "";
  const ext = uploadExtFor(declaredType, fileName);
  if (!ext) return bad(UNSUPPORTED);
  if (!req.body) return bad("Dosya bulunamadı.");

  const key = `content/${crypto.randomUUID()}.${ext}`;
  const contentType = normalizeType(declaredType);

  // Akış doğrudan R2'ye — dosya bellekte toplanmaz.
  const object = await getR2().put(key, req.body, {
    httpMetadata: objectMeta(fileName, contentType),
  });
  // Boyut R2'nin yazdığı gerçek bayt sayısıdır — istemcinin beyanı değil.
  const fileSize = object?.size ?? declared;
  if (fileSize === 0) {
    await getR2().delete(key);
    return bad("Dosya boş.");
  }

  return Response.json({
    ok: true,
    data: { fileKey: key, fileName, fileSize, fileType: contentType, url: urlOf(key) },
  });
}

const UNSUPPORTED =
  "Bu dosya türü desteklenmiyor (PDF, Office belgeleri, görsel, ses/video).";

const urlOf = (key: string) => `/api/uploads/${key}`;

/* -------------------------------------------------------------------------- */
/*  Parçalı yükleme                                                           */
/* -------------------------------------------------------------------------- */

/** `basla`: {fileName, fileType, fileSize} → {key, uploadId}. */
async function startMultipart(req: Request) {
  let body: { fileName?: unknown; fileType?: unknown; fileSize?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return bad("Geçersiz istek.");
  }
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const fileType = typeof body.fileType === "string" ? body.fileType : "";
  const fileSize = Number(body.fileSize ?? 0);
  if (!fileName) return bad("Dosya bulunamadı.");
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return bad("Dosya bulunamadı.");
  }
  if (fileSize > MAX_CONTENT_FILE_BYTES) {
    return bad(
      `Dosya en fazla ${formatFileSize(MAX_CONTENT_FILE_BYTES)} olabilir.`,
      413,
    );
  }
  const ext = uploadExtFor(fileType, fileName);
  if (!ext) return bad(UNSUPPORTED);

  const key = `content/${crypto.randomUUID()}.${ext}`;
  const upload = await getR2().createMultipartUpload(key, {
    httpMetadata: objectMeta(fileName, normalizeType(fileType)),
  });
  return Response.json({
    ok: true,
    data: { key, uploadId: upload.uploadId, chunkBytes: UPLOAD_CHUNK_BYTES },
  });
}

/** Sorgudaki oturum bilgisi — her parçada doğrulanır (istemci uyduramasın). */
function sessionOf(req: Request) {
  const q = new URL(req.url).searchParams;
  const key = q.get("key") ?? "";
  const uploadId = q.get("uploadId") ?? "";
  if (!isContentKey(key) || !uploadId) return null;
  return { key, uploadId };
}

/** `parca`: ham gövde → {partNumber, etag}. */
async function uploadPart(req: Request) {
  const session = sessionOf(req);
  if (!session) return bad("Geçersiz istek.");

  const partNumber = Number(new URL(req.url).searchParams.get("parca") ?? "0");
  // R2: parça numarası 1..10000 arası olmalı.
  if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > 10_000) {
    return bad("Geçersiz parça.");
  }
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (!Number.isFinite(declared) || declared <= 0) return bad("Parça boş.");
  if (declared > UPLOAD_CHUNK_BYTES) {
    return bad(
      `Parça en fazla ${formatFileSize(UPLOAD_CHUNK_BYTES)} olabilir.`,
      413,
    );
  }
  if (!req.body) return bad("Parça boş.");

  const upload = getR2().resumeMultipartUpload(session.key, session.uploadId);
  try {
    const part = await upload.uploadPart(partNumber, req.body);
    return Response.json({
      ok: true,
      data: { partNumber: part.partNumber, etag: part.etag },
    });
  } catch {
    // Süresi dolmuş/iptal edilmiş oturum — istemci baştan başlamalı.
    return bad("Yükleme oturumu geçersiz. Dosyayı yeniden yükle.", 409);
  }
}

/** `bitir`: {key, uploadId, fileName, fileType, parts[]} → kayıt bilgisi. */
async function completeMultipart(req: Request) {
  const session = sessionOf(req);
  if (!session) return bad("Geçersiz istek.");

  let body: { fileName?: unknown; fileType?: unknown; parts?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return bad("Geçersiz istek.");
  }
  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  if (!fileName) return bad("Dosya bulunamadı.");
  if (!Array.isArray(body.parts) || body.parts.length === 0) {
    return bad("Parça bulunamadı.");
  }
  const parts: { partNumber: number; etag: string }[] = [];
  for (const raw of body.parts) {
    const p = raw as { partNumber?: unknown; etag?: unknown };
    const partNumber = Number(p.partNumber);
    const etag = typeof p.etag === "string" ? p.etag : "";
    if (!Number.isInteger(partNumber) || partNumber < 1 || !etag) {
      return bad("Parça bulunamadı.");
    }
    parts.push({ partNumber, etag });
  }
  // R2 parçaları sıralı bekler.
  parts.sort((a, b) => a.partNumber - b.partNumber);

  const upload = getR2().resumeMultipartUpload(session.key, session.uploadId);
  let object;
  try {
    object = await upload.complete(parts);
  } catch {
    return bad("Dosya birleştirilemedi. Yeniden yükle.", 409);
  }

  const contentType = normalizeType(
    typeof body.fileType === "string" ? body.fileType : "",
  );
  return Response.json({
    ok: true,
    data: {
      fileKey: session.key,
      fileName,
      fileSize: object.size,
      fileType: contentType,
      url: urlOf(session.key),
    },
  });
}

/** `iptal`: yarım kalan oturumu siler (istemci vazgeçince). */
async function abortMultipart(req: Request) {
  const session = sessionOf(req);
  if (!session) return bad("Geçersiz istek.");
  try {
    await getR2()
      .resumeMultipartUpload(session.key, session.uploadId)
      .abort();
  } catch {
    // Zaten yoksa sorun değil — amaç temizlik.
  }
  return Response.json({ ok: true, data: null });
}

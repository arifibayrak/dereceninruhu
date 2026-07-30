/** İçerik kütüphanesi saf yardımcıları — YouTube küçük resmi + tip etiketleri. */

export type ContentType = "video" | "pdf" | "doc" | "note" | "link";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: "Video",
  pdf: "PDF",
  doc: "Doküman",
  note: "Not",
  link: "Bağlantı",
};

/**
 * İçerik kaynağı: koç dosyayı cihazından yükleyebilir YA DA bağlantı
 * yapıştırabilir. Not türünde ikisi de zorunlu değildir.
 */
export type ContentSource = "upload" | "link";

/* ------------------------------- Dosyalar -------------------------------- */

/** Yüklenebilir dosya türleri: MIME → uzantı (sunucu doğrulaması + accept). */
export const UPLOAD_EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/vnd.oasis.opendocument.spreadsheet": "ods",
  "application/vnd.oasis.opendocument.presentation": "odp",
  "application/rtf": "rtf",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/markdown": "md",
  "application/zip": "zip",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
};

/** Tarayıcı MIME göndermezse (bazı .docx/.heic) uzantıdan karar veririz. */
const UPLOAD_EXTS = [...new Set(Object.values(UPLOAD_EXT_BY_MIME))];

/** `<input type="file" accept>` değeri. */
export const UPLOAD_ACCEPT = UPLOAD_EXTS.map((e) => `.${e}`).join(",");

/** Tek dosya üst sınırı — Worker isteği bunu bellekte tutar, abartma. */
export const MAX_CONTENT_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

/** Dosya adının son uzantısı (küçük harf, noktasız). */
export function fileExtOf(fileName: string): string {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(fileName.trim());
  return m ? m[1].toLowerCase() : "";
}

/**
 * Yüklemeye izin verilen uzantıyı döner; izinli değilse null.
 * Önce MIME'a, o boş/gövdesizse dosya adına bakar.
 */
export function uploadExtFor(
  mime: string | null | undefined,
  fileName: string,
): string | null {
  const byMime = mime ? UPLOAD_EXT_BY_MIME[mime.toLowerCase()] : undefined;
  if (byMime) return byMime;
  const ext = fileExtOf(fileName);
  return ext && UPLOAD_EXTS.includes(ext) ? ext : null;
}

/** Yüklenen dosyaya bakıp içerik türünü tahmin eder (form otomatik seçer). */
export function contentTypeForFile(
  mime: string | null | undefined,
  fileName: string,
): ContentType {
  const m = (mime ?? "").toLowerCase();
  const ext = uploadExtFor(mime, fileName) ?? fileExtOf(fileName);
  if (m.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext)) {
    return "video";
  }
  if (m === "application/pdf" || ext === "pdf") return "pdf";
  return "doc";
}

const sizeFmt = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

/** 2411724 → "2,3 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFmt.format(bytes / 1024)} KB`;
  return `${sizeFmt.format(bytes / (1024 * 1024))} MB`;
}

/** R2 anahtarını uygulama içi servis yoluna çevirir. */
export function contentFileUrl(fileKey: string): string {
  return `/api/uploads/${fileKey}`;
}

/** Açılacak adres: yüklenen dosya varsa o, yoksa dış bağlantı. */
export function contentHref(item: {
  url: string | null;
  fileKey?: string | null;
}): string | null {
  if (item.fileKey) return contentFileUrl(item.fileKey);
  return item.url ?? null;
}

/** YouTube URL'sinden video id'sini çıkarır (watch/youtu.be/embed/shorts/live). */
export function youtubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return /^[\w-]{6,}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id && /^[\w-]{6,}$/.test(id) ? id : null;
      }
      const m = u.pathname.match(/^\/(embed|shorts|live)\/([\w-]{6,})/);
      if (m) return m[2];
    }
    return null;
  } catch {
    return null;
  }
}

/** img.youtube.com küçük resmi (next.config'te izinli). 480×360. */
export function youtubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

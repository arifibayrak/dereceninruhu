/** İçerik kütüphanesi saf yardımcıları — YouTube küçük resmi + tip etiketleri. */

export type ContentType = "video" | "pdf" | "note" | "link";

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: "Video",
  pdf: "PDF",
  note: "Not",
  link: "Bağlantı",
};

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

import type { ExtSession } from "./api";

/**
 * Görüşme URL'sini karşılaştırılabilir bir anahtara indirger (Meet oda kodu /
 * Zoom toplantı no). Aktif sekme URL'sini planlı görüşmelere eşlemek için.
 */
export function meetingKey(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("meet.google")) {
      const code = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop();
      return code ? `meet:${code}` : null;
    }
    if (host.includes("zoom")) {
      const m = u.pathname.match(/\/j\/(\d+)/);
      return m ? `zoom:${m[1]}` : `zoom:${u.pathname}`;
    }
    return `${host}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/** Aktif sekme URL'siyle eşleşen planlı görüşmeyi bulur (yoksa null). */
export function matchSession(
  tabUrl: string | undefined,
  sessions: ExtSession[],
): ExtSession | null {
  const key = meetingKey(tabUrl);
  if (!key) return null;
  return sessions.find((s) => meetingKey(s.meetingUrl) === key) ?? null;
}

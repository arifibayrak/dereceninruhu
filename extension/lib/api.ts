// Derecenin Ruhu app API istemcisi (bearer token). Tipler app tarafındaki
// `src/lib/validation-ext.ts` ile birebir aynıdır (tek kaynak: app).

const DEFAULT_BASE = "https://dereceninruhu.com";

export type ExtStudent = {
  studentId: number;
  enrollmentId: number;
  fullName: string;
  examCode: string;
};

export type ExtSession = {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName: string;
  scheduledAt: string; // ISO
  meetingUrl: string | null;
  meetingProvider: string | null;
};

export type PickerData = { students: ExtStudent[]; sessions: ExtSession[] };

export type Settings = { token: string | null; baseUrl: string };

/** Son seçili öğrenci/görüşme — panel yeniden açılınca geri yüklenir. */
export type Selection = { enrollmentId: number | null; sessionId: number | null };

export async function getSettings(): Promise<Settings> {
  const local = await chrome.storage.local.get(["token", "baseUrl"]);
  let token = (local.token as string | undefined) ?? null;
  let baseUrl = (local.baseUrl as string | undefined) || DEFAULT_BASE;
  // Yerel depo temizlenmişse (tarayıcı "çıkışta veri temizle" vb.) sync
  // yedeğinden geri yükle — token'ı yeniden yapıştırmak gerekmesin.
  if (!token) {
    try {
      const synced = await chrome.storage.sync.get(["token", "baseUrl"]);
      if (synced.token) {
        token = synced.token as string;
        baseUrl = (synced.baseUrl as string | undefined) || baseUrl;
        await chrome.storage.local.set({ token, baseUrl }); // yerele geri yaz
      }
    } catch {
      // sync kapalı/kotasızsa sessiz geç.
    }
  }
  return { token, baseUrl };
}

export async function saveSettings(s: {
  token: string;
  baseUrl?: string;
}): Promise<void> {
  const token = s.token.trim();
  const baseUrl = (s.baseUrl?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
  await chrome.storage.local.set({ token, baseUrl });
  // En iyi çaba yedek: yerel depo temizlenirse getSettings buradan geri yükler.
  try {
    await chrome.storage.sync.set({ token, baseUrl });
  } catch {
    // yok say.
  }
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove("token");
  try {
    await chrome.storage.sync.remove("token");
  } catch {
    // yok say.
  }
}

export async function getSelection(): Promise<Selection> {
  const { enrollmentId, sessionId } = await chrome.storage.local.get([
    "enrollmentId",
    "sessionId",
  ]);
  return {
    enrollmentId: typeof enrollmentId === "number" ? enrollmentId : null,
    sessionId: typeof sessionId === "number" ? sessionId : null,
  };
}

export async function saveSelection(sel: Selection): Promise<void> {
  await chrome.storage.local.set({
    enrollmentId: sel.enrollmentId,
    sessionId: sel.sessionId,
  });
}

/** Kayıtlı token'ın maskeli önizlemesi (hatırlandığını göstermek için). */
export function maskToken(token: string | null): string {
  if (!token) return "";
  if (token.length <= 12) return "drx_…";
  return `${token.slice(0, 7)}…${token.slice(-4)}`;
}

async function api<T>(
  path: string,
  init: RequestInit,
  { token, baseUrl }: Settings,
): Promise<T> {
  if (!token) throw new Error("Önce eklentiyi bağla (token gerekli).");
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { ok?: boolean; error?: string })
    | null;
  if (!res.ok || !data || data.ok === false) {
    throw new Error(data?.error || `İstek başarısız (${res.status}).`);
  }
  return data as T;
}

export function fetchPickerData(settings: Settings): Promise<PickerData> {
  return api<PickerData>("/api/extension/sessions", { method: "GET" }, settings);
}

export function postTranscript(
  settings: Settings,
  body: {
    enrollmentId: number;
    coachingSessionId?: number | null;
    rawText: string;
    language?: string;
  },
): Promise<{ transcriptId: number; proposalCount: number; extractionFailed?: boolean }> {
  return api(
    "/api/extension/transcripts",
    { method: "POST", body: JSON.stringify({ ...body, source: "live" }) },
    settings,
  );
}

/** Onay/inceleme derin linki (studentId ile). */
export function transcriptLink(
  baseUrl: string,
  studentId: number,
  transcriptId: number,
): string {
  return `${baseUrl}/koc/ogrenciler/${studentId}/transkript/${transcriptId}`;
}

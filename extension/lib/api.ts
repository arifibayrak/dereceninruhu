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

export async function getSettings(): Promise<Settings> {
  const { token, baseUrl } = await chrome.storage.local.get(["token", "baseUrl"]);
  return { token: token ?? null, baseUrl: baseUrl || DEFAULT_BASE };
}

export async function saveSettings(s: {
  token: string;
  baseUrl?: string;
}): Promise<void> {
  await chrome.storage.local.set({
    token: s.token.trim(),
    baseUrl: (s.baseUrl?.trim() || DEFAULT_BASE).replace(/\/+$/, ""),
  });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove("token");
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

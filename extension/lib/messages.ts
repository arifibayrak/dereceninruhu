// Bağlamlar arası (side panel ↔ service worker ↔ offscreen) mesaj sözleşmesi.

export type SegmentKind = "final" | "partial";
export type CaptureState = "starting" | "running" | "stopped" | "error";

export type ExtMessage =
  // side panel → service worker (tabId null → yalnız mikrofon)
  | { type: "START_CAPTURE"; tabId: number | null }
  | { type: "STOP_CAPTURE" }
  // service worker → offscreen (streamId null → sekme sesi yok, yalnız mikrofon)
  | { type: "OFFSCREEN_START"; streamId: string | null }
  | { type: "OFFSCREEN_STOP" }
  // offscreen → side panel
  | { type: "SEGMENT"; text: string; kind: SegmentKind }
  | { type: "MODEL_PROGRESS"; status: string; progress: number }
  | { type: "CAPTURE_STATE"; state: CaptureState; error?: string };

export function sendMessage(msg: ExtMessage): void {
  // Yanıt beklemeyiz; kapalı bağlamda sessiz düşer.
  void chrome.runtime.sendMessage(msg).catch(() => {});
}

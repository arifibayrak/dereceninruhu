import { sendMessage, type ExtMessage } from "@/lib/messages";

/**
 * Service worker = orkestrasyon. Yan panel "Başlat" der → sekme sesi için
 * stream id alınır, offscreen belge açılır, id offscreen'e iletilir. Ağır iş
 * (WebGPU Whisper + ses) offscreen'de olur; SW yalnız yaşam döngüsünü yönetir.
 */

async function ensureOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) return;
  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: [chrome.offscreen.Reason.USER_MEDIA],
    justification:
      "Görüşme sesini cihazda canlı yazıya çevirmek için (ses saklanmaz).",
  });
}

function getTabStreamId(tabId: number): Promise<string> {
  // Callback tabanlı API'yi Promise'a sar (tip sürümünden bağımsız çalışsın).
  return new Promise<string>((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      const err = chrome.runtime.lastError;
      if (err || !streamId) {
        reject(new Error(err?.message ?? "Sekme sesi akışı alınamadı."));
      } else {
        resolve(streamId);
      }
    });
  });
}

async function startCapture(tabId: number): Promise<void> {
  await ensureOffscreen();
  const streamId = await getTabStreamId(tabId);
  sendMessage({ type: "OFFSCREEN_START", streamId });
}

async function closeOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument().catch(() => {});
  }
}

export default defineBackground(() => {
  // Eklenti simgesine tıklayınca yan panel açılsın.
  chrome.sidePanel
    ?.setPanelBehavior?.({ openPanelOnActionClick: true })
    .catch(() => {});

  chrome.runtime.onMessage.addListener(
    (msg: ExtMessage, _sender, sendResponse) => {
      if (msg?.type === "START_CAPTURE") {
        startCapture(msg.tabId).then(
          () => sendResponse({ ok: true }),
          (e: unknown) =>
            sendResponse({
              ok: false,
              error: e instanceof Error ? e.message : String(e),
            }),
        );
        return true; // async yanıt
      }
      if (msg?.type === "STOP_CAPTURE") {
        // Offscreen kalan tamponu son "final" olarak boşaltıp 'stopped' yollar;
        // onu görünce belgeyi kapatırız (aşağıda).
        sendMessage({ type: "OFFSCREEN_STOP" });
        sendResponse({ ok: true });
        return true;
      }
      if (msg?.type === "CAPTURE_STATE" && msg.state === "stopped") {
        void closeOffscreen();
      }
      return undefined;
    },
  );
});

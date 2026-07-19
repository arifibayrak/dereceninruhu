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

// Mikrofon birincil kaynaktır; sekme sesi EN İYİ ÇABA. tabCapture başarısızsa
// (yanlış sekme, chrome:// sayfası, yetki yok) HATA FIRLATMAYIZ — streamId=null
// gönderip yalnız-mikrofon başlatırız. Böylece WhatsApp / telefon / yüz yüze /
// başka platform fark etmeksizin mikrofonla çalışır.
async function startCapture(tabId: number | null): Promise<void> {
  await ensureOffscreen();
  let streamId: string | null = null;
  if (tabId != null) {
    try {
      streamId = await getTabStreamId(tabId);
    } catch {
      streamId = null; // sekme sesi alınamadı → yalnız mikrofon
    }
  }
  sendMessage({ type: "OFFSCREEN_START", streamId });
}

async function closeOffscreen(): Promise<void> {
  if (await chrome.offscreen.hasDocument()) {
    await chrome.offscreen.closeDocument().catch(() => {});
  }
}

export default defineBackground(() => {
  // Simge tıklamasını ELLE ele al. Tıklama, action "invocation"ıdır → tabCapture
  // için gereken `activeTab` yetkisini O SEKME için verir; ardından paneli o
  // sekmede açarız. `openPanelOnActionClick` modunda tıklama invocation
  // sayılmaz, activeTab verilmez ve tabCapture "bu sekmede yetkilenmedi" hatası
  // verir — bu yüzden onu KAPALI tutuyoruz ve onClicked kullanıyoruz.
  chrome.sidePanel
    ?.setPanelBehavior?.({ openPanelOnActionClick: false })
    .catch(() => {});

  chrome.action.onClicked.addListener((tab) => {
    if (tab.id != null) {
      // Bu çağrı kullanıcı hareketiyle (tıklama) yapıldığı için activeTab verilir.
      void chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  });

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

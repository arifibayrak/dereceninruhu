import { env, pipeline } from "@huggingface/transformers";
import { sendMessage, type ExtMessage } from "@/lib/messages";

/**
 * Cihaz-içi (WebGPU) canlı transkript. Ses YALNIZ burada işlenir; hiçbir yere
 * yazılmaz veya sunucuya gönderilmez. Sekme sesi + (varsa) mikrofon karıştırılıp
 * 16 kHz Float32 tampona toplanır; kayan pencere Whisper-Turbo'ya beslenir.
 *
 * Pencere modeli: tampon COMMIT_SECONDS'a ulaşınca metin "final" olarak işlenir
 * ve tampon ~CARRYOVER_SECONDS taşımayla sıfırlanır; arada her TICK_MS'de mevcut
 * (işlenmemiş) tampon "partial" olarak canlı gösterilir. Basit ve sınırlı iş
 * yükü; sınırda küçük sözcük tekrarları olabilir (README'de iyileştirme notu).
 */

env.allowLocalModels = false; // ağırlıklar HF hub CDN'inden
env.useBrowserCache = true; // model bir kez inip Cache Storage'da kalsın (tekrar inmesin)
// Model önbelleği depo baskısında atılmasın diye kalıcı depo iste (en iyi çaba).
// NOT: eklentiyi "kaldırıp yeniden ekleyince" bu önbellek de silinir → model
// yeniden iner. Yeni sürüm için "kaldır+yükle" yerine ↻ yeniden yükle kullan.
void navigator.storage?.persist?.()?.catch(() => {});
// MV3 uzak-kod yasağı: ONNX Runtime wasm dosyaları eklenti içinden yüklenir
// (public/ort/ altına `pnpm copy-ort` ile kopyalanır).
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("/ort/");
}

// Model seçimi — indirme boyutu ↔ Türkçe doğruluk dengesi. Tek yerden değiştir.
// Boyutlar YAKLAŞIKTIR (ilk kullanımda bir kez inip tarayıcı önbelleğine alınır;
// sonra anında ve çevrimdışı):
//   whisper-base           + {enc fp16, dec q4} ≈ ~70 MB   (en küçük/hızlı; TR orta)
//   whisper-small          + {enc fp16, dec q4} ≈ ~250 MB  (TR belirgin daha iyi)
//   whisper-large-v3-turbo + fp16               ≈ ~800 MB+ (en yüksek doğruluk)
// `encoder fp16 + decoder q4` WebGPU'da kanıtlanmış konfig (transformers.js
// gerçek-zamanlı Whisper örneğiyle aynı). Doğruluk yetmezse MODEL_ID'yi büyüt
// (ve gerekirse aşağıdaki dtype'ı fp16'ya çek).
const MODEL_ID = "onnx-community/whisper-small";
const SAMPLE_RATE = 16000;
const COMMIT_SECONDS = 24;
const CARRYOVER_SECONDS = 2;
const TICK_MS = 4000;
// Sessizlik eşiği (RMS, 0..1). Bunun altındaki bloklar Whisper'a VERİLMEZ —
// aksi halde model boşluğu "halüsinasyonla" (tekrar eden saçma token'lar)
// doldurur. Sesli konuşma ~0.02+; sessizlik ~0.001–0.005.
const SILENCE_RMS = 0.008;

type Transcriber = (
  audio: Float32Array,
  opts: Record<string, unknown>,
) => Promise<{ text: string } | Array<{ text: string }>>;

let transcriber: Transcriber | null = null;
let audioContext: AudioContext | null = null;
let tabStream: MediaStream | null = null;
let micStream: MediaStream | null = null;
let processor: ScriptProcessorNode | null = null;
let chunks: Float32Array[] = [];
let bufferedSamples = 0;
let running = false;
let busy = false;
let tickTimer: ReturnType<typeof setInterval> | null = null;

function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

function takeBuffer(): Float32Array {
  const out = new Float32Array(bufferedSamples);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

function keepCarryover(): void {
  const carry = Math.floor(CARRYOVER_SECONDS * SAMPLE_RATE);
  const all = takeBuffer();
  const tail = all.slice(Math.max(0, all.length - carry));
  chunks = tail.length ? [tail] : [];
  bufferedSamples = tail.length;
}

async function ensureModel(): Promise<void> {
  if (transcriber) return;
  sendMessage({ type: "MODEL_PROGRESS", status: "Model yükleniyor…", progress: 0 });
  transcriber = (await pipeline("automatic-speech-recognition", MODEL_ID, {
    device: "webgpu",
    // Encoder fp16 (WebGPU dostu) + decoder q4 (asıl boyut kazancı).
    dtype: { encoder_model: "fp16", decoder_model_merged: "q4" },
    progress_callback: (p: unknown) => {
      const prog = p as { status?: string; progress?: number };
      if (prog.status === "progress" && typeof prog.progress === "number") {
        sendMessage({
          type: "MODEL_PROGRESS",
          status: `Model indiriliyor… %${Math.round(prog.progress)}`,
          progress: prog.progress,
        });
      }
    },
  })) as unknown as Transcriber;
  sendMessage({ type: "MODEL_PROGRESS", status: "Model hazır", progress: 100 });
}

async function transcribe(samples: Float32Array): Promise<string> {
  if (!transcriber || samples.length < SAMPLE_RATE) return "";
  // Sessiz blokları modele hiç verme — halüsinasyonu (tekrar eden saçma çıktı)
  // baştan engeller.
  if (rms(samples) < SILENCE_RMS) return "";
  const out = await transcriber(samples, {
    language: "tr",
    task: "transcribe",
    chunk_length_s: 30,
    stride_length_s: 5,
    no_repeat_ngram_size: 3, // "-A -A -A" gibi tekrar döngülerini kır
    temperature: 0,
  });
  const text = Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text;
  return (text ?? "").trim();
}

async function tick(): Promise<void> {
  if (!running || busy) return;
  busy = true;
  try {
    const durationS = bufferedSamples / SAMPLE_RATE;
    if (durationS >= COMMIT_SECONDS) {
      const text = await transcribe(takeBuffer());
      if (text) sendMessage({ type: "SEGMENT", text, kind: "final" });
      keepCarryover();
    } else if (durationS >= 2) {
      const text = await transcribe(takeBuffer());
      if (text) sendMessage({ type: "SEGMENT", text, kind: "partial" });
    }
  } catch {
    // Bir sonraki tur tekrar dener.
  } finally {
    busy = false;
  }
}

async function start(streamId: string | null): Promise<void> {
  if (running) return;
  sendMessage({ type: "CAPTURE_STATE", state: "starting" });
  try {
    await ensureModel();
    audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    const mix = audioContext.createGain();

    // Mikrofon = BİRİNCİL kaynak (koç + hoparlörden gelen karşı taraf). ZORUNLU;
    // görüşme hangi platformda olursa olsun (WhatsApp/telefon/yüz yüze) çalışır.
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      audioContext.createMediaStreamSource(micStream).connect(mix);
    } catch {
      sendMessage({
        type: "CAPTURE_STATE",
        state: "error",
        error:
          "Mikrofon izni yok. Panelde Başlat'a basınca çıkan izni ver; daha önce reddettiysen adres çubuğundaki eklenti/kilit simgesinden mikrofonu Aç ve tekrar dene.",
      });
      await stop();
      return;
    }

    // Sekme sesi = EN İYİ ÇABA (tarayıcı içi Meet/Zoom'da öğrenciyi de duymak
    // için). streamId yoksa/alınamıyorsa yalnız mikrofonla devam.
    let tabNote: string | undefined;
    if (streamId) {
      try {
        tabStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: "tab",
              chromeMediaSourceId: streamId,
            },
          } as unknown as MediaTrackConstraints,
          video: false,
        });
        const tabSource = audioContext.createMediaStreamSource(tabStream);
        tabSource.connect(mix);
        // Sekme sesini hoparlöre geri ver — yoksa koç sekme sesini duymaz.
        tabSource.connect(audioContext.destination);
      } catch {
        tabNote = "Sekme sesi alınamadı; yalnız mikrofon çevriliyor.";
      }
    }

    // Float32 örnek topla. ScriptProcessor kullanımdan kalkıyor ama basit/güvenilir.
    processor = audioContext.createScriptProcessor(4096, 1, 1);
    mix.connect(processor);
    // onaudioprocess tetiklensin diye destination'a bağla — ama sesi 0'la
    // (mix'i tekrar duyulur kılmayalım → mikrofon geri beslemesi olmasın).
    const silent = audioContext.createGain();
    silent.gain.value = 0;
    processor.connect(silent);
    silent.connect(audioContext.destination);

    processor.onaudioprocess = (ev) => {
      if (!running) return;
      chunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
      bufferedSamples += ev.inputBuffer.length;
    };

    running = true;
    tickTimer = setInterval(() => void tick(), TICK_MS);
    sendMessage({ type: "CAPTURE_STATE", state: "running", error: tabNote });
  } catch (e) {
    sendMessage({
      type: "CAPTURE_STATE",
      state: "error",
      error: e instanceof Error ? e.message : "Yakalama başlatılamadı.",
    });
    await stop();
  }
}

async function stop(): Promise<void> {
  const wasRunning = running;
  running = false;
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
  processor?.disconnect();
  processor = null;

  // Kalan tamponu son "final" olarak boşalt.
  if (wasRunning) {
    try {
      const rest = takeBuffer();
      if (rest.length > SAMPLE_RATE) {
        const text = await transcribe(rest);
        if (text) sendMessage({ type: "SEGMENT", text, kind: "final" });
      }
    } catch {
      // yut
    }
  }
  chunks = [];
  bufferedSamples = 0;
  tabStream?.getTracks().forEach((t) => t.stop());
  micStream?.getTracks().forEach((t) => t.stop());
  tabStream = null;
  micStream = null;
  await audioContext?.close().catch(() => {});
  audioContext = null;
  sendMessage({ type: "CAPTURE_STATE", state: "stopped" });
}

chrome.runtime.onMessage.addListener((msg: ExtMessage) => {
  if (msg?.type === "OFFSCREEN_START") void start(msg.streamId);
  else if (msg?.type === "OFFSCREEN_STOP") void stop();
});

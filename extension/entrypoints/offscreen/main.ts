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
// MV3 uzak-kod yasağı: ONNX Runtime wasm dosyaları eklenti içinden yüklenir
// (public/ort/ altına `pnpm copy-ort` ile kopyalanır).
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("/ort/");
}

const MODEL_ID = "onnx-community/whisper-large-v3-turbo";
const SAMPLE_RATE = 16000;
const COMMIT_SECONDS = 24;
const CARRYOVER_SECONDS = 2;
const TICK_MS = 4000;

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
    dtype: "fp16",
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
  const out = await transcriber(samples, {
    language: "tr",
    task: "transcribe",
    chunk_length_s: 30,
    stride_length_s: 5,
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

async function start(streamId: string): Promise<void> {
  if (running) return;
  sendMessage({ type: "CAPTURE_STATE", state: "starting" });
  try {
    await ensureModel();
    audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

    // Sekme sesi (uzak taraf / öğrenci).
    tabStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      } as unknown as MediaTrackConstraints,
      video: false,
    });

    const mix = audioContext.createGain();
    const tabSource = audioContext.createMediaStreamSource(tabStream);
    tabSource.connect(mix);
    // Sekme sesini hoparlöre geri ver — yoksa koç görüşmeyi duymaz.
    tabSource.connect(audioContext.destination);

    // Mikrofon (koç) — en iyi çaba. Reddedilirse yalnız sekme sesiyle devam.
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      audioContext.createMediaStreamSource(micStream).connect(mix);
    } catch {
      sendMessage({
        type: "CAPTURE_STATE",
        state: "running",
        error: "Mikrofon erişimi yok; yalnız sekme sesi çevriliyor.",
      });
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
    sendMessage({ type: "CAPTURE_STATE", state: "running" });
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

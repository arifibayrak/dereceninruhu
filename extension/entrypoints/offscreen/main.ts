import { env, pipeline } from "@huggingface/transformers";
import { sendMessage, type ExtMessage } from "@/lib/messages";
import { AsrError, asrErrorMessage, asrPlans } from "@/lib/asr-engine";

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

// Model/motor seçimi CİHAZA GÖRE yapılır — bkz. `@/lib/asr-engine`. Özet:
// GPU fp16 (`shader-f16`) destekliyorsa whisper-small {enc fp16, dec q4};
// desteklemiyorsa (çoğu tablet/telefon GPU'su) whisper-base {enc fp32, dec q4};
// WebGPU hiç yoksa CPU'da whisper-base q8. Model listesini oradan değiştir.
const SAMPLE_RATE = 16000;
const COMMIT_SECONDS = 24;
const CARRYOVER_SECONDS = 2;
const TICK_MS = 4000;
// Emniyet supabı: cihaz gerçek zamanlının gerisinde kalırsa tampon sonsuza
// büyümesin (1 saat ham Float32 ≈ 230 MB). Sağlıklı cihazda buraya gelinmez.
const MAX_BUFFER_SECONDS = 90;
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
// Son çıkarımın süresi (ms) — yavaş cihazlarda "partial" turlarını atlamak için.
let lastInferMs = 0;
// Son anlık görüntüden BERİ tamponun BAŞINDAN atılan örnek sayısı — `dropConsumed`
// bunu düşmezse çevrilmemiş sesi de atar.
let frontDropped = 0;
let droppedAudio = false;

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

/**
 * Çevrilen `consumed` örneği tampondan at, CARRYOVER kadarını başa taşı.
 * ÖNEMLİ: çıkarım sürerken kaydedilen ses tamponda BİRİKİR; bu yüzden "son N
 * saniyeyi tut" yerine "işlenen kadarını at" yapılır — yavaş cihazda konuşma
 * kaybolmaz.
 */
function dropConsumed(consumed: number): void {
  const carry = Math.floor(CARRYOVER_SECONDS * SAMPLE_RATE);
  const all = takeBuffer();
  const rest = all.slice(Math.min(all.length, Math.max(0, consumed - carry)));
  chunks = rest.length ? [rest] : [];
  bufferedSamples = rest.length;
}

async function ensureModel(): Promise<void> {
  if (transcriber) return;
  sendMessage({ type: "MODEL_PROGRESS", status: "Model yükleniyor…", progress: 0 });

  // Cihaza göre seçilmiş plan merdiveni: ilki yetenek yoklamasıyla SEÇİLİR,
  // yine de patlarsa (sürücü hatası, bellek…) bir alttakine inilir.
  const plans = await asrPlans();
  let lastError: unknown = null;

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    try {
      transcriber = (await pipeline(
        "automatic-speech-recognition",
        plan.modelId,
        {
          device: plan.device,
          dtype: plan.dtype,
          progress_callback: (p: unknown) => {
            const prog = p as { status?: string; progress?: number };
            if (prog.status === "progress" && typeof prog.progress === "number") {
              sendMessage({
                type: "MODEL_PROGRESS",
                status: `Model indiriliyor… %${Math.round(prog.progress)} (${plan.label}, ~${plan.approxMb} MB)`,
                progress: prog.progress,
              });
            }
          },
        },
      )) as unknown as Transcriber;
      sendMessage({
        type: "MODEL_PROGRESS",
        status: `Model hazır — ${plan.label}`,
        progress: 100,
      });
      return;
    } catch (e) {
      lastError = e;
      const next = plans[i + 1];
      if (next) {
        sendMessage({
          type: "MODEL_PROGRESS",
          status: `${plan.label} bu cihazda çalışmadı; ${next.label} deneniyor…`,
          progress: 0,
        });
      }
    }
  }

  throw new AsrError(asrErrorMessage(lastError));
}

async function transcribe(samples: Float32Array): Promise<string> {
  if (!transcriber || samples.length < SAMPLE_RATE) return "";
  // Sessiz blokları modele hiç verme — halüsinasyonu (tekrar eden saçma çıktı)
  // baştan engeller.
  if (rms(samples) < SILENCE_RMS) return "";
  const startedAt = performance.now();
  const out = await transcriber(samples, {
    language: "tr",
    task: "transcribe",
    chunk_length_s: 30,
    stride_length_s: 5,
    no_repeat_ngram_size: 3, // "-A -A -A" gibi tekrar döngülerini kır
    temperature: 0,
  });
  lastInferMs = performance.now() - startedAt;
  const text = Array.isArray(out) ? out.map((o) => o.text).join(" ") : out.text;
  return (text ?? "").trim();
}

async function tick(): Promise<void> {
  if (!running || busy) return;
  busy = true;
  try {
    const durationS = bufferedSamples / SAMPLE_RATE;
    if (durationS >= COMMIT_SECONDS) {
      // Anlık görüntüyü al; çıkarım sürerken tampon büyümeye devam eder.
      const buf = takeBuffer();
      frontDropped = 0;
      const text = await transcribe(buf);
      if (text) sendMessage({ type: "SEGMENT", text, kind: "final" });
      // Çıkarım sürerken tavan aşılıp baştan atılan kısım zaten gitti; yalnız
      // tamponda KALAN çevrilmiş bölümü at.
      dropConsumed(buf.length - frontDropped);
      if (droppedAudio) {
        droppedAudio = false;
        sendMessage({
          type: "CAPTURE_STATE",
          state: "running",
          error:
            "Cihaz konuşmaya yetişemedi; arada kalan bir bölüm çevrilemedi.",
        });
      }
    } else if (durationS >= 2 && lastInferMs <= TICK_MS) {
      // "Partial" bir lükstür: cihaz gerçek zamanlının gerisindeyse atla ki
      // asıl iş (COMMIT turu) sıraya girebilsin.
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
    lastInferMs = 0;
    frontDropped = 0;
    droppedAudio = false;
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
      // Tampon tavanı: çıkarım sesin gerisinde kalırsa en ESKİ bloklar atılır
      // (bellek sabit kalsın). Atılan ses = çevrilemeyen konuşma → bildirilir.
      const max = MAX_BUFFER_SECONDS * SAMPLE_RATE;
      while (bufferedSamples > max && chunks.length > 1) {
        const dropped = chunks.shift();
        if (!dropped) break;
        bufferedSamples -= dropped.length;
        frontDropped += dropped.length;
        droppedAudio = true;
      }
    };

    running = true;
    tickTimer = setInterval(() => void tick(), TICK_MS);
    sendMessage({ type: "CAPTURE_STATE", state: "running", error: tabNote });
  } catch (e) {
    sendMessage({
      type: "CAPTURE_STATE",
      state: "error",
      error: asrErrorMessage(e),
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

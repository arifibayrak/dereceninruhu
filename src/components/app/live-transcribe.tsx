"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { MicIcon, SquareIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { createLiveTranscript } from "@/actions/transcripts";
import { Button } from "@/components/ui/button";

/**
 * Canlı (cihaz-içi) mikrofon transkripti — eklentisiz web sürümü.
 *
 * Ses TARAYICIDA (WebGPU + transformers.js whisper-small) yazıya çevrilir;
 * hiçbir yere kaydedilmez/yüklenmez. Yalnız üretilen METİN, "Kaydet" ile
 * `createLiveTranscript` (çerez oturumu) üzerinden uygulamaya işlenir ve mevcut
 * AI-öneri hattını besler. transformers.js YALNIZ tarayıcıda dinamik import
 * edilir → Cloudflare Worker paketine girmez.
 *
 * Kaynak = YALNIZ MİKROFON (sekme sesi web sayfasından yakalanamaz). Telefon/
 * WhatsApp (hoparlör), yüz yüze ya da bilgisayardan konuşma fark etmeksizin
 * mikrofonun duyduğu her şey çevrilir.
 */

const MODEL_ID = "onnx-community/whisper-small";
const SAMPLE_RATE = 16000;
const COMMIT_SECONDS = 24;
const CARRYOVER_SECONDS = 2;
const TICK_MS = 4000;
const SILENCE_RMS = 0.008; // altındaki bloklar modele verilmez (halüsinasyon önlenir)

type Transcriber = (
  audio: Float32Array,
  opts: Record<string, unknown>,
) => Promise<{ text: string } | Array<{ text: string }>>;

type Status = "idle" | "starting" | "recording" | "stopped";

type Props = {
  enrollmentId: number;
  studentId: number;
  coachingSessionId?: number | null;
};

function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

// WebGPU/AudioContext desteği — SSR-güvenli okuma (hidrasyon uyuşmazlığı yok).
const noopSubscribe = () => () => {};
const getSupportSnapshot = (): boolean | null =>
  "gpu" in navigator && typeof AudioContext !== "undefined";
const getSupportServerSnapshot = (): boolean | null => null;

export function LiveTranscribe({
  enrollmentId,
  studentId,
  coachingSessionId,
}: Props) {
  const router = useRouter();

  const supported = useSyncExternalStore(
    noopSubscribe,
    getSupportSnapshot,
    getSupportServerSnapshot,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [modelStatus, setModelStatus] = useState("");
  const [finals, setFinals] = useState<string[]>([]);
  const [partial, setPartial] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Motor durumu (render tetiklemez).
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriberRef = useRef<Transcriber | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const bufferedRef = useRef(0);
  const runningRef = useRef(false);
  const busyRef = useRef(false);

  const transcriptRef = useRef<HTMLDivElement>(null);

  const fullText = useMemo(
    () =>
      [...finals, partial]
        .map((t) => t.trim())
        .filter(Boolean)
        .join(" "),
    [finals, partial],
  );

  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [finals, partial]);

  // Yalnız ref'lere dokunan yıkım — bileşen sökülürken güvenli.
  const teardown = useCallback(() => {
    runningRef.current = false;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    chunksRef.current = [];
    bufferedRef.current = 0;
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const takeBuffer = (): Float32Array => {
    const out = new Float32Array(bufferedRef.current);
    let off = 0;
    for (const c of chunksRef.current) {
      out.set(c, off);
      off += c.length;
    }
    return out;
  };

  const keepCarryover = (): void => {
    const carry = Math.floor(CARRYOVER_SECONDS * SAMPLE_RATE);
    const all = takeBuffer();
    const tail = all.slice(Math.max(0, all.length - carry));
    chunksRef.current = tail.length ? [tail] : [];
    bufferedRef.current = tail.length;
  };

  const ensureModel = async (): Promise<void> => {
    if (transcriberRef.current) return;
    setModelStatus("Model hazırlanıyor…");
    // Dinamik import: yalnız tarayıcıda yüklenir (SSR/Worker'a girmez).
    const { pipeline, env } = await import("@huggingface/transformers");
    env.allowLocalModels = false; // ağırlıklar HF hub CDN'inden
    const t = await pipeline("automatic-speech-recognition", MODEL_ID, {
      device: "webgpu",
      dtype: { encoder_model: "fp16", decoder_model_merged: "q4" },
      progress_callback: (p: unknown) => {
        const prog = p as { status?: string; progress?: number };
        if (prog.status === "progress" && typeof prog.progress === "number") {
          setModelStatus(`Model indiriliyor… %${Math.round(prog.progress)}`);
        }
      },
    });
    transcriberRef.current = t as unknown as Transcriber;
    setModelStatus("");
  };

  const transcribe = async (samples: Float32Array): Promise<string> => {
    const t = transcriberRef.current;
    if (!t || samples.length < SAMPLE_RATE) return "";
    if (rms(samples) < SILENCE_RMS) return ""; // sessizlik → çevirme yok
    const out = await t(samples, {
      language: "tr",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5,
      no_repeat_ngram_size: 3,
      temperature: 0,
    });
    const text = Array.isArray(out)
      ? out.map((o) => o.text).join(" ")
      : out.text;
    return (text ?? "").trim();
  };

  const tick = async (): Promise<void> => {
    if (!runningRef.current || busyRef.current) return;
    busyRef.current = true;
    try {
      const durationS = bufferedRef.current / SAMPLE_RATE;
      if (durationS >= COMMIT_SECONDS) {
        const text = await transcribe(takeBuffer());
        if (text) {
          setFinals((f) => [...f, text]);
          setPartial("");
        }
        keepCarryover();
      } else if (durationS >= 2) {
        const text = await transcribe(takeBuffer());
        if (text) setPartial(text);
      }
    } catch {
      // Bir sonraki tur tekrar dener.
    } finally {
      busyRef.current = false;
    }
  };

  const start = async (): Promise<void> => {
    setNotice(null);
    setFinals([]);
    setPartial("");
    setStatus("starting");

    // Mikrofon izni — web sayfasında tarayıcı istemi normal görünür.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("idle");
      setNotice(
        "Mikrofon izni gerekli. Tarayıcı sorunca 'İzin ver'e bas; reddettiysen adres çubuğundaki kilit/kamera simgesinden mikrofonu aç ve tekrar dene.",
      );
      return;
    }

    try {
      await ensureModel();

      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      audioContextRef.current = ctx;
      streamRef.current = stream;

      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      src.connect(proc);
      // onaudioprocess tetiklensin diye destination'a bağla ama sesi 0'la.
      const silent = ctx.createGain();
      silent.gain.value = 0;
      proc.connect(silent);
      silent.connect(ctx.destination);
      processorRef.current = proc;

      chunksRef.current = [];
      bufferedRef.current = 0;
      proc.onaudioprocess = (ev) => {
        if (!runningRef.current) return;
        chunksRef.current.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
        bufferedRef.current += ev.inputBuffer.length;
      };

      runningRef.current = true;
      tickRef.current = setInterval(() => void tick(), TICK_MS);
      setStatus("recording");
    } catch (e) {
      teardown();
      setStatus("idle");
      setNotice(
        e instanceof Error ? e.message : "Transkript başlatılamadı.",
      );
    }
  };

  const stop = async (): Promise<void> => {
    runningRef.current = false;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    // Kalan tamponu son parça olarak boşalt.
    try {
      const rest = takeBuffer();
      if (rest.length > SAMPLE_RATE) {
        const text = await transcribe(rest);
        if (text) {
          setFinals((f) => [...f, text]);
          setPartial("");
        }
      }
    } catch {
      // yut
    }
    teardown();
    setStatus("stopped");
  };

  const save = (): void => {
    if (fullText.length < 20) {
      toast.error("Kaydedilecek transkript çok kısa.");
      return;
    }
    setSaving(true);
    void (async () => {
      const res = await createLiveTranscript({
        enrollmentId,
        coachingSessionId: coachingSessionId ?? undefined,
        rawText: fullText,
      });
      setSaving(false);
      if (res.ok) {
        router.push(
          `/koc/ogrenciler/${studentId}/transkript/${res.data.transcriptId}`,
        );
      } else {
        toast.error(res.error);
      }
    })();
  };

  if (supported === false) {
    return (
      <p className="text-sm text-muted-foreground">
        Bu tarayıcı cihaz-içi transkripti (WebGPU) desteklemiyor. Güncel bir
        Chrome/Brave/Edge kullan ya da &quot;metin yapıştır&quot; yolunu tercih
        et.
      </p>
    );
  }

  const isRecording = status === "recording" || status === "starting";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Mikrofonunu dinler, konuşmayı <strong>cihazında</strong> (WebGPU) canlı
        yazıya çevirir. Ses kaydedilmez; yalnız metin kaydedilir. İlk kullanımda
        model bir kez (~250&nbsp;MB) indirilir, sonra çevrimdışı çalışır.
      </p>

      <div className="flex items-center gap-2">
        {status === "recording" ? (
          <Button variant="destructive" onClick={() => void stop()}>
            <SquareIcon className="size-4 fill-current" />
            Durdur
          </Button>
        ) : status === "starting" ? (
          <Button disabled>
            <MicIcon className="size-4" />
            Başlatılıyor…
          </Button>
        ) : (
          <Button onClick={() => void start()}>
            <MicIcon className="size-4" />
            {status === "stopped" ? "Yeniden başlat" : "Başlat"}
          </Button>
        )}
        {status === "recording" ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <span className="size-2 animate-pulse rounded-full bg-destructive" />
            Dinleniyor
          </span>
        ) : null}
      </div>

      {modelStatus ? (
        <p className="rounded-lg border border-dashed border-foreground/15 bg-muted px-3 py-2 text-xs text-muted-foreground">
          {modelStatus}
        </p>
      ) : null}

      <div
        ref={transcriptRef}
        className="max-h-72 min-h-28 overflow-y-auto rounded-lg bg-muted p-3 text-sm leading-relaxed break-words whitespace-pre-wrap"
      >
        {finals.length === 0 && !partial ? (
          <span className="text-muted-foreground">
            {isRecording
              ? "Dinleniyor… konuşuldukça metin burada akacak."
              : "Başlat'a basınca canlı transkript burada görünür."}
          </span>
        ) : (
          <>
            {finals.join(" ")}
            {partial ? (
              <span className="text-muted-foreground"> {partial}</span>
            ) : null}
          </>
        )}
      </div>

      {status === "stopped" && fullText.length >= 20 ? (
        <div>
          <Button onClick={save} disabled={saving}>
            <SaveIcon className="size-4" />
            {saving ? "Kaydediliyor…" : "Kaydet ve incele"}
          </Button>
        </div>
      ) : null}

      {notice ? (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

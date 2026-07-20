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
import { MicIcon, SquareIcon, SaveIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";

import {
  appendLiveTranscript,
  createLiveTranscript,
} from "@/actions/transcripts";
import { Button } from "@/components/ui/button";

/**
 * Canlı (cihaz-içi) mikrofon transkripti — eklentisiz web sürümü.
 *
 * Ses TARAYICIDA (WebGPU + transformers.js whisper-small) yazıya çevrilir.
 * VARSAYILAN olarak ses kaydedilmez; yalnız üretilen METİN "Kaydet" ile
 * `createLiveTranscript` (çerez oturumu) üzerinden işlenir ve AI-öneri hattını
 * besler. Koç KVKK onay kutusunu işaretlerse ses de `MediaRecorder` ile
 * (webm/opus, ~24 kbps) kaydedilip R2'ye yüklenir. transformers.js YALNIZ
 * tarayıcıda dinamik import edilir → Cloudflare Worker paketine girmez.
 *
 * DURDUR sonrası iki seçenek: "Devam et" (aynı transkripte ekleyerek kaydı
 * sürdürür — metin/ses birikir) ve "Yeniden başlat" (sıfırdan). `transcriptId`
 * verilirse (kaydedilmiş bir transkripti tekrar açıp sürdürme) metin mevcut
 * kayda EKLENİR; verilmezse yeni transkript oluşturulur.
 */

const MODEL_ID = "onnx-community/whisper-small";
const SAMPLE_RATE = 16000;
const COMMIT_SECONDS = 24;
const CARRYOVER_SECONDS = 2;
const TICK_MS = 4000;
const SILENCE_RMS = 0.008; // altındaki bloklar modele verilmez (halüsinasyon önlenir)
const AUDIO_BITS_PER_SECOND = 24000; // konuşma için opus'ta bol (~11 MB/saat)

type Transcriber = (
  audio: Float32Array,
  opts: Record<string, unknown>,
) => Promise<{ text: string } | Array<{ text: string }>>;

type Status = "idle" | "starting" | "recording" | "stopped";

type Props = {
  enrollmentId: number;
  studentId: number;
  coachingSessionId?: number | null;
  /** Verilirse: bu kaydedilmiş transkripte EKLE (yeni satır oluşturma). */
  transcriptId?: number;
  /** `transcriptId` ile birlikte: mevcut metin (salt-okunur "şu ana kadar"). */
  initialText?: string;
};

function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

/** Kaydedilebilir en iyi ses türünü seç (yoksa null → ses kaydı devre dışı). */
function pickAudioMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const prefs = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const m of prefs) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
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
  transcriptId,
  initialText,
}: Props) {
  const router = useRouter();
  const isAppend = transcriptId != null;

  const supported = useSyncExternalStore(
    noopSubscribe,
    getSupportSnapshot,
    getSupportServerSnapshot,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [modelStatus, setModelStatus] = useState("");
  // finals/partial YALNIZ bu oturumda YENİ eklenen konuşmayı tutar; `initialText`
  // (varsa) ayrı bir salt-okunur önizleme olarak gösterilir.
  const [finals, setFinals] = useState<string[]>([]);
  const [partial, setPartial] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [keepAudio, setKeepAudio] = useState(false);

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

  // Ses kaydı (yalnız KVKK onayı işaretliyse). Her başlat→durdur bir "parça"dır;
  // parçalar kaydederken sırayla R2'ye yüklenir.
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderChunksRef = useRef<Blob[]>([]);
  const audioSegmentsRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("audio/webm");

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

  // Yalnız ref'lere dokunan yıkım — bileşen sökülürken güvenli. NOT: kaydedilmiş
  // ses parçaları (`audioSegmentsRef`) burada TEMİZLENMEZ (durdur→kaydet arası
  // gerekir); yalnız sıfırdan başlatınca temizlenir.
  const teardown = useCallback(() => {
    runningRef.current = false;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // yut
      }
    }
    recorderRef.current = null;
    recorderChunksRef.current = [];
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

  /** Mikrofon + motor + (onaylıysa) ses kaydını başlat. finals/partial'a DOKUNMAZ. */
  const beginCapture = async (): Promise<void> => {
    setNotice(null);
    setStatus("starting");

    // Mikrofon izni — web sayfasında tarayıcı istemi normal görünür.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus(finals.length || partial ? "stopped" : "idle");
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

      // Ses kaydı: yalnız KVKK onayı işaretliyse ve tarayıcı destekliyorsa.
      if (keepAudio) {
        const mime = pickAudioMime();
        if (mime) {
          mimeRef.current = mime;
          recorderChunksRef.current = [];
          const rec = new MediaRecorder(stream, {
            mimeType: mime,
            audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
          });
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recorderChunksRef.current.push(e.data);
          };
          recorderRef.current = rec;
          rec.start(1000); // 1 sn'lik parçalar → uzun kayıtta veri kaybı riski az
        } else {
          setNotice(
            "Bu tarayıcı ses kaydını (MediaRecorder) desteklemiyor; yalnız metin kaydedilecek.",
          );
        }
      }

      runningRef.current = true;
      tickRef.current = setInterval(() => void tick(), TICK_MS);
      setStatus("recording");
    } catch (e) {
      teardown();
      setStatus(finals.length || partial ? "stopped" : "idle");
      setNotice(e instanceof Error ? e.message : "Transkript başlatılamadı.");
    }
  };

  /** Sıfırdan: bu oturumun metnini ve ses parçalarını temizleyip başlat. */
  const start = async (): Promise<void> => {
    setFinals([]);
    setPartial("");
    audioSegmentsRef.current = [];
    await beginCapture();
  };

  /** Devam et: birikmiş metni/ses parçalarını KORUYARAK kaydı sürdür. */
  const resume = async (): Promise<void> => {
    await beginCapture();
  };

  /** MediaRecorder'ı durdur ve son parçayı `audioSegmentsRef`'e ekle. */
  const finalizeRecorder = (): Promise<void> =>
    new Promise((resolve) => {
      const rec = recorderRef.current;
      if (!rec || rec.state === "inactive") return resolve();
      rec.onstop = () => {
        const chunks = recorderChunksRef.current;
        if (chunks.length) {
          audioSegmentsRef.current.push(
            new Blob(chunks, { type: mimeRef.current || "audio/webm" }),
          );
        }
        recorderChunksRef.current = [];
        recorderRef.current = null;
        resolve();
      };
      try {
        rec.stop();
      } catch {
        resolve();
      }
    });

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
    // Ses parçasını, mikrofon kapanmadan ÖNCE finalize et.
    await finalizeRecorder();
    teardown();
    setStatus("stopped");
  };

  /** Her ses parçasını sırayla yükle (metin zaten kaydedildikten sonra). */
  const uploadAudioSegments = async (tid: number): Promise<void> => {
    const segments = audioSegmentsRef.current;
    for (let i = 0; i < segments.length; i++) {
      const fd = new FormData();
      fd.append("index", String(i));
      fd.append("file", segments[i], `live-${i}.webm`);
      const res = await fetch(`/api/transcripts/${tid}/audio`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Ses parçası yüklenemedi.");
    }
  };

  const save = (): void => {
    if (fullText.length < 20) {
      toast.error("Kaydedilecek transkript çok kısa.");
      return;
    }
    setSaving(true);
    void (async () => {
      try {
        let tid = transcriptId ?? null;
        if (tid != null) {
          const res = await appendLiveTranscript({
            transcriptId: tid,
            addedText: fullText,
          });
          if (!res.ok) throw new Error(res.error);
        } else {
          const res = await createLiveTranscript({
            enrollmentId,
            coachingSessionId: coachingSessionId ?? undefined,
            rawText: fullText,
          });
          if (!res.ok) throw new Error(res.error);
          tid = res.data.transcriptId;
        }

        if (keepAudio && audioSegmentsRef.current.length > 0 && tid != null) {
          try {
            await uploadAudioSegments(tid);
          } catch {
            toast.warning("Metin kaydedildi ama ses yüklenemedi.");
          }
        }

        if (isAppend) {
          // Kaydedilmiş transkripte eklendi: sayfada kal, tazele, oturumu sıfırla.
          toast.success("Transkripte eklendi.");
          setFinals([]);
          setPartial("");
          audioSegmentsRef.current = [];
          setStatus("idle");
          router.refresh();
        } else {
          router.push(`/koc/ogrenciler/${studentId}/transkript/${tid}`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Kaydedilemedi.");
      } finally {
        setSaving(false);
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
  const hasText = finals.length > 0 || partial.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Mikrofonunu dinler, konuşmayı <strong>cihazında</strong> (WebGPU) canlı
        yazıya çevirir. İlk kullanımda model bir kez (~250&nbsp;MB) indirilir,
        sonra çevrimdışı çalışır.
      </p>

      {isAppend && initialText ? (
        <div className="rounded-lg border border-dashed border-foreground/15 bg-muted/50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Şu ana kadar
          </p>
          <p className="line-clamp-4 break-words whitespace-pre-wrap text-foreground/80">
            {initialText}
          </p>
        </div>
      ) : null}

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={keepAudio}
          disabled={isRecording}
          onChange={(e) => setKeepAudio(e.target.checked)}
        />
        <span className="text-muted-foreground">
          Ses kaydını da sakla — öğrenci/veli onayı alındı (KVKK). İşaretlenmezse
          yalnız metin kaydedilir, ses cihazdan çıkmaz.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
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
        ) : status === "stopped" ? (
          <>
            <Button onClick={() => void resume()}>
              <PlayIcon className="size-4" />
              Devam et
            </Button>
            <Button variant="outline" onClick={() => void start()}>
              <MicIcon className="size-4" />
              Yeniden başlat
            </Button>
          </>
        ) : (
          <Button onClick={() => void start()}>
            <MicIcon className="size-4" />
            {isAppend ? "Eklemeye başla" : "Başlat"}
          </Button>
        )}
        {status === "recording" ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <span className="size-2 animate-pulse rounded-full bg-destructive" />
            {keepAudio ? "Dinleniyor · ses kaydediliyor" : "Dinleniyor"}
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
        {!hasText ? (
          <span className="text-muted-foreground">
            {isRecording
              ? "Dinleniyor… konuşuldukça metin burada akacak."
              : isAppend
                ? "Eklemeye başla'ya basınca yeni konuşma burada akacak."
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
            {saving
              ? "Kaydediliyor…"
              : isAppend
                ? "Kaydet (transkripte ekle)"
                : "Kaydet ve incele"}
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

/**
 * İSTEMCİ-YALNIZ ses yardımcıları (AudioContext gerektirir).
 *
 * Görüşme kaydını (mp3/m4a/webm/wav…) tarayıcıda çözer, 16 kHz mono'ya indirger
 * ve ~chunkSeconds'lik WAV parçalarına böler. Neden: OpenRouter Whisper istek
 * başına kısa ses ister ve Worker'da ffmpeg yoktur — bölme istemcide yapılır.
 * 16 kHz mono 16-bit WAV ≈ 32 KB/sn, yani 45 sn ≈ 1.4 MB (sağlayıcı sınırına uygun).
 */

const TARGET_RATE = 16000;

type AudioCtor = typeof AudioContext;

function getAudioContext(): AudioContext {
  const w = window as unknown as {
    AudioContext?: AudioCtor;
    webkitAudioContext?: AudioCtor;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) throw new Error("Tarayıcı ses çözmeyi desteklemiyor.");
  return new Ctor();
}

/** Ses dosyasını 16 kHz mono ~chunkSeconds WAV parçalarına böler (base64 listesi). */
export async function fileToWavChunks(
  file: File,
  chunkSeconds = 45,
  onProgress?: (stage: string) => void,
): Promise<string[]> {
  onProgress?.("Ses çözülüyor…");
  const arrayBuf = await file.arrayBuffer();
  const decodeCtx = getAudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
  } finally {
    void decodeCtx.close();
  }

  onProgress?.("16 kHz'e indirgeniyor…");
  const frames = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE));
  const offline = new OfflineAudioContext(1, frames, TARGET_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  const mono = rendered.getChannelData(0); // Float32Array @ 16 kHz mono

  const samplesPerChunk = chunkSeconds * TARGET_RATE;
  const chunks: string[] = [];
  for (let start = 0; start < mono.length; start += samplesPerChunk) {
    const slice = mono.subarray(
      start,
      Math.min(start + samplesPerChunk, mono.length),
    );
    chunks.push(encodeWavBase64(slice, TARGET_RATE));
  }
  return chunks;
}

function encodeWavBase64(samples: Float32Array, rate: number): string {
  const bytesPerSample = 2;
  const dataLen = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataLen, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return arrayBufferToBase64(buffer);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

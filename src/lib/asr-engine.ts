/**
 * Cihaz-içi (transformers.js) konuşma tanıma için MOTOR SEÇİMİ.
 *
 * Neden var: `dtype: { encoder_model: "fp16" }` YALNIZ WebGPU bağdaştırıcısı
 * `shader-f16` özelliğini bildiriyorsa çalışır. Birçok tablet/telefon GPU'su
 * (Adreno/Mali) ve bazı sanal masaüstü sürücüleri `navigator.gpu`'yu sunar ama
 * `shader-f16` sunmaz → transformers.js `The device (webgpu) does not support
 * fp16.` diye patlar. Bu yüzden ÖNCE bağdaştırıcıyı yoklayıp uygun planı
 * seçiyoruz, sonra yine de patlarsa merdivenden aşağı iniyoruz.
 *
 * Bu dosya SUNUCUYA girmez: yalnız tarayıcı API'lerini okur ve `"use client"`
 * bileşenlerden çağrılır. transformers.js'i import ETMEZ (tip bile) — ağır
 * paket yalnız kullanıldığı yerde dinamik import edilir.
 *
 * SENKRON TUT: `extension/lib/asr-engine.ts` bunun kopyasıdır (eklenti ayrı
 * paket, tsconfig `extension/` dışına çıkamaz). Birini değiştirince diğerini de.
 */

export type AsrDevice = "webgpu" | "wasm";
export type AsrDtype = "fp32" | "fp16" | "q8" | "q4";

export type AsrPlan = {
  /** Tanı için kullanıcıya gösterilen kısa ad. */
  label: string;
  modelId: string;
  device: AsrDevice;
  dtype: AsrDtype | Record<string, AsrDtype>;
  /** İlk indirmenin yaklaşık boyutu (MB) — "bir kez iner" metni için. */
  approxMb: number;
  /** GPU hızlandırma yok: gerçek zamanlının gerisinde kalabilir. */
  slow?: boolean;
};

/**
 * Model boyutları (HF hub'daki gerçek dosya boyutları, ~MB):
 *   whisper-small: enc fp16 177 · enc fp32 353 · dec_merged q4 233
 *   whisper-base : enc fp16  41 · enc fp32  83 · dec_merged q4 124 · q8 (hepsi) 77
 * `encoder fp16 + decoder q4` transformers.js'in gerçek-zamanlı Whisper
 * örneğiyle aynı konfig; en hızlısı ama fp16 ZORUNLU.
 */
const SMALL_WEBGPU_FP16: AsrPlan = {
  label: "WebGPU · whisper-small",
  modelId: "onnx-community/whisper-small",
  device: "webgpu",
  dtype: { encoder_model: "fp16", decoder_model_merged: "q4" },
  approxMb: 410,
};

/** fp16 yoksa: küçük modele in ve encoder'ı fp32 sür (her GPU'da çalışır). */
const BASE_WEBGPU_FP32: AsrPlan = {
  label: "WebGPU · whisper-base",
  modelId: "onnx-community/whisper-base",
  device: "webgpu",
  dtype: { encoder_model: "fp32", decoder_model_merged: "q4" },
  approxMb: 207,
};

/** Hiç WebGPU yoksa: CPU. Çalışır ama yavaştır (tek iş parçacığı). */
const BASE_WASM_Q8: AsrPlan = {
  label: "CPU (WASM) · whisper-base",
  modelId: "onnx-community/whisper-base",
  device: "wasm",
  dtype: "q8",
  approxMb: 77,
  slow: true,
};

export type GpuCapabilities = {
  /** `navigator.gpu` var VE bağdaştırıcı alınabildi. */
  available: boolean;
  /** `shader-f16` — fp16 ağırlıkları için şart. */
  fp16: boolean;
};

// WebGPU tipleri projede kurulu değil (@webgpu/types yok) → yapısal minimum tip.
type MinimalAdapter = { features: { has(name: string): boolean } };
type MinimalGpu = { requestAdapter(): Promise<MinimalAdapter | null> };

let capsPromise: Promise<GpuCapabilities> | null = null;

/** Bağdaştırıcıyı bir kez yoklar, sonucu önbelleğe alır. Asla throw etmez. */
export function gpuCapabilities(): Promise<GpuCapabilities> {
  capsPromise ??= (async () => {
    const none: GpuCapabilities = { available: false, fp16: false };
    if (typeof navigator === "undefined") return none;
    const gpu = (navigator as Navigator & { gpu?: MinimalGpu }).gpu;
    if (!gpu) return none;
    try {
      const adapter = await gpu.requestAdapter();
      if (!adapter) return none;
      return { available: true, fp16: adapter.features.has("shader-f16") };
    } catch {
      return none;
    }
  })();
  return capsPromise;
}

/**
 * Denenecek planlar — sırayla. İlki cihazın yeteneğine göre SEÇİLİR (deneme
 * yanılma değil); sonrakiler yine de patlarsa devreye giren yedeklerdir.
 * Saf fonksiyon (test edilebilir); tarayıcıda `asrPlans()` kullanılır.
 */
export function plansFor(caps: GpuCapabilities): AsrPlan[] {
  if (!caps.available) return [BASE_WASM_Q8];
  if (!caps.fp16) return [BASE_WEBGPU_FP32, BASE_WASM_Q8];
  return [SMALL_WEBGPU_FP16, BASE_WEBGPU_FP32, BASE_WASM_Q8];
}

/**
 * Tanı kaçamağı: bir cihazda hangi planın çalıştığını uzaktan denemek için
 * konsoldan `localStorage.setItem("dr.asr", "base" | "wasm" | "small")`.
 * Ayarlıysa merdiven O plandan başlar (altındaki yedekler yine devrede).
 */
export const ASR_OVERRIDE_KEY = "dr.asr";

export function applyOverride(plans: AsrPlan[], override: string | null): AsrPlan[] {
  const ladder = [SMALL_WEBGPU_FP16, BASE_WEBGPU_FP32, BASE_WASM_Q8];
  const at = { small: 0, base: 1, wasm: 2 }[override ?? ""];
  return at === undefined ? plans : ladder.slice(at);
}

export async function asrPlans(): Promise<AsrPlan[]> {
  const plans = plansFor(await gpuCapabilities());
  let override: string | null = null;
  try {
    override = localStorage.getItem(ASR_OVERRIDE_KEY);
  } catch {
    // localStorage kapalı olabilir (gizli mod/izin) — yoksay.
  }
  return applyOverride(plans, override);
}

/**
 * Mesajı ZATEN kullanıcıya gösterilebilir (Türkçe) olan hata — çağıran taraf
 * bunu tekrar çevirmeye kalkmasın diye ayrı sınıf.
 */
export class AsrError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AsrError";
  }
}

/**
 * transformers.js/ONNX Runtime'ın İngilizce hatasını okunur Türkçeye çevirir.
 * Eşleşme yoksa ham mesajı parantez içinde bırakır (tanı için gerekli).
 */
export function asrErrorMessage(e: unknown): string {
  if (e instanceof AsrError) return e.message;
  const raw = e instanceof Error ? e.message : String(e ?? "");
  const low = raw.toLowerCase();

  if (low.includes("does not support fp16")) {
    return "Bu cihazın ekran kartı fp16 desteklemiyor ve uyumlu ayarlar da yüklenemedi. Güncel bir Chrome/Edge dene ya da \"Ses kaydından\" / \"Metin yapıştır\" yolunu kullan.";
  }
  if (low.includes("out of memory") || low.includes("oom") || low.includes("allocation")) {
    return "Cihazın belleği modele yetmedi. Diğer sekmeleri kapatıp tekrar dene; olmazsa \"Ses kaydından\" yolunu kullan.";
  }
  if (
    low.includes("failed to fetch") ||
    low.includes("networkerror") ||
    low.includes("load model") ||
    low.includes("unauthorized") ||
    low.includes("could not locate file")
  ) {
    return "Model indirilemedi. İnternet bağlantını kontrol edip tekrar dene (ilk kullanımda model bir kez iner).";
  }
  if (low.includes("no available backend") || low.includes("backend not found")) {
    return "Tarayıcı cihaz-içi transkript motorunu başlatamadı. Sayfayı yenileyip tekrar dene; sürerse güncel bir Chrome/Edge kullan.";
  }
  return raw
    ? `Transkript başlatılamadı (${raw}).`
    : "Transkript başlatılamadı.";
}

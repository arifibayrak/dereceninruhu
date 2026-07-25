/**
 * Uygulama içi tur durumu.
 *
 * Tur gerçek ekranların üstünde çalışır: adım değiştikçe ilgili sekmeye
 * gidilir ve o ekranın üstünde bir kart görünür. Durum bu yüzden sayfa
 * değişimlerinden ve yenilemeden sağ çıkmalı → sessionStorage.
 *
 * ⚠️ Bu dosya tur METNİNİ import ETMEZ. `<ProductTour/>` her /koc ve /ogrenci
 * sayfasının yerleşiminde duruyor; buradan içeriğe referans verilirse ~70 KB
 * tur metni tüm uygulamanın istemci paketine girer. İçerik yalnız tur
 * başlatıldığında `import()` ile yüklenir.
 */

export type TourId = "ogrenci" | "koc" | "yonetici";

export type TourState = { tourId: TourId; step: number } | null;

const KEY = "dr:tur:aktif:v1";

let state: TourState = null;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): TourState {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "tourId" in parsed &&
      "step" in parsed
    ) {
      const { tourId, step } = parsed as { tourId: unknown; step: unknown };
      if (
        (tourId === "ogrenci" || tourId === "koc" || tourId === "yonetici") &&
        typeof step === "number" &&
        step >= 0
      ) {
        return { tourId, step };
      }
    }
  } catch {
    // Erişilemez depolama — tur oturum içi çalışır, yenilemede kapanır.
  }
  return null;
}

function write(next: TourState) {
  state = next;
  try {
    if (next) window.sessionStorage.setItem(KEY, JSON.stringify(next));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // yoksay
  }
  listeners.forEach((l) => l());
}

export function subscribeTour(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function getTourSnapshot(): TourState {
  // İlk okumada sessionStorage'dan doldur; sonrası bellekten (referans kararlı).
  if (!hydrated) {
    hydrated = true;
    state = read();
  }
  return state;
}

/** Sunucuda ve hydration sırasında tur kapalı görünür. */
export function getTourServerSnapshot(): TourState {
  return null;
}

export function startTour(tourId: TourId) {
  write({ tourId, step: 0 });
}

export function goToStep(step: number) {
  if (!state) return;
  write({ ...state, step: Math.max(0, step) });
}

export function stopTour() {
  write(null);
}

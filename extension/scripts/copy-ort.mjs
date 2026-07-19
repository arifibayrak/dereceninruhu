// ONNX Runtime Web wasm dosyalarını public/ort/ altına kopyalar.
// MV3 uzak-kod yasağı: transformers.js'in ORT wasm'ını eklenti içinden yükleriz
// (offscreen'de env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('/ort/')).
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const nm = join(root, "node_modules");

// onnxruntime-web, @huggingface/transformers'ın (transitif) bağımlılığıdır.
// npm (hoisted), nested ve pnpm sanal store yerleşimlerini destekle.
function findOrtDist() {
  const hoisted = join(nm, "onnxruntime-web", "dist");
  if (existsSync(hoisted)) return hoisted;

  const nested = join(
    nm,
    "@huggingface",
    "transformers",
    "node_modules",
    "onnxruntime-web",
    "dist",
  );
  if (existsSync(nested)) return nested;

  const pnpmDir = join(nm, ".pnpm");
  if (existsSync(pnpmDir)) {
    for (const entry of readdirSync(pnpmDir)) {
      if (entry.startsWith("onnxruntime-web@")) {
        const p = join(pnpmDir, entry, "node_modules", "onnxruntime-web", "dist");
        if (existsSync(p)) return p;
      }
    }
  }
  return null;
}

const src = findOrtDist();
const dest = join(root, "public", "ort");

if (!src) {
  console.warn(
    "[copy-ort] onnxruntime-web/dist bulunamadı. Önce bağımlılıkları kur (pnpm install --ignore-workspace).",
  );
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
let n = 0;
for (const f of readdirSync(src)) {
  // Tüm .wasm + ORT wasm yardımcı (jsep worker) dosyaları.
  if (f.endsWith(".wasm") || f.startsWith("ort-wasm")) {
    copyFileSync(join(src, f), join(dest, f));
    n++;
  }
}
console.log(`[copy-ort] ${n} ORT dosyası kopyalandı: ${src} → public/ort/`);

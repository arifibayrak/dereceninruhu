import { defineConfig } from "wxt";

// WXT — MV3 (Chrome). Yan panel + offscreen + service worker. Manifest buradan
// üretilir. `entrypoints/sidepanel/index.html` → side_panel; `offscreen/index.html`
// → offscreen.html (listelenmeyen sayfa; service worker createDocument ile açar).
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Derecenin Ruhu — Canlı Transkript",
    description:
      "Görüşmeleri cihaz-içi (Whisper Turbo / WebGPU) canlı yazıya çevirir; ses kaydedilmez, yalnız metin işlenir.",
    permissions: ["tabCapture", "sidePanel", "offscreen", "storage", "activeTab"],
    host_permissions: [
      "https://dereceninruhu.com/*",
      "http://localhost/*",
      "http://127.0.0.1/*",
      // Model ağırlıkları (HF hub CDN). Kütüphane kodu paketlenir; yalnız veri çekilir.
      "https://huggingface.co/*",
      "https://*.huggingface.co/*",
    ],
    action: { default_title: "Canlı Transkript" },
    // Sabit eklenti id'si: chgfdngapkpilefnccpijdfomddeepjh
    // (chrome-extension://chgfdngapkpilefnccpijdfomddeepjh). Public SPKI key;
    // id bundan türetilir → dev ve paketlenmiş yüklemede AYNI, app'teki
    // EXTENSION_ORIGIN ile eşleşir. Özel anahtar .keys/dev-key.pem (gitignore);
    // yeniden üret: `node scripts/gen-key.mjs`.
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqQVRLMk6ZRGtuCCz5CBsj5e+mElg9P5s6nMZig0zkniW5YuXuPwHM4NVtQ0fbXDqB52jyKkv5qKXeuhOAby8tuv/8EP2qKLuYWzp+Pc/9l8qlugyVsxGaIC+HQIXd++KvjRkchiqFN3+QgCEFNLIv2X9xctgKQCs8FN46rx4BdTA7KPgWSmuMXhAQHrKeMj3k+HKPt+0LF+QP3y4mUo8dUzJshVQNzmL2sWVpMyLPR733FwDlKEntR2sB7SGU70DtvrVlG3vUqBbIWZlagD6iuYXYkkkpyyFfsznqi8pOnbsvToEJTkni7ThP/rmVF8dN81E0a0dg42mUATTg8q6HQIDAQAB",
  },
});

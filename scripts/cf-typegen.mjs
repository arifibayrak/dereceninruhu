/**
 * `wrangler types` sarmalayıcısı.
 *
 * NEDEN: wrangler, ürettiği `worker-configuration.d.ts` içine wrangler.jsonc'taki
 * `main` alanını referanslayan bir satır koyuyor:
 *
 *     interface GlobalProps { mainModule: typeof import("./worker-entry"); }
 *
 * Bu `typeof import(...)`, `worker-entry.ts`'i tsconfig `exclude`'una RAĞMEN
 * TypeScript programına sokar (exclude, başka bir dosyadan referanslanan dosyayı
 * dışarıda tutmaz). `worker-entry.ts` ise `./.open-next/worker.js`'i import eder —
 * o dosya `next build` çalışırken HENÜZ YOKTUR (OpenNext onu build'den SONRA üretir).
 * Sonuç: temiz bir checkout'ta (Cloudflare Workers Builds) build
 * "Cannot find module './.open-next/worker.js'" ile patlar.
 *
 * `mainModule` bu projede hiç kullanılmıyor; satırı üretimden sonra siliyoruz.
 * Ayrıntı: AGENTS.md → "worker entrypoint is worker-entry.ts".
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT = "worker-configuration.d.ts";

// Paket yöneticisi üzerinden çağrıldığında node_modules/.bin zaten PATH'te; doğrudan
// `node scripts/cf-typegen.mjs` ile çağrılırsa değil — ikisinde de çalışsın.
const binDir = path.join(import.meta.dirname, "..", "node_modules", ".bin");
execFileSync("wrangler", ["types", "--env-interface", "CloudflareEnv"], {
  stdio: "inherit",
  env: { ...process.env, PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
});

const before = readFileSync(OUT, "utf8");
const after = before.replace(/^\t*mainModule: typeof import\("[^"]*"\);\r?\n/m, "");
if (after === before) {
  console.warn(
    `[cf-typegen] uyarı: ${OUT} içinde 'mainModule' satırı bulunamadı — ` +
      "wrangler çıktısı değişmiş olabilir, worker-entry.ts tuzağını yeniden kontrol edin.",
  );
} else {
  writeFileSync(OUT, after);
}

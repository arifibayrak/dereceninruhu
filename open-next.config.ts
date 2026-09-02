import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal for now. When the marketing site needs ISR (Faz 3), add an
// R2 incremental cache here (r2IncrementalCache) backed by the R2 bucket.
const config = {
  ...defineCloudflareConfig({}),
  /*
   * OpenNext varsayılan olarak `pnpm build` çalıştırır. Bu repoda `build`
   * ARTIK OpenNext derlemesinin KENDİSİ (Cloudflare Workers Builds panelden
   * `pnpm run build` çağırıyor ve `.open-next/` üretilmeden deploy
   * "Could not find compiled Open Next config" ile ölüyordu). Dolayısıyla
   * buradaki komut açıkça iç adıma sabitlenmeli — yoksa `build` kendini
   * çağırır ve sonsuz döngüye girer.
   */
  buildCommand: "pnpm build:next",
};

export default config;

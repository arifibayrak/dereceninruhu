/**
 * Secret binding'lerin TİPLERİ (değerleri değil) — git'e girer.
 *
 * `wrangler types` yalnızca `wrangler.jsonc`'taki `vars`'ı ve YEREL `.dev.vars`
 * dosyasını okur. `.dev.vars` git'e girmediği için temiz bir checkout'ta
 * (Cloudflare Workers Builds / CI) üretilen `worker-configuration.d.ts` bu
 * anahtarları İÇERMEZ; `next build` tip denetimi "Property 'X' does not exist
 * on type 'CloudflareEnv'" ile patlar — yerelde her şey yeşilken.
 *
 * Buradaki alanlar `CloudflareEnv` arayüzüne merge edilir. Değerler dağıtımda
 * `wrangler secret put <AD>`, yerelde `.dev.vars` ile gelir. Tipler wrangler'ın
 * ürettiğiyle AYNI olmalı (`string`), aksi halde merge çakışır.
 *
 * Sadece koddan TİPLİ okunan secret'lar buraya yazılır. Kullanım yerinde
 * `(getEnv() as { CRON_SECRET?: string }).CRON_SECRET` gibi cast'lenenler
 * (CRON_SECRET, TELEGRAM_*, RESEND_*, NOTIFY_*) buraya eklenmez.
 */
interface CloudflareEnv {
  BETTER_AUTH_SECRET: string;
  OPENROUTER_API_KEY: string;
}

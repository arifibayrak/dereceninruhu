/**
 * Worker giriş noktası — OpenNext'in ürettiği worker'ı olduğu gibi devralır ve
 * ÜZERİNE bir `scheduled` handler ekler (Cloudflare Cron Trigger'ları için).
 *
 * NEDEN SARMALAYICI: `.open-next/worker.js` her build'de yeniden üretiliyor,
 * yani doğrudan düzenlenemez; OpenNext de `scheduled` export etmiyor. Bu dosya
 * `wrangler.jsonc`'taki `main` olarak duruyor ve üretilen worker'ı içeri alıyor.
 * `fetch` ve Durable Object export'ları DEĞİŞTİRİLMEDEN geçiriliyor — buradaki
 * tek yenilik `scheduled`.
 *
 * ⚠️ tsconfig'te `exclude` edilmiştir: `.open-next/` build çıktısıdır, temiz bir
 * checkout'ta `next build` çalışırken HENÜZ YOKTUR. Wrangler esbuild ile
 * bundle'ladığı için tip kontrolüne ihtiyaç duymaz.
 *
 * İş, `openNextWorker.fetch` üzerinden KENDİ rotasına yapılan bir istekle
 * yapılıyor; böylece OpenNext'in istek bağlamı (D1 binding'leri dahil) normal
 * bir istekteki gibi kuruluyor ve `x-cron-secret` doğrulaması aynı kod
 * yolundan geçiyor.
 */
import openNextWorker from "./.open-next/worker.js";

export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "./.open-next/worker.js";

/**
 * Cron'un tetikleyeceği dahili POST rotaları.
 *
 * ⚠️ `/api/cron/billing` burada YOK ve bu bir eksiklik DEĞİL, karardır
 * (Arif, 2026-08-24): fatura üretmek gerçek öğrencilere gerçek faturalar
 * demek, bu yüzden elle tetikleniyor. Motor idempotent olduğu için teknik bir
 * engel yok — eksik olan tek şey "otomatik bassın" onayı. Eklemeden önce sor.
 */
const CRON_ROUTES = ["/api/cron/impact"] as const;

export default {
  fetch: openNextWorker.fetch,

  async scheduled(
    _controller: ScheduledController,
    env: CloudflareEnv & { CRON_SECRET?: string },
    ctx: ExecutionContext,
  ): Promise<void> {
    const secret = env.CRON_SECRET;
    if (!secret) {
      console.error("[cron] CRON_SECRET tanımsız — atlanıyor");
      return;
    }
    const origin = env.BETTER_AUTH_URL ?? "https://dereceninruhu.com";

    for (const path of CRON_ROUTES) {
      try {
        const res = await openNextWorker.fetch(
          new Request(`${origin}${path}`, {
            method: "POST",
            headers: { "x-cron-secret": secret },
          }),
          env,
          ctx,
        );
        console.log(`[cron] ${path} → ${res.status}`);
      } catch (err) {
        // Bir rota patlarsa diğerleri yine de koşsun.
        console.error(`[cron] ${path} hata:`, err);
      }
    }
  },
};

import { getEnv } from "@/db";
import { generateDueInvoices } from "@/lib/billing";

// Zamanlanmış çağrı — istek başına çalışır.
export const dynamic = "force-dynamic";

/**
 * Otomatik faturalama tetikleyicisi. Herhangi bir zamanlayıcı (Cloudflare cron
 * worker'ı, GitHub Action, harici cron) GÜNDE BİR kez şu şekilde çağırır:
 *
 *   curl -X POST https://dereceninruhu.com/api/cron/billing \
 *     -H "x-cron-secret: $CRON_SECRET"
 *
 * `CRON_SECRET` bir secret'tır: yerelde `.dev.vars`, dağıtımda
 * `wrangler secret put CRON_SECRET`. Motor idempotent olduğu için günde birden
 * çok kez çağrılması güvenlidir.
 */
export async function POST(req: Request): Promise<Response> {
  const provided = req.headers.get("x-cron-secret");
  const secret = (getEnv() as { CRON_SECRET?: string }).CRON_SECRET;
  if (!secret || provided !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await generateDueInvoices(new Date());
  return Response.json({ ok: true, ...result });
}

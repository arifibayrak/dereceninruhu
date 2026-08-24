import { getEnv } from "@/db";
import { refreshImpactStats } from "@/db/queries/cms";

// Zamanlanmış çağrı — istek başına çalışır.
export const dynamic = "force-dynamic";

/**
 * `/basarilar` şeffaflık sayaçlarının yeniden hesaplanması. Herhangi bir
 * zamanlayıcı (Cloudflare cron worker'ı, GitHub Action, harici cron) GÜNDE BİR
 * kez şu şekilde çağırır:
 *
 *   curl -X POST https://dereceninruhu.com/api/cron/impact \
 *     -H "x-cron-secret: $CRON_SECRET"
 *
 * `/api/cron/billing` ile aynı secret'ı ve aynı deseni kullanır. Hesap saf
 * okuma + tek satır upsert olduğu için idempotent; günde birden çok kez
 * çağrılması güvenlidir, yalnız gereksiz tarama maliyeti doğurur.
 *
 * Cron hiç koşmazsa sayfa boş kalmaz: `getPublicImpactStats()` anlık görüntü
 * yoksa bir kereliğine kendisi hesaplar (bkz. @/db/queries/cms).
 */
export async function POST(req: Request): Promise<Response> {
  const provided = req.headers.get("x-cron-secret");
  const secret = (getEnv() as { CRON_SECRET?: string }).CRON_SECRET;
  if (!secret || provided !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await refreshImpactStats();
  return Response.json({ ok: true, ...result });
}

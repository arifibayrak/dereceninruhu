/**
 * dereceninruhu — günlük otomatik faturalama tetikleyicisi.
 * scheduled(): her sabah 06:00 TR'de ana uygulamanın idempotent billing ucunu
 * çağırır. fetch(): x-cron-secret ile elle tetik/test (aynı işi yapar).
 */
type Env = {
  BILLING_URL: string;
  CRON_SECRET: string;
  /** Ana uygulamaya service binding (aynı-zone 1042'yi aşar). */
  APP: { fetch(req: Request): Promise<Response> };
};

async function runBilling(env: Env): Promise<{ status: number; body: string }> {
  const res = await env.APP.fetch(
    new Request(env.BILLING_URL, {
      method: "POST",
      headers: { "x-cron-secret": env.CRON_SECRET },
    }),
  );
  return { status: res.status, body: await res.text() };
}

const handler = {
  async scheduled(
    _event: unknown,
    env: Env,
    ctx: { waitUntil(p: Promise<unknown>): void },
  ): Promise<void> {
    ctx.waitUntil(
      runBilling(env)
        .then((r) => console.log(`[billing-cron] ${r.status} ${r.body}`))
        .catch((e) => console.error("[billing-cron] failed", e)),
    );
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.headers.get("x-cron-secret") !== env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
    const r = await runBilling(env);
    return new Response(r.body, {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  },
};

export default handler;

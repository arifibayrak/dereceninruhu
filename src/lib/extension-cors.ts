import { getEnv } from "@/db";

/**
 * Tarayıcı eklentisi route'ları için asgari CORS. `Authorization` basit-olmayan
 * bir header olduğundan tarayıcı OPTIONS preflight gönderir (route'lar `OPTIONS`
 * export eder). chrome-extension origin'i opaque olduğundan `Allow-Origin` tam
 * origin'i echo etmelidir. Cookie yok (yalnız bearer) → `Allow-Credentials` yok.
 *
 * NOT: CORS yalnız tarayıcı kolaylığıdır; gerçek yetki kapısı bearer token'dır
 * (`requireCoachFromBearer`). İzinli origin(ler) `EXTENSION_ORIGIN` env
 * değişkeninden gelir (virgülle çoklu).
 */

function allowedOrigins(): string[] {
  return (getEnv().EXTENSION_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && allowedOrigins().includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/** OPTIONS preflight yanıtı (204 + CORS header'ları). */
export function preflight(req: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

/** Var olan bir Response'a CORS header'larını ekleyip döndürür. */
export function withCors(res: Response, req: Request): Response {
  const headers = corsHeaders(req.headers.get("origin"));
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

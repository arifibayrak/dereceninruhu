import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";
import { withD1Retry } from "@/lib/d1-retry";

/**
 * DB handle bound to the D1 binding `DB`.
 * Use in Server Components / Server Actions / route handlers.
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(withD1Retry(env.DB), { schema });
}

/**
 * Async variant for contexts evaluated outside a request (e.g. during
 * static generation) where the Cloudflare context must be awaited.
 */
export async function getDbAsync() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(withD1Retry(env.DB), { schema });
}

export type DB = ReturnType<typeof getDb>;

/**
 * Full Cloudflare env (bindings + secrets) for the current request.
 * Prefer the typed accessors below; use this for secrets like
 * `OPENROUTER_API_KEY`.
 */
export function getEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}

/** R2 bucket binding (`R2` → dereceninruhu-files): görüşme kayıtları/dosyalar. */
export function getR2() {
  return getCloudflareContext().env.R2;
}

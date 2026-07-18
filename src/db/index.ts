import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * DB handle bound to the D1 binding `DB`.
 * Use in Server Components / Server Actions / route handlers.
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

/**
 * Async variant for contexts evaluated outside a request (e.g. during
 * static generation) where the Cloudflare context must be awaited.
 */
export async function getDbAsync() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}

export type DB = ReturnType<typeof getDb>;

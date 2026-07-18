import type { Config } from "drizzle-kit";

// D1 (SQLite). Generate migrations with `pnpm db:generate`, then apply with
// `pnpm db:migrate:local` (Miniflare) or `pnpm db:migrate:remote` (real D1).
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
} satisfies Config;

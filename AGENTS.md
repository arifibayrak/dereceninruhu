<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Derecenin Ruhu — build conventions (READ BEFORE CODING)

Turkish exam-prep coaching (mentorluk) OS. All-Cloudflare. Full plan:
`~/.claude/plans/indexed-giggling-treehouse.md`.

## Stack
- **Next.js 16.2** App Router + **Turbopack** (default; no `--turbopack` flag).
- Deploy target **Cloudflare Workers** via `@opennextjs/cloudflare` (OpenNext 1.20).
- **D1 (SQLite)** + **Drizzle ORM 0.45**. **R2** for files. **Better Auth 1.6** (phone+PIN).
- Tailwind v4 + shadcn/ui. Recharts. Zod. date-fns (`tr` locale).
- Package manager: **pnpm**. Node 24.

## Next.js 16 rules (breaking vs your training data)
- **Request APIs are async-only.** `await cookies()`, `await headers()`, `await draftMode()`.
  `params` and `searchParams` are **Promises** in `page.tsx`/`layout.tsx`/`route.ts` — always `await` them.
  Use the generated `PageProps<'/path'>`, `LayoutProps<'/path'>`, `RouteContext<'/path'>` helpers
  (run `npx next typegen` if missing).
- **`middleware` → `proxy`.** Use `proxy.ts` with `export function proxy(req)`. Node runtime only (no edge).
- **`next lint` is removed.** Lint via `eslint` directly (already the `lint` script). `next build` does not lint.
- **No `serverRuntimeConfig` / `publicRuntimeConfig`.** Read `process.env` in Server Components;
  client values need `NEXT_PUBLIC_`. For Cloudflare bindings/secrets use `getCloudflareContext().env` (below).
- **`revalidateTag(tag)` needs a 2nd arg** now: `revalidateTag('x', 'max')`. Prefer `updateTag`/`refresh`
  in Server Actions for read-your-writes.
- Parallel-route slots require an explicit `default.tsx`. Turbopack config is top-level (`turbopack: {}`),
  not `experimental.turbopack`.
- Don't reach for `cacheComponents`/PPR or `reactCompiler` unless asked.

## Cloudflare / data access
- Get bindings via `getDb()` / `getDbAsync()` from `@/db` (wraps `getCloudflareContext().env.DB`).
  Never construct a driver directly. R2 is `env.R2`.
- Bindings are typed by `wrangler types` → `cloudflare-env.d.ts` (run `pnpm cf-typegen` after editing
  `wrangler.jsonc`). Env interface is the global `CloudflareEnv`.
- Migrations: edit `src/db/schema.ts` → `pnpm db:generate` → `pnpm db:migrate:local`. Seed: `pnpm db:seed:local`.
- Local dev/preview uses a local (Miniflare) D1; the placeholder `database_id` in `wrangler.jsonc` is fine locally.

## Domain rules (non-negotiable)
- **Turkish-first.** All user-facing copy in Turkish. Locale `tr-TR`, timezone `Europe/Istanbul`,
  **weeks start Monday**. Turkish slugs for routes (`/ogrenci`, `/koc`, `/denemeler`…).
- **Money = integer kuruş** everywhere (SQLite has no decimal). Never store money as float. Format with
  `Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })` from kuruş/100.
- **Net = doğru − yanlış / divisor**; divisor is `exam_sections.wrong_penalty_divisor` (**3** for LGS,
  **4** for YKS/KPSS). Store `net` as a REAL snapshot at write time (formula changes never rewrite history).
- Subjects roll up via `parent_subject_id` + `is_scored`: students log GEO/MANTIK separately, but mocks/nets
  only reference scored parents (MAT). Use the shared helper in `@/lib/net`.
- **Two roles, no approval workflow.** Both students and coaches write the same tracking tables; enforce
  authorization in the Server-Action layer (students: only their own enrollment). Never trust client role.
- All tracking rows FK **`enrollment_id`**, not `student_id`.

## Style
- Mobile-first (students are on phones). Server Components by default; Server Actions for mutations; `"use client"`
  only where interactivity is needed. Validate every action input with Zod. Keep components small and typed.

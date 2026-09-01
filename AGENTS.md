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
- Tailwind v4 + shadcn/ui. Recharts. Zod. Tarih/saat: **kendi `@/lib/dates`** modülü
  (`tr` locale, Europe/Istanbul, hafta Pazartesi) — `date-fns` KULLANILMIYOR, bağımlılıktan çıkarıldı.
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
- **The worker entrypoint is `worker-entry.ts`, NOT `.open-next/worker.js`.** OpenNext regenerates its
  worker on every build, so a `scheduled` handler can't live there. The wrapper imports the generated
  worker and passes `fetch` plus the three Durable Object exports through **unchanged**; it only adds
  `scheduled`. Don't point `main` back at `.open-next/worker.js` — that silently drops every cron.
  `worker-entry.ts` is in tsconfig `exclude` on purpose (`.open-next/` doesn't exist during `next build`
  on a clean checkout; wrangler bundles it with esbuild, no typecheck needed).
- **The build must work from a CLEAN CHECKOUT — Cloudflare Workers Builds rebuilds from git on every
  push to `main`.** Three things are gitignored and therefore absent in CI, and each one used to break
  that build while everything stayed green locally:
  1. `worker-configuration.d.ts` (D1/R2/`CloudflareEnv` types) — so `pnpm build` regenerates it first
     via `node scripts/cf-typegen.mjs`. Never assume the checked-out tree has it.
  2. `.dev.vars` — `wrangler types` reads secrets from it, so in CI the generated `CloudflareEnv` has
     **no secret keys**. Secrets read with a type (`getEnv().OPENROUTER_API_KEY`) must be declared in
     the committed `cloudflare-secrets.d.ts`, which merges into `CloudflareEnv`; declare them `string`
     to match wrangler's output or the interface merge conflicts. Secrets cast at the call site
     (`(getEnv() as { CRON_SECRET?: string })`) need no entry.
  3. `.open-next/` — hence `scripts/cf-typegen.mjs` rather than a bare `wrangler types`: wrangler
     emits `mainModule: typeof import("./worker-entry")` into the generated `.d.ts`, and that
     `typeof import(...)` drags `worker-entry.ts` into the TS program **despite** tsconfig `exclude`
     (exclude does not cover files referenced from elsewhere). The wrapper strips that one line.
  Verify a change against CI without pushing: copy the tracked files only, then install and build —
  `git ls-files -z | rsync -a -0 --files-from=- . /tmp/ci && cd /tmp/ci && pnpm install
  --frozen-lockfile && pnpm exec opennextjs-cloudflare build`.
  Workers Builds does NOT run D1 migrations (see "Deploy ≠ migrate"), and passes the commit sha as
  `WORKERS_CI_COMMIT_SHA` — `next.config.ts` falls back to it for `deploymentId` so version-skew
  protection survives a git-triggered deploy.
- **Cron = `triggers.crons` in `wrangler.jsonc` + `CRON_ROUTES` in `worker-entry.ts`.** The handler POSTs
  to the app's own route through `openNextWorker.fetch`, so the OpenNext request context (D1 bindings)
  is set up exactly as in a normal request and the `x-cron-secret` check runs on the same code path.
  Test it with `npx wrangler dev --test-scheduled` then `curl localhost:8788/__scheduled`.
  `/api/cron/billing` is deliberately NOT scheduled — generating invoices has monetary consequences.
- **D1 allows max 100 bound parameters PER QUERY.** Any query whose `?` count grows with the data —
  multi-row `insert … values (…),(…)`, `inArray(col, ids)` — must be split with `chunkForD1(rows, paramsPerRow)`
  from `@/lib/d1` (a row costs one `?` per column that has a value or `$defaultFn`; autoincrement `id` is free).
  It silently works in dev with small data and fails in prod ("Failed query: insert into …"). `notInArray`
  can NOT be chunked — read the current rows, diff in JS, then delete with a chunked `inArray`.
- **D1 allows max 5 terms in a compound SELECT** (`union all` fan-out fails with "too many terms in
  compound SELECT"). Need one value per row of a list? Use a **correlated scalar subquery** on the driving
  table, not `union all` and not `max(x) … group by` — the group-by scans the whole index (see
  `latestPerEnrollment` in `@/db/queries/roster`: 10.806 → 89 rows read for the same result).
  Rows read is the metric that matters; check a query with
  `wrangler d1 execute … --remote --json --command "explain query plan …"`.

## Client → Server Action calls
- **Never `await someAction(...)` directly from a client component — always
  `await callAction(someAction, ...)` (`@/lib/action-client`).** Transport failures (mobile connection
  drop, worker 500, a deploy invalidating the tab's action id) REJECT the promise; they never reach
  `guarded` on the server. An unwrapped `await` skips the rest of the handler, so `setSaving(false)`
  never runs and the button hangs on "Kaydediliyor…" with no error — the "donuyor, kaydetmiyor" bug.
  `callAction` turns every failure into an `ActionResult`, so forms only ever read `res.ok`.
- Writing N rows means ONE action taking an array, never a loop of N action calls: each call is a
  separate HTTP round trip (see `addPlanTasks`).

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

## Positioning & growth mechanics (premium — non-negotiable)
This is a **premium, high-demand, exclusive** service: restricted access is the quality signal.
All copy and UX should read that way — calm and credible, never bargain-y or hard-sell.
- **Batch/cohort ("dönem").** Availability is framed as strictly limited batches. There is ONE **global**
  active dönem for the whole business, stored as a singleton row in `cohort_settings` (id=1), edited by
  admins in `/koc/site` → **Dönem** tab. Read it via `getCohort()`; derive the view-model with
  `cohortView()` / `enrollmentOpen()` from `@/lib/cohort`.
- **Displayed numbers are admin-controlled marketing values — NEVER the truth.** `displayCapacity` /
  `displayFilled` are what the admin chooses to publish. **Never** expose real capacity or real enrollment
  on public surfaces. The real active-student count (`countActiveStudents()`) is admin-only reference,
  shown beside the published number in `/koc/site` and must never reach a public page/HTML.
- **FOMO = genuine & tasteful.** No aggressive popups/blinking timers. Mixed framing: **ratio**
  ("Bu dönem için son N kontenjan", `<ScarcityBadge/>`) on pricing surfaces; **no-cap**
  ("Sınırlı kontenjan" + a calm close-date countdown, `<CohortBanner/>`) on hero/bands. `scarcityVisible`
  is the site-wide kill switch; when dönem `status ∈ {dolu,kapali}` enroll CTAs flip to the waitlist.
- **Waitlist + backlog.** Overflow demand is captured in `waitlist_entries` (public `/bekleme-listesi`
  form → `createWaitlistEntry`). Coaches manage the backlog at `/koc/bekleme` (FIFO queue position,
  status pipeline, WhatsApp touchpoints). Keep-warm/invite templates live in `@/lib/whatsapp`
  (`beklemeNurture`, `beklemeDavet`).
- **Coach applications (admin-only).** Public `/koc-basvuru` form → `coach_applications`. Reviewed ONLY by
  admins at `/koc/basvurular` (gate on `role === "admin"`; there is no "admin/admin" login). No
  auto-provisioning — "Koça çevir" prefills the existing add-coach form in `/koc/yonetim`.
- **Reuse the leads pattern** (`leads` table + `createLead` + `/koc/leadler`) for any new public-intake →
  admin-tracker feature: public action (no auth) with Zod + `website` honeypot, then a role-gated status
  pipeline. Don't invent a new shape.

## Performance (mobile is the target — students are on phones)
- **NEVER let the LCP element depend on JS to become visible.** A `motion.div` with
  `initial={{opacity:0}}` renders `style="opacity:0"` into the SSR HTML, so the element cannot paint until
  the whole bundle downloads and React hydrates. This cost the hero `<h1>` **4.5 s of LCP** (mobile 68).
  Above-the-fold entrance animations are **CSS only** (`.hero-in` in `globals.css`); `HeroReveal` is a
  Server Component and must stay one. The check that matters: `observedLCP` should equal `observedFCP`.
- **Fonts are preloaded from `public/fonts/` with stable filenames.** Importing a font package puts a
  content-hash in the filename, so no `<link rel="preload">` can be written and the browser only discovers
  the font *after* parsing CSS (HTML → CSS → font). Bricolage `@font-face` rules live in `globals.css`;
  the woff2 files are copied out of `@fontsource-variable/bricolage-grotesque` (re-copy both on upgrade).
  `crossOrigin` on the preload is **required** or the file downloads twice.
- **Only load a font where it is used.** `GeistMono` in the root layout downloaded 70KB at *High* priority
  on marketing pages with no monospace text — it lives in `/koc`, `/ogrenci`, `/marka` layouts instead.
- Keep heavyweight client libs off marketing routes. `motion` was 44KB gzip for two animations; `sonner`
  needs BOTH the `<Toaster>` and `StaleVersionWatch` to avoid a static import or it stays in the bundle.
- **Static assets are cached by `public/_headers`, not by any Next config.** Cloudflare Workers Assets
  defaults to `public, max-age=0, must-revalidate` — content-hashed chunks included — so every navigation
  spent a conditional-GET round trip per asset (22 of them on the homepage). `/_next/static/*` is
  `immutable`; `/fonts/*` is **deliberately not** — font filenames are kept stable so they can be
  preloaded, so `immutable` would strand everyone on an old face after an upgrade.
- **A `"use client"` component must never import from a module that imports `@/db`.** Pulling in a single
  constant drags the whole Drizzle schema + D1 query layer into the browser bundle (139 KB, measured).
  Nothing warns you: typecheck, lint and build all pass. Shared constants belong in a client-safe module
  like `@/lib/seo`. Verify after a build — the marketing page's chunks must contain zero `drizzle`.
- **Measuring:** the anonymous PageSpeed API returns 429 (`quota_limit_value: 0`). Run Lighthouse locally
  and **take the median of 3** — TTFB variance swings the score ~8 points. Measured origin cost is only
  ~100 ms over a pure edge asset, so caching the marketing pages is not the lever it looks like.
- **Marketing pages cannot use ISR/`revalidate`.** They read D1, and D1 is not bound during `next build`;
  making the shell non-dynamic turns its children static and the build fails with
  "getCloudflareContext … route is not static". `force-dynamic` there is deliberate, not an oversight.

## Structured data (JSON-LD)
- **`aggregateRating` and `Review.itemReviewed` may ONLY hang off `Course`.** Google's review-snippet
  support list excludes `Service` and `Person`, and the self-serving-review policy excludes
  `Organization`/`LocalBusiness` for reviews hosted on the entity's own site. Anything else silently
  invalidates the item in Search Console. Use `coachingCourseSchema()`; do not re-add a `withRating`
  option to `serviceSchema`/`personSchema`.

## Style
- Mobile-first (students are on phones). Server Components by default; Server Actions for mutations; `"use client"`
  only where interactivity is needed. Validate every action input with Zod. Keep components small and typed.

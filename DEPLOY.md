# Deploy — Cloudflare go-live checklist

All-Cloudflare (Workers + D1 + R2). Steps marked **(you)** need Arif's interactive
Cloudflare login and can't be automated from the sandbox.

## 1. Authenticate & provision **(you)**

```bash
wrangler login                                   # opens browser
wrangler d1 create dereceninruhu-db              # → copy the returned database_id
wrangler r2 bucket create dereceninruhu-files
```

Paste the real `database_id` into `wrangler.jsonc` (replacing the `0000…0000` placeholder).

## 2. Secrets & env **(you)**

```bash
# Generate a strong secret (macOS/Linux):
openssl rand -base64 32
wrangler secret put BETTER_AUTH_SECRET           # paste the value above
wrangler secret put BETTER_AUTH_URL              # https://dereceninruhu.com
```

(`.dev.vars` covers local only; production uses `wrangler secret`.)

## 3. Migrate + seed the remote D1

```bash
pnpm db:migrate:remote                           # applies drizzle/migrations to prod D1
# Seed exam templates on remote (the tsx seeder is local-only). Generate + run SQL:
#   pnpm db:generate is schema-only; for seed, execute the seed as SQL against remote:
wrangler d1 execute dereceninruhu-db --remote --command \
  "SELECT count(*) FROM exam_templates;"          # sanity check after seeding
```

> Remote seed: the `pnpm db:seed:local` runner writes to the local Miniflare sqlite.
> For production, either (a) run a one-off seed via a temporary route/Worker, or
> (b) export the seed as SQL and `wrangler d1 execute --remote --file=seed.sql`.
> Tracked as a follow-up before first production use.

## 4. Deploy

```bash
pnpm run deploy                                   # opennextjs-cloudflare build && deploy (bare `pnpm deploy` hits pnpm's workspace-deploy builtin)
```

## 5. Custom domain **(you)**

Add `dereceninruhu.com` (and `www`) to the Worker in the Cloudflare dashboard
(Workers & Pages → your worker → Custom Domains), or via `wrangler`. Point DNS at
Cloudflare.

## 6. First run

Visit `https://dereceninruhu.com/kurulum` to create the first admin (koç) account,
then sign in at `/giris`. Add the second coach from the koç panel.

## 7. SEO / GEO go-live — human tasks (Cloudflare dashboard / DNS / Search Console) **(you)**

The code side is done (metadataBase, OpenGraph/Twitter + `public/og.png`, JSON-LD,
`sitemap.ts`, `robots.ts`, `manifest.ts`, `llms.txt`, keyword landing pages, `/hakkinda`).
These steps can't be automated from the sandbox:

1. **robots.txt override.** Cloudflare's zone-managed "Content Signals / managed robots.txt"
   intercepts `/robots.txt` at the edge (live one is `text/html`, no `Sitemap:`). Dashboard →
   `dereceninruhu.com` zone → disable managed robots.txt (AI Audit / Scrape Shield area) so the
   Worker's `robots.ts` (`text/plain`, with `Sitemap:` + AI-crawler allows) is served. Verify:
   `curl -sI https://dereceninruhu.com/robots.txt` → `content-type: text/plain`.
2. **www → apex.** `www.dereceninruhu.com` is currently NXDOMAIN. Add a proxied `www` DNS record,
   then create a **Redirect Rule**: `http.host == "www.dereceninruhu.com"` → 308 to
   `https://dereceninruhu.com` (preserve path + query).
3. **Google Search Console** (+ optionally Bing Webmaster): add & verify the property, submit
   `https://dereceninruhu.com/sitemap.xml`, request indexing of `/`, `/hakkinda`, `/yks-koclugu`,
   `/lgs-koclugu`, `/kpss-koclugu`, `/fiyatlar`.
4. **Social `sameAs`.** Fill the real Instagram / YouTube / TikTok URLs in `SOCIAL_LINKS`
   (`src/lib/seo.ts`) — they flow into Organization + Person JSON-LD (`sameAs`).
5. After deploy, test OG rendering in the WhatsApp / X / Facebook share debuggers, and run the
   **Google Rich Results Test** on `/`, `/koclar`, `/fiyatlar`, a `/blog/[slug]`, a `/{sınav}-koclugu`.

> Brand OG image: `node scripts/generate-og.cjs` regenerates `public/og.png` + `src/app/apple-icon.png`.

---

### Notes
- `compatibility_date` in `wrangler.jsonc` is `2026-07-01` with `nodejs_compat`.
- Money is stored as integer kuruş; no decimal columns.
- Cron triggers (haftalık roll-up, aylık fatura) are added in Faz 2 / Faz 4 with a
  scheduled handler.

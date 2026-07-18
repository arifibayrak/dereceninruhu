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
pnpm deploy                                       # opennextjs-cloudflare build && deploy
```

## 5. Custom domain **(you)**

Add `dereceninruhu.com` (and `www`) to the Worker in the Cloudflare dashboard
(Workers & Pages → your worker → Custom Domains), or via `wrangler`. Point DNS at
Cloudflare.

## 6. First run

Visit `https://dereceninruhu.com/kurulum` to create the first admin (koç) account,
then sign in at `/giris`. Add the second coach from the koç panel.

---

### Notes
- `compatibility_date` in `wrangler.jsonc` is `2026-07-01` with `nodejs_compat`.
- Money is stored as integer kuruş; no decimal columns.
- Cron triggers (haftalık roll-up, aylık fatura) are added in Faz 2 / Faz 4 with a
  scheduled handler.

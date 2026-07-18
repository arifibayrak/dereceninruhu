# Derecenin Ruhu

Turkish exam-prep coaching (mentorluk) OS for **LGS / YKS / KPSS** — replaces
per-student Google Sheets with a fast, mobile-first, two-sided web app
(öğrenci self-report + koç review) plus a marketing funnel and accounting.

Domain: **dereceninruhu.com** · Practice: Arif + **Ahmet Hakan Almak**.

## Stack (all-Cloudflare)

- **Next.js 16** App Router (Turbopack) → **Cloudflare Workers** via `@opennextjs/cloudflare`
- **D1** (SQLite) + **Drizzle ORM** · **R2** (files) · **Workers Cron** (later phases)
- **Better Auth** — phone + PIN (WhatsApp davet, no SMS)
- **Tailwind v4 + shadcn (Base UI)** · **Recharts** · **Zod** · self-hosted fonts (Geist + Bricolage)
- Turkish-first · `tr-TR` · Europe/Istanbul · **money = integer kuruş** · weeks start Monday

## Local development

```bash
pnpm install
pnpm db:generate         # regenerate migrations after schema.ts changes
pnpm db:migrate:local    # apply migrations to the local (Miniflare) D1
pnpm db:seed:local       # seed the 3 exam templates (KPSS/YKS/LGS), sections, subjects
pnpm dev                 # http://localhost:3000  (use PORT=3001 if 3000 is busy)
```

First run: open **`/kurulum`** to create the first admin (koç) account, then sign in at
**`/giris`**. Create a student in `/koc/ogrenciler/yeni` → send the WhatsApp davet link →
student sets a PIN at `/davet/[code]` and lands in `/ogrenci`.

## Verify

```bash
pnpm test                # unit tests (net math, insights) — vitest
pnpm exec tsc --noEmit   # typecheck
pnpm exec eslint         # lint
pnpm build               # production (Turbopack) build
```

> Sandbox note: `next dev`/`next build` and `wrangler` bind local ports; run them
> outside a restrictive sandbox. `tsc`/`eslint`/`vitest` run anywhere.

## Architecture

- `src/db/schema.ts` — full relational model (33 tables): template · student · tracking ·
  içerik · muhasebe · CMS layers. All tracking FKs `enrollment_id`. `net` is a REAL
  snapshot; money is `*_kurus` integers.
- `src/db/seed/*` — exam-template seed (LGS/YKS/KPSS: sections, tracks, subjects with
  `parent_subject_id`/`is_scored`/`track_codes`, net divisors 3/4).
- `src/lib/*` — pure, tested logic: `net` (computeNet + child roll-up), `dates`
  (Monday weeks, Istanbul), `insights` (auto-insights engine), `exam` (track/scored
  resolution), `format`, `validation` (Zod), `phone`, `whatsapp` (wa.me templates),
  `auth`/`session`.
- `src/actions/*` — role-scoped Server Actions (öğrenci CRUD, davet kabul, soru upsert,
  deneme entry with net + roll-up, analiz flag).
- `src/components/brand/*` + `src/app/marka` — design system + style-guide.

## Net & exams (the engine)

One schema serves all three exams via seeded templates. Net = `doğru − yanlış / divisor`
(divisor **3** LGS, **4** YKS/KPSS, from `exam_sections`). Students log GEO/MANTIK
separately but mocks/nets roll them into MAT via `parent_subject_id` + `is_scored`.

## Roadmap

- **Faz 0** ✅ foundation · data layer · auth core · brand system
- **Faz 1** 🚧 takip çekirdeği (roster · soru · deneme/net · auto-insights) + Sheets migration
- **Faz 2** koçluk döngüsü (haftalık program + görüşmeler)
- **Faz 3** pazarlama sitesi + blog + lead funnel
- **Faz 4** muhasebe & tahsilat
- **Faz 5** içerik + deneme analizi (TOPLAM EKSİK) + retention

Full plan: `~/.claude/plans/indexed-giggling-treehouse.md`.

Deploy checklist: see [DEPLOY.md](./DEPLOY.md).

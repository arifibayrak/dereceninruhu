/**
 * Blog seed → uzak D1 için SQL üretir (yalnız yazım anında).
 *   pnpm exec tsx scripts/gen-blog-sql.ts > /tmp/blog-posts.sql
 *   npx wrangler d1 execute dereceninruhu-db --remote --file=/tmp/blog-posts.sql
 *
 * INSERT OR IGNORE (doğal anahtar: slug) — üretimde zaten var olan yazılar
 * atlanır, yenileri eklenir. Yazar = ilk coach/admin kullanıcı (alt sorgu).
 * Zaman damgaları Unix SANİYE (schema mode:"timestamp").
 */
import { blogPostSeeds } from "../src/db/seed/cms-content";

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const nowSec = Math.floor(Date.now() / 1000);
const AUTHOR =
  "(SELECT id FROM users WHERE role IN ('coach','admin') ORDER BY created_at ASC LIMIT 1)";

const lines: string[] = [
  "-- Derecenin Ruhu blog yazıları (idempotent, slug'a göre INSERT OR IGNORE)",
];

for (const p of blogPostSeeds) {
  const pub = Math.floor(new Date(`${p.publishedAt}T00:00:00+03:00`).getTime() / 1000);
  lines.push(
    `INSERT OR IGNORE INTO blog_posts ` +
      `(slug, title, excerpt, body, status, published_at, author_user_id, created_at, updated_at) VALUES (` +
      `${q(p.slug)}, ${q(p.title)}, ${q(p.excerpt)}, ${q(p.body)}, 'published', ${pub}, ${AUTHOR}, ${nowSec}, ${nowSec});`,
  );
}

process.stdout.write(lines.join("\n") + "\n");

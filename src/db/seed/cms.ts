/**
 * Faz 3 CMS seed — `pnpm db:seed:cms` (tsx).
 *
 * Yerel D1 (miniflare) SQLite dosyasına better-sqlite3 ile bağlanır
 * (bkz. seed/index.ts). İçerik `cms-content.ts` modülünden gelir.
 *
 * İdempotent ve TAHRİPSİZ: her varlık doğal anahtarına göre yalnız YOKSA
 * eklenir (testimonials.student_name, faqs.question, packages.name,
 * blog_posts.slug, coach_profiles.user_id). Panelden yapılan düzenlemeler
 * seed'in yeniden çalıştırılmasıyla ASLA ezilmez.
 *
 * NOT: Paket fiyatları YER TUTUCU — gerçek fiyatları /koc/site'ten gir.
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { asc, eq, inArray } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema";
import {
  blogPostSeeds,
  coachContent,
  coachStats,
  teamCoachSeeds,
  faqSeeds,
  packageSeeds,
  testimonialSeeds,
} from "./cms-content";

type SeedDb = BetterSQLite3Database<typeof schema>;

const { blogPosts, coachProfiles, faqs, packages, testimonials, users } = schema;

/** Newest .sqlite under .wrangler/state/v3/d1 (miniflare's local D1). */
function findLocalD1SqliteFile(): string | null {
  const root = path.join(process.cwd(), ".wrangler", "state", "v3", "d1");
  if (!fs.existsSync(root)) return null;
  const entries = fs.readdirSync(root, {
    recursive: true,
    withFileTypes: true,
  });
  const candidates = entries
    .filter((e) => e.isFile() && e.name.endsWith(".sqlite"))
    .map((e) => path.join(e.parentPath, e.name))
    .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.p ?? null;
}

/** TRT gün başlangıcı olarak ISO gün → Date. */
function trtDay(iso: string): Date {
  return new Date(`${iso}T00:00:00+03:00`);
}

interface Counts {
  inserted: number;
  skipped: number;
}

function seedCms(db: SeedDb): Record<string, Counts> {
  const counts: Record<string, Counts> = {
    coach_profiles: { inserted: 0, skipped: 0 },
    testimonials: { inserted: 0, skipped: 0 },
    faqs: { inserted: 0, skipped: 0 },
    packages: { inserted: 0, skipped: 0 },
    blog_posts: { inserted: 0, skipped: 0 },
  };

  // -- Koç kullanıcısı (profil + yazı yazarı için) --------------------------
  const coachUser = db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.role, ["coach", "admin"]))
    .orderBy(asc(users.createdAt))
    .get();

  if (!coachUser) {
    console.warn(
      "Uyarı: coach/admin kullanıcı yok — koç profili atlandı, blog yazarı boş bırakıldı.\n" +
        "Önce /kurulum'dan ilk koç hesabını oluşturup seed'i tekrar çalıştırın.",
    );
  }

  // -- Koç profili (doğal anahtar: user_id) ---------------------------------
  if (coachUser) {
    const existing = db
      .select({ id: coachProfiles.id })
      .from(coachProfiles)
      .where(eq(coachProfiles.userId, coachUser.id))
      .get();
    if (existing) {
      counts.coach_profiles.skipped++;
    } else {
      db.insert(coachProfiles)
        .values({
          userId: coachUser.id,
          slug: coachContent.slug,
          displayName: coachContent.displayName,
          title: coachContent.title,
          location: coachContent.location,
          bio: coachContent.bio,
          photoUrl: coachContent.photoUrl,
          subjects: JSON.stringify(coachContent.subjects),
          achievements: JSON.stringify(coachContent.credentials),
          proofUrl: coachStats.proofUrl,
          sortOrder: 0,
          isActive: true,
        })
        .run();
      counts.coach_profiles.inserted++;
    }
  }

  // -- Ekip koçları (doğal anahtar: slug; hesapsız — user_id NULL) ----------
  // Hesabı olmayan koç sitede görünür ama giriş yapamaz/öğrenci atanamaz.
  // Hesap açılınca user_id doldurulur ve koç profilini kendisi yönetir.
  for (const c of teamCoachSeeds) {
    const existing = db
      .select({ id: coachProfiles.id })
      .from(coachProfiles)
      .where(eq(coachProfiles.slug, c.slug))
      .get();
    if (existing) {
      counts.coach_profiles.skipped++;
      continue;
    }
    db.insert(coachProfiles)
      .values({
        userId: null,
        slug: c.slug,
        displayName: c.displayName,
        title: c.title,
        location: c.location,
        headline: c.headline,
        bio: c.bio,
        photoUrl: c.photoUrl,
        subjects: JSON.stringify(c.subjects),
        achievements: JSON.stringify(c.credentials),
        sortOrder: c.sortOrder,
        isActive: true,
      })
      .run();
    counts.coach_profiles.inserted++;
  }

  // -- Yorumlar (doğal anahtar: student_name) -------------------------------
  for (const [i, t] of testimonialSeeds.entries()) {
    const existing = db
      .select({ id: testimonials.id })
      .from(testimonials)
      .where(eq(testimonials.studentName, t.studentName))
      .get();
    if (existing) {
      counts.testimonials.skipped++;
      continue;
    }
    db.insert(testimonials)
      .values({
        studentName: t.studentName,
        exam: t.exam,
        quote: t.quote,
        sortOrder: i,
        isActive: t.isActive,
        createdAt: trtDay(t.date),
      })
      .run();
    counts.testimonials.inserted++;
  }

  // -- SSS (doğal anahtar: question) ----------------------------------------
  for (const [i, f] of faqSeeds.entries()) {
    const existing = db
      .select({ id: faqs.id })
      .from(faqs)
      .where(eq(faqs.question, f.question))
      .get();
    if (existing) {
      counts.faqs.skipped++;
      continue;
    }
    db.insert(faqs)
      .values({
        question: f.question,
        answer: f.answer,
        sortOrder: i,
        isActive: true,
      })
      .run();
    counts.faqs.inserted++;
  }

  // -- Paketler (doğal anahtar: name; fiyatlar PLACEHOLDER) -----------------
  for (const [i, p] of packageSeeds.entries()) {
    const existing = db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.name, p.name))
      .get();
    if (existing) {
      counts.packages.skipped++;
      continue;
    }
    db.insert(packages)
      .values({
        name: p.name,
        kind: p.kind ?? "kocluk",
        priceKurus: p.priceKurus,
        // Eskiden yazılmıyordu: kolon ve public render vardı ama indirim
        // rozeti DB paketlerinde hiç çalışmıyordu.
        compareAtKurus: p.compareAtKurus ?? null,
        period: p.period,
        lessonHours: p.lessonHours ?? null,
        features: JSON.stringify(p.features),
        sortOrder: i,
        isActive: true,
      })
      .run();
    counts.packages.inserted++;
  }

  // -- Blog yazıları (doğal anahtar: slug) ----------------------------------
  for (const post of blogPostSeeds) {
    const existing = db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.slug, post.slug))
      .get();
    if (existing) {
      counts.blog_posts.skipped++;
      continue;
    }
    db.insert(blogPosts)
      .values({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        status: "published",
        publishedAt: trtDay(post.publishedAt),
        authorUserId: coachUser?.id ?? null,
      })
      .run();
    counts.blog_posts.inserted++;
  }

  return counts;
}

function main() {
  const sqlitePath = findLocalD1SqliteFile();
  if (!sqlitePath) {
    console.error(
      [
        "Yerel D1 veritabanı bulunamadı (.wrangler/state/v3/d1 altında .sqlite yok).",
        "Önce migration'ları uygulayın:",
        "",
        "  pnpm db:migrate:local",
        "",
        "sonra tekrar `pnpm db:seed:cms` çalıştırın.",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(`Yerel D1: ${path.relative(process.cwd(), sqlitePath)}`);
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("foreign_keys = ON");
  const db: SeedDb = drizzle(sqlite, { schema });

  try {
    const counts = db.transaction(() => seedCms(db));
    console.log("CMS seed tamam:");
    for (const [table, c] of Object.entries(counts)) {
      console.log(`  ${table}: ${c.inserted} eklendi, ${c.skipped} atlandı (mevcut)`);
    }
    console.log(
      "\nHatırlatma: paket fiyatları YER TUTUCU — /koc/site → Paketler'den gerçek fiyatları girin.",
    );
  } finally {
    sqlite.close();
  }
}

main();

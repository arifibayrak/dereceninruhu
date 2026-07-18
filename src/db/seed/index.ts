/**
 * Idempotent local seed runner: `pnpm db:seed:local` (tsx).
 *
 * Runs OUTSIDE a request context, so it cannot use getCloudflareContext().
 * Instead it opens the local D1 SQLite file that wrangler/miniflare creates
 * under `.wrangler/state/v3/d1/**` with better-sqlite3.
 *
 * Upserts by natural keys (template.code; section/track code within template;
 * subject code within section) — safe to re-run without duplicating rows.
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema";
import { examTemplateSeeds, type SubjectSeed } from "./exam-templates";

type SeedDb = BetterSQLite3Database<typeof schema>;

const { examTemplates, examSections, tracks, subjects } = schema;

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

interface Counts {
  inserted: number;
  updated: number;
}

function seedTemplates(db: SeedDb): Record<string, Counts> {
  const counts: Record<string, Counts> = {
    exam_templates: { inserted: 0, updated: 0 },
    tracks: { inserted: 0, updated: 0 },
    exam_sections: { inserted: 0, updated: 0 },
    subjects: { inserted: 0, updated: 0 },
  };

  for (const tpl of examTemplateSeeds) {
    // -- template (natural key: code) --------------------------------------
    let template = db
      .select()
      .from(examTemplates)
      .where(eq(examTemplates.code, tpl.code))
      .get();
    if (template) {
      db.update(examTemplates)
        .set({ name: tpl.name })
        .where(eq(examTemplates.id, template.id))
        .run();
      counts.exam_templates.updated++;
    } else {
      template = db
        .insert(examTemplates)
        .values({ code: tpl.code, name: tpl.name })
        .returning()
        .get();
      counts.exam_templates.inserted++;
    }
    const templateId = template.id;

    // -- tracks (natural key: templateId + code) ---------------------------
    for (const trk of tpl.tracks) {
      const existing = db
        .select()
        .from(tracks)
        .where(
          and(eq(tracks.examTemplateId, templateId), eq(tracks.code, trk.code)),
        )
        .get();
      if (existing) {
        db.update(tracks)
          .set({ name: trk.name, sortOrder: trk.sortOrder })
          .where(eq(tracks.id, existing.id))
          .run();
        counts.tracks.updated++;
      } else {
        db.insert(tracks)
          .values({
            examTemplateId: templateId,
            code: trk.code,
            name: trk.name,
            sortOrder: trk.sortOrder,
          })
          .run();
        counts.tracks.inserted++;
      }
    }

    // -- sections + subjects ----------------------------------------------
    for (const sec of tpl.sections) {
      let section = db
        .select()
        .from(examSections)
        .where(
          and(
            eq(examSections.examTemplateId, templateId),
            eq(examSections.code, sec.code),
          ),
        )
        .get();
      if (section) {
        db.update(examSections)
          .set({
            name: sec.name,
            wrongPenaltyDivisor: sec.wrongPenaltyDivisor,
            sortOrder: sec.sortOrder,
          })
          .where(eq(examSections.id, section.id))
          .run();
        counts.exam_sections.updated++;
      } else {
        section = db
          .insert(examSections)
          .values({
            examTemplateId: templateId,
            code: sec.code,
            name: sec.name,
            wrongPenaltyDivisor: sec.wrongPenaltyDivisor,
            sortOrder: sec.sortOrder,
          })
          .returning()
          .get();
        counts.exam_sections.inserted++;
      }
      const sectionId = section.id;

      // Parents are listed before their children in the seed arrays, so a
      // single pass with a code→id map resolves parent_subject_id.
      const idByCode = new Map<string, number>();
      for (const sub of sec.subjects) {
        const parentSubjectId = resolveParentId(sub, idByCode);
        const values = {
          examSectionId: sectionId,
          code: sub.code,
          name: sub.name,
          parentSubjectId,
          isScored: sub.isScored,
          trackCodes: sub.trackCodes ? JSON.stringify(sub.trackCodes) : null,
          officialQuestionCount: sub.officialQuestionCount ?? null,
          sortOrder: sub.sortOrder,
          chartColor: sub.chartColor ?? null,
        };
        const existing = db
          .select()
          .from(subjects)
          .where(
            and(
              eq(subjects.examSectionId, sectionId),
              eq(subjects.code, sub.code),
            ),
          )
          .get();
        if (existing) {
          db.update(subjects)
            .set(values)
            .where(eq(subjects.id, existing.id))
            .run();
          idByCode.set(sub.code, existing.id);
          counts.subjects.updated++;
        } else {
          const inserted = db.insert(subjects).values(values).returning().get();
          idByCode.set(sub.code, inserted.id);
          counts.subjects.inserted++;
        }
      }
    }
  }

  return counts;
}

function resolveParentId(
  sub: SubjectSeed,
  idByCode: Map<string, number>,
): number | null {
  if (!sub.parentCode) return null;
  const parentId = idByCode.get(sub.parentCode);
  if (parentId === undefined) {
    throw new Error(
      `Seed hatası: ${sub.code} konusunun üst dersi ${sub.parentCode} henüz eklenmemiş (seed sırasını kontrol edin).`,
    );
  }
  return parentId;
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
        "sonra tekrar `pnpm db:seed:local` çalıştırın.",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(`Yerel D1: ${path.relative(process.cwd(), sqlitePath)}`);
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("foreign_keys = ON");
  const db: SeedDb = drizzle(sqlite, { schema });

  try {
    const counts = db.transaction(() => seedTemplates(db));
    console.log("Seed tamam:");
    for (const [table, c] of Object.entries(counts)) {
      console.log(
        `  ${table}: ${c.inserted} eklendi, ${c.updated} güncellendi`,
      );
    }
  } finally {
    sqlite.close();
  }
}

main();

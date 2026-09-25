/**
 * Konu seed'inin gerçek (in-memory) SQLite üstünde doğrulaması:
 * gerçek migration SQL'i uygulanır, şablon seed verisinden dersler eklenir,
 * seedTopics iki kez koşturulup idempotency kanıtlanır.
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { beforeAll, describe, expect, it } from "vitest";

import * as schema from "../schema";
import { examTemplateSeeds } from "./exam-templates";
import {
  MAARIF_PREFIX,
  seedTopics,
  topicSeeds,
  type SeedDb,
} from "./topics";

const { examTemplates, examSections, subjects, topics } = schema;

const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");

function runMigrationFile(sqlite: Database.Database, file: string) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  for (const stmt of sql.split("--> statement-breakpoint")) {
    const trimmed = stmt.trim();
    if (trimmed) sqlite.exec(trimmed);
  }
}

function createDbWithSchema(): { db: SeedDb; sqlite: Database.Database } {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) runMigrationFile(sqlite, file);
  return { db: drizzle(sqlite, { schema }), sqlite };
}

/**
 * Şablon seed verisinden template/section/subject satırlarını düz ekler.
 * Migration'ın zaten eklediği şablonlar (DGS — 0031) atlanır.
 */
function insertTemplates(db: SeedDb) {
  for (const tpl of examTemplateSeeds) {
    const exists = db
      .select({ id: examTemplates.id })
      .from(examTemplates)
      .where(eq(examTemplates.code, tpl.code))
      .get();
    if (exists) continue;
    const template = db
      .insert(examTemplates)
      .values({ code: tpl.code, name: tpl.name })
      .returning()
      .get();
    for (const sec of tpl.sections) {
      const section = db
        .insert(examSections)
        .values({
          examTemplateId: template.id,
          code: sec.code,
          name: sec.name,
          wrongPenaltyDivisor: sec.wrongPenaltyDivisor,
          sortOrder: sec.sortOrder,
        })
        .returning()
        .get();
      const idByCode = new Map<string, number>();
      for (const sub of sec.subjects) {
        const inserted = db
          .insert(subjects)
          .values({
            examSectionId: section.id,
            code: sub.code,
            name: sub.name,
            parentSubjectId: sub.parentCode
              ? (idByCode.get(sub.parentCode) ?? null)
              : null,
            isScored: sub.isScored,
            sortOrder: sub.sortOrder,
          })
          .returning()
          .get();
        idByCode.set(sub.code, inserted.id);
      }
    }
  }
}

function topicNames(
  db: SeedDb,
  templateCode: string,
  sectionCode: string,
  subjectCode: string,
): { name: string; sortOrder: number }[] {
  return db
    .select({ name: topics.name, sortOrder: topics.sortOrder })
    .from(topics)
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .innerJoin(examSections, eq(examSections.id, subjects.examSectionId))
    .innerJoin(
      examTemplates,
      eq(examTemplates.id, examSections.examTemplateId),
    )
    .where(
      and(
        eq(examTemplates.code, templateCode),
        eq(examSections.code, sectionCode),
        eq(subjects.code, subjectCode),
      ),
    )
    .all()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function topicCountFor(
  db: SeedDb,
  templateCode: string,
  sectionCode: string,
  subjectCode: string,
): number {
  const rows = db
    .select({ id: topics.id })
    .from(topics)
    .innerJoin(subjects, eq(subjects.id, topics.subjectId))
    .innerJoin(examSections, eq(examSections.id, subjects.examSectionId))
    .innerJoin(
      examTemplates,
      eq(examTemplates.id, examSections.examTemplateId),
    )
    .where(
      and(
        eq(examTemplates.code, templateCode),
        eq(examSections.code, sectionCode),
        eq(subjects.code, subjectCode),
      ),
    )
    .all();
  return rows.length;
}

describe("topic seed", () => {
  let db: SeedDb;
  let sqlite: Database.Database;
  /** Migration 0031'in boş veritabanına eklediği DGS konuları (seed'den önce). */
  let dgsFromMigration: Record<string, { name: string; sortOrder: number }[]>;

  beforeAll(() => {
    ({ db, sqlite } = createDbWithSchema());
    dgsFromMigration = Object.fromEntries(
      ["TUR", "MAT", "GEO"].map((c) => [c, topicNames(db, "DGS", "DGS", c)]),
    );
    insertTemplates(db);
  });

  it("covers every seed group with an existing subject and inserts all topics", () => {
    const result = seedTopics(db);
    expect(result.missingSubjects).toEqual([]);
    const expected = topicSeeds.reduce((acc, g) => acc + g.topics.length, 0);
    // DGS konularını migration 0031 zaten ekledi; seed onları yalnız günceller.
    const dgs = topicSeeds
      .filter((g) => g.template === "DGS")
      .reduce((acc, g) => acc + g.topics.length, 0);
    expect(result.inserted).toBe(expected - dgs);
    expect(result.updated).toBe(dgs);
  });

  it("migration 0031 DGS konuları seed ile birebir aynı (ad + sıra)", () => {
    for (const g of topicSeeds.filter((g) => g.template === "DGS")) {
      expect(dgsFromMigration[g.subject]).toEqual(
        g.topics.map((name, i) => ({ name, sortOrder: i + 1 })),
      );
    }
    expect(topicCountFor(db, "DGS", "DGS", "TUR")).toBe(23 + 13);
    expect(topicCountFor(db, "DGS", "DGS", "MAT")).toBe(29 + 10);
    expect(topicCountFor(db, "DGS", "DGS", "GEO")).toBe(13 + 4);
  });

  it("migration 0031 Maarif konuları seed ile aynı ve tekrar çalıştırılabilir", () => {
    const before = db.select({ id: topics.id }).from(topics).all().length;
    runMigrationFile(sqlite, "0031_dgs_maarif.sql");
    runMigrationFile(sqlite, "0031_dgs_maarif.sql");
    expect(db.select({ id: topics.id }).from(topics).all().length).toBe(before);

    const kim = topicNames(db, "YKS", "TYT", "TYT_KIM");
    expect(kim.filter((t) => t.name.startsWith(MAARIF_PREFIX))).toHaveLength(3);
    // Maarif konuları eski konuların ARKASINDA.
    expect(kim[0].name).toBe("Kimya Bilimi");
    expect(kim[kim.length - 1].name).toBe(
      "Maarif · Sürdürülebilirlik (Redoks, Yeşil Kimya)",
    );
  });

  it("seeds the exact KPSS sheet lists", () => {
    expect(topicCountFor(db, "KPSS", "KPSS_GY", "TUR")).toBe(21);
    expect(topicCountFor(db, "KPSS", "KPSS_GY", "MAT")).toBe(33);
    expect(topicCountFor(db, "KPSS", "KPSS_GY", "GEO")).toBe(13);
    expect(topicCountFor(db, "KPSS", "KPSS_GK", "TAR")).toBe(20);
    expect(topicCountFor(db, "KPSS", "KPSS_GK", "COG")).toBe(14);
    expect(topicCountFor(db, "KPSS", "KPSS_GK", "VAT")).toBe(11);
  });

  it("seeds YKS (TYT) and LGS subjects", () => {
    expect(topicCountFor(db, "YKS", "TYT", "TUR")).toBeGreaterThan(15);
    expect(topicCountFor(db, "YKS", "TYT", "MAT")).toBeGreaterThan(20);
    expect(topicCountFor(db, "YKS", "TYT", "TYT_FIZ")).toBeGreaterThan(5);
    expect(topicCountFor(db, "LGS", "LGS_SOZEL", "TUR")).toBeGreaterThan(10);
    expect(topicCountFor(db, "LGS", "LGS_SAYISAL", "MAT")).toBe(13);
    expect(topicCountFor(db, "LGS", "LGS_SAYISAL", "FEN")).toBe(7);
  });

  it("is idempotent — a second run inserts nothing and keeps counts stable", () => {
    const before = db.select({ id: topics.id }).from(topics).all().length;
    const result = seedTopics(db);
    expect(result.inserted).toBe(0);
    expect(result.missingSubjects).toEqual([]);
    const after = db.select({ id: topics.id }).from(topics).all().length;
    expect(after).toBe(before);
  });

  it("keeps sortOrder aligned with the sheet order", () => {
    const rows = db
      .select({ name: topics.name, sortOrder: topics.sortOrder })
      .from(topics)
      .innerJoin(subjects, eq(subjects.id, topics.subjectId))
      .innerJoin(examSections, eq(examSections.id, subjects.examSectionId))
      .innerJoin(
        examTemplates,
        eq(examTemplates.id, examSections.examTemplateId),
      )
      .where(
        and(
          eq(examTemplates.code, "KPSS"),
          eq(examSections.code, "KPSS_GY"),
          eq(subjects.code, "TUR"),
        ),
      )
      .all()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    expect(rows[0].name).toBe("Sözcükte Anlam");
    expect(rows[rows.length - 1].name).toBe("Sözel Muhakeme ve Mantık");
  });
});

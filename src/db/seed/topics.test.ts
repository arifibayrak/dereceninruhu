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
import { seedTopics, topicSeeds, type SeedDb } from "./topics";

const { examTemplates, examSections, subjects, topics } = schema;

function createDbWithSchema(): SeedDb {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) sqlite.exec(trimmed);
    }
  }
  return drizzle(sqlite, { schema });
}

/** Şablon seed verisinden template/section/subject satırlarını düz ekler. */
function insertTemplates(db: SeedDb) {
  for (const tpl of examTemplateSeeds) {
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

  beforeAll(() => {
    db = createDbWithSchema();
    insertTemplates(db);
  });

  it("covers every seed group with an existing subject and inserts all topics", () => {
    const result = seedTopics(db);
    expect(result.missingSubjects).toEqual([]);
    const expected = topicSeeds.reduce((acc, g) => acc + g.topics.length, 0);
    expect(result.inserted).toBe(expected);
    expect(result.updated).toBe(0);
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

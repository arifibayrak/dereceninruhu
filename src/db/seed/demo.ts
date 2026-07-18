/**
 * Demo seed — a few realistic students with soru logs + denemeler so the app
 * can be explored populated (roster staleness, cockpit charts, insights).
 * NOT for production. Run: `pnpm exec tsx src/db/seed/demo.ts`
 * Idempotent: students are marked notes='DEMO'; re-running clears + reinserts them.
 * Requires `pnpm db:migrate:local` + `pnpm db:seed:local` first (needs templates).
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { eq, inArray } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema";
import { computeNet } from "../../lib/net";

const {
  examTemplates,
  examSections,
  subjects,
  tracks,
  students,
  enrollments,
  questionLogs,
  mockExams,
  mockExamResults,
} = schema;

type DemoDb = BetterSQLite3Database<typeof schema>;

function findLocalD1SqliteFile(): string | null {
  const root = path.join(process.cwd(), ".wrangler", "state", "v3", "d1");
  if (!fs.existsSync(root)) return null;
  const entries = fs.readdirSync(root, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".sqlite"))
    .map((e) => path.join(e.parentPath, e.name))
    .map((p) => ({ p, mtime: fs.statSync(p).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return files[0]?.p ?? null;
}

const DAY = 86_400_000;
/** Local (TRT) day-start Date, `daysAgo` before today. */
function dayAgo(daysAgo: number): Date {
  const now = Date.now() + 3 * 3_600_000; // shift to TRT wall clock
  const d = new Date(now - daysAgo * DAY);
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() - 3 * 3_600_000);
}

type DemoStudent = {
  fullName: string;
  phone: string;
  examCode: "KPSS" | "YKS" | "LGS";
  trackCode?: "SAY" | "EA" | "SOZ";
  field?: string;
  target: string;
  /** Primary section for mocks. */
  primarySection: string;
  /** Days since last soru entry (staleness). */
  lastActiveDaysAgo: number;
  /** Rising net totals across 3 mocks (approx; D/Y/B synthesized). */
  mockNetBase: number;
};

const DEMO: DemoStudent[] = [
  { fullName: "Almina Çelebioğlu", phone: "5384360511", examCode: "KPSS", field: "Adalet", target: "Zabıt Katipliği", primarySection: "KPSS_GY", lastActiveDaysAgo: 0, mockNetBase: 34 },
  { fullName: "Merve Karagöz", phone: "5301112233", examCode: "KPSS", field: "Genel İdare", target: "İlk 5.000", primarySection: "KPSS_GY", lastActiveDaysAgo: 1, mockNetBase: 30 },
  { fullName: "Yusuf Koçer", phone: "5322223344", examCode: "YKS", trackCode: "SAY", target: "Bilgisayar Müh.", primarySection: "TYT", lastActiveDaysAgo: 0, mockNetBase: 72 },
  { fullName: "Dilan Toprak", phone: "5333334455", examCode: "YKS", trackCode: "EA", target: "Hukuk", primarySection: "TYT", lastActiveDaysAgo: 2, mockNetBase: 66 },
  { fullName: "Furkan Kaya", phone: "5344445566", examCode: "KPSS", field: "Eğitim", target: "Öğretmenlik", primarySection: "KPSS_GK", lastActiveDaysAgo: 6, mockNetBase: 28 },
  { fullName: "Beren Yıldız", phone: "5355556677", examCode: "LGS", target: "Fen Lisesi", primarySection: "LGS_SAYISAL", lastActiveDaysAgo: 1, mockNetBase: 78 },
];

function main() {
  const sqlitePath = findLocalD1SqliteFile();
  if (!sqlitePath) {
    console.error("Yerel D1 bulunamadı. Önce: pnpm db:migrate:local && pnpm db:seed:local");
    process.exit(1);
  }
  const sqlite = new Database(sqlitePath);
  sqlite.pragma("busy_timeout = 8000");
  sqlite.pragma("foreign_keys = ON");
  const db: DemoDb = drizzle(sqlite, { schema });

  // Lookups
  const tpl = Object.fromEntries(db.select().from(examTemplates).all().map((t) => [t.code, t]));
  const secRows = db.select().from(examSections).all();
  const subRows = db.select().from(subjects).all();
  const trackRows = db.select().from(tracks).all();
  const sectionByTplCode = (tplId: number, code: string) =>
    secRows.find((s) => s.examTemplateId === tplId && s.code === code)!;
  const subjectsOfSection = (secId: number) => subRows.filter((s) => s.examSectionId === secId);

  db.transaction(() => {
    // Clear prior demo rows (children first; FK cascade may be off).
    const oldStudents = db.select().from(students).where(eq(students.notes, "DEMO")).all();
    if (oldStudents.length) {
      const enrs = db
        .select()
        .from(enrollments)
        .where(inArray(enrollments.studentId, oldStudents.map((s) => s.id)))
        .all();
      const enrIds = enrs.map((e) => e.id);
      if (enrIds.length) {
        const mocks = db.select().from(mockExams).where(inArray(mockExams.enrollmentId, enrIds)).all();
        const mockIds = mocks.map((m) => m.id);
        if (mockIds.length)
          db.delete(mockExamResults).where(inArray(mockExamResults.mockExamId, mockIds)).run();
        db.delete(mockExams).where(inArray(mockExams.enrollmentId, enrIds)).run();
        db.delete(questionLogs).where(inArray(questionLogs.enrollmentId, enrIds)).run();
        db.delete(enrollments).where(inArray(enrollments.id, enrIds)).run();
      }
      db.delete(students).where(inArray(students.id, oldStudents.map((s) => s.id))).run();
    }

    let studentCount = 0, logCount = 0, mockCount = 0;

    for (const d of DEMO) {
      const template = tpl[d.examCode];
      const trackId = d.trackCode
        ? trackRows.find((t) => t.examTemplateId === template.id && t.code === d.trackCode)!.id
        : null;

      const student = db
        .insert(students)
        .values({
          fullName: d.fullName,
          phone: d.phone,
          field: d.field ?? null,
          status: "active",
          notes: "DEMO",
        })
        .returning()
        .get();
      studentCount++;

      const enrollment = db
        .insert(enrollments)
        .values({
          studentId: student.id,
          examTemplateId: template.id,
          trackId,
          targetText: d.target,
          startDate: dayAgo(60),
          status: "active",
        })
        .returning()
        .get();

      // Soru logs: last 21 days, scored subjects of both sections, skip recent
      // days per staleness. Deterministic counts (varied).
      const loggable = secRows
        .filter((s) => s.examTemplateId === template.id)
        .flatMap((s) => subjectsOfSection(s.id))
        .filter((s) => s.isScored);
      for (let day = 21; day >= d.lastActiveDaysAgo; day--) {
        if (day % 7 === 6) continue; // rest one day a week
        const logDate = dayAgo(day);
        loggable.forEach((sub, i) => {
          const count = 15 + ((day * 7 + i * 11) % 6) * 10;
          db.insert(questionLogs)
            .values({ enrollmentId: enrollment.id, logDate, subjectId: sub.id, questionCount: count })
            .run();
          logCount++;
        });
      }

      // Mocks: 3 on the primary section, rising nets.
      const section = sectionByTplCode(template.id, d.primarySection);
      const scored = subjectsOfSection(section.id).filter((s) => s.isScored);
      const perSubjectBase = Math.max(4, Math.round(d.mockNetBase / scored.length));
      for (let m = 0; m < 3; m++) {
        const mock = db
          .insert(mockExams)
          .values({
            enrollmentId: enrollment.id,
            examSectionId: section.id,
            scope: "full",
            publisher: ["Yargı", "Benim Hocam", "3D"][m],
            name: `${m + 1}. Deneme`,
            takenOn: dayAgo(18 - m * 7),
          })
          .returning()
          .get();
        mockCount++;
        for (const sub of scored) {
          const q = sub.officialQuestionCount ?? 20;
          const correct = Math.min(q, perSubjectBase + m * 2 + (sub.sortOrder % 3));
          const wrong = Math.min(q - correct, 4);
          const blank = Math.max(0, q - correct - wrong);
          db.insert(mockExamResults)
            .values({
              mockExamId: mock.id,
              subjectId: sub.id,
              correctCount: correct,
              wrongCount: wrong,
              blankCount: blank,
              net: computeNet(correct, wrong, section.wrongPenaltyDivisor),
            })
            .run();
        }
      }
    }

    console.log(`Demo seed: ${studentCount} öğrenci, ${logCount} soru kaydı, ${mockCount} deneme eklendi.`);
  });

  sqlite.close();
}

main();

import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { studyLogs, subjects } from "@/db/schema";
import { addDays, startOfTrtDay, weekRange } from "@/lib/dates";

export type StudyLogRow = {
  id: number;
  subjectId: number | null;
  subjectName: string | null;
  minutes: number;
  source: "timer" | "manual";
  note: string | null;
  proofKey: string | null;
  logDate: Date;
  createdAt: Date;
};

/** Çalışma kayıtları (ders adıyla) — gün filtresi opsiyonel; yeniden eskiye. */
export async function listStudyLogs(
  enrollmentId: number,
  opts?: { day?: Date; limit?: number },
): Promise<StudyLogRow[]> {
  const db = getDb();
  const conds = [eq(studyLogs.enrollmentId, enrollmentId)];
  if (opts?.day) {
    const start = startOfTrtDay(opts.day);
    const end = addDays(start, 1);
    conds.push(gte(studyLogs.logDate, start), lt(studyLogs.logDate, end));
  }
  const rows = await db
    .select({
      id: studyLogs.id,
      subjectId: studyLogs.subjectId,
      subjectName: subjects.name,
      minutes: studyLogs.minutes,
      source: studyLogs.source,
      note: studyLogs.note,
      proofKey: studyLogs.proofKey,
      logDate: studyLogs.logDate,
      createdAt: studyLogs.createdAt,
    })
    .from(studyLogs)
    .leftJoin(subjects, eq(subjects.id, studyLogs.subjectId))
    .where(and(...conds))
    .orderBy(desc(studyLogs.createdAt), desc(studyLogs.id))
    .limit(opts?.limit ?? 100);
  return rows;
}

async function sumMinutes(
  enrollmentId: number,
  start: Date,
  end: Date,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${studyLogs.minutes}), 0)` })
    .from(studyLogs)
    .where(
      and(
        eq(studyLogs.enrollmentId, enrollmentId),
        gte(studyLogs.logDate, start),
        lt(studyLogs.logDate, end),
      ),
    );
  return Number(row?.total ?? 0);
}

/** Bir günün toplam çalışma dakikası. */
export async function getStudyDayTotal(
  enrollmentId: number,
  day: Date = new Date(),
): Promise<number> {
  const start = startOfTrtDay(day);
  return sumMinutes(enrollmentId, start, addDays(start, 1));
}

/** Bu haftanın (Pazartesi başlangıç) toplam çalışma dakikası. */
export async function getStudyWeekTotal(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<number> {
  const { start, end } = weekRange(now);
  return sumMinutes(enrollmentId, start, end);
}

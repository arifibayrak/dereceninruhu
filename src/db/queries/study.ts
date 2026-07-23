import { and, desc, eq, gt, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { studyLogs, subjects } from "@/db/schema";
import {
  addDays,
  mondayOf,
  startOfTrtDay,
  trDayKey,
  weekRange,
} from "@/lib/dates";

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

/** Tüm zamanların toplam çalışma dakikası. */
export async function getTotalStudyMinutes(
  enrollmentId: number,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${studyLogs.minutes}), 0)` })
    .from(studyLogs)
    .where(eq(studyLogs.enrollmentId, enrollmentId));
  return Number(row?.total ?? 0);
}

export type WeeklyStudyPoint = {
  /** Haftanın pazartesi günü (trDayKey). */
  weekKey: string;
  weekStart: Date;
  minutes: number;
};

/** Son N haftanın haftalık çalışma dakikası (boş haftalar 0 ile döner). */
export async function getWeeklyStudyMinutes(
  enrollmentId: number,
  weeks = 8,
  now: Date = new Date(),
): Promise<WeeklyStudyPoint[]> {
  const db = getDb();
  const thisMonday = mondayOf(now);
  const firstMonday = addDays(thisMonday, -7 * (weeks - 1));
  const rows = await db
    .select({ logDate: studyLogs.logDate, minutes: studyLogs.minutes })
    .from(studyLogs)
    .where(
      and(
        eq(studyLogs.enrollmentId, enrollmentId),
        gte(studyLogs.logDate, firstMonday),
      ),
    );

  const buckets = new Map<string, number>();
  for (const r of rows) {
    const key = trDayKey(mondayOf(r.logDate));
    buckets.set(key, (buckets.get(key) ?? 0) + r.minutes);
  }

  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(firstMonday, i * 7);
    const weekKey = trDayKey(weekStart);
    return { weekKey, weekStart, minutes: buckets.get(weekKey) ?? 0 };
  });
}

export type StudySubjectRow = {
  /** null = derssiz (Genel/karışık) kayıtlar. */
  subjectId: number | null;
  subjectName: string;
  chartColor: string | null;
  minutes: number;
};

/**
 * Son N haftada ders ders toplam çalışma dakikası, çoktan aza sıralı.
 * `subjectId IS NULL` (derssiz kayıtlar) tek bir "Genel" satırında toplanır.
 */
export async function getStudyBySubject(
  enrollmentId: number,
  weeks = 8,
  now: Date = new Date(),
): Promise<StudySubjectRow[]> {
  const db = getDb();
  const thisMonday = mondayOf(now);
  const firstMonday = addDays(thisMonday, -7 * (weeks - 1));
  const rows = await db
    .select({
      subjectId: studyLogs.subjectId,
      subjectName: subjects.name,
      chartColor: subjects.chartColor,
      minutes: sql<number>`coalesce(sum(${studyLogs.minutes}), 0)`,
    })
    .from(studyLogs)
    .leftJoin(subjects, eq(subjects.id, studyLogs.subjectId))
    .where(
      and(
        eq(studyLogs.enrollmentId, enrollmentId),
        gte(studyLogs.logDate, firstMonday),
      ),
    )
    .groupBy(studyLogs.subjectId);

  return rows
    .map((r) => ({
      subjectId: r.subjectId,
      subjectName: r.subjectName ?? "Genel",
      chartColor: r.chartColor ?? null,
      minutes: Number(r.minutes),
    }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** Çalışma yapılan (dakika > 0) TRT gün anahtarları — seri hesabı için. */
export async function getStudyDayKeys(enrollmentId: number): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ logDate: studyLogs.logDate })
    .from(studyLogs)
    .where(
      and(eq(studyLogs.enrollmentId, enrollmentId), gt(studyLogs.minutes, 0)),
    );
  return [...new Set(rows.map((r) => trDayKey(r.logDate)))];
}

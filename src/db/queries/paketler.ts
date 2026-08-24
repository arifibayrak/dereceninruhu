import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import {
  coachProfiles,
  enrollmentPackages,
  privateLessons,
  subjects,
  topics,
  users,
} from "@/db/schema";
import { selectInChunks } from "@/lib/d1";
import {
  accruedHours,
  mergeQuota,
  quotaSummary,
  type PackageKind,
  type QuotaSummary,
  type Renewal,
} from "@/lib/ozel-ders";

export type EnrollmentPackageRow = {
  id: number;
  packageId: number | null;
  name: string;
  priceKurus: number;
  kind: PackageKind;
  lessonHoursGranted: number;
  renewal: Renewal;
  hoursPerPeriod: number;
  /** Bugüne kadar TANINMIŞ toplam saat (yenilenen pakette dönem × saat). */
  accruedHours: number;
  startsOn: Date | null;
  endsOn: Date | null;
  status: "aktif" | "bitti" | "iptal";
  note: string | null;
};

export type PrivateLessonRow = {
  id: number;
  enrollmentPackageId: number | null;
  packageName: string | null;
  subjectId: number | null;
  subjectName: string | null;
  topicId: number | null;
  topicName: string | null;
  /** Ham kimlikler: düzenleme formu seçiciyi bunlarla doldurur. */
  instructorUserId: string | null;
  instructorProfileId: number | null;
  instructorName: string | null;
  scheduledAt: Date | null;
  heldAt: Date | null;
  durationMinutes: number;
  status: "scheduled" | "held" | "cancelled" | "missed";
  countsAgainstQuota: boolean;
  note: string | null;
  studentVisibleNote: string | null;
  meetingUrl: string | null;
};

/** Kayda atanmış paketler — iptaller dahil, en yenisi üstte. */
export async function listEnrollmentPackages(
  enrollmentId: number,
  now: Date = new Date(),
): Promise<EnrollmentPackageRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: enrollmentPackages.id,
      packageId: enrollmentPackages.packageId,
      name: enrollmentPackages.nameSnapshot,
      priceKurus: enrollmentPackages.priceKurusSnapshot,
      kind: enrollmentPackages.kind,
      lessonHoursGranted: enrollmentPackages.lessonHoursGranted,
      renewal: enrollmentPackages.renewal,
      hoursPerPeriod: enrollmentPackages.hoursPerPeriod,
      startsOn: enrollmentPackages.startsOn,
      endsOn: enrollmentPackages.endsOn,
      status: enrollmentPackages.status,
      note: enrollmentPackages.note,
    })
    .from(enrollmentPackages)
    .where(eq(enrollmentPackages.enrollmentId, enrollmentId))
    .orderBy(desc(enrollmentPackages.startsOn), desc(enrollmentPackages.id));
  // Tanınan saat okuma anında türetilir — yenilenen pakette dönem sayısıyla.
  return rows.map((r) => ({ ...r, accruedHours: accruedHours(r, now) }));
}

/**
 * Kaydın özel dersleri.
 *
 * Eğitmen adı iki kaynaktan gelebilir: uygulama hesabı olan koç (`users.name`)
 * ya da hesabı olmayan dış öğretmen (`coach_profiles.display_name`). İkisi de
 * LEFT JOIN, hangisi doluysa o kullanılır.
 */
export async function listPrivateLessons(
  enrollmentId: number,
  opts?: { limit?: number },
): Promise<PrivateLessonRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: privateLessons.id,
      enrollmentPackageId: privateLessons.enrollmentPackageId,
      packageName: enrollmentPackages.nameSnapshot,
      subjectId: privateLessons.subjectId,
      subjectName: subjects.name,
      topicId: privateLessons.topicId,
      topicName: topics.name,
      instructorUserId: privateLessons.instructorUserId,
      instructorProfileId: privateLessons.instructorProfileId,
      instructorUserName: users.name,
      instructorProfileName: coachProfiles.displayName,
      scheduledAt: privateLessons.scheduledAt,
      heldAt: privateLessons.heldAt,
      durationMinutes: privateLessons.durationMinutes,
      status: privateLessons.status,
      countsAgainstQuota: privateLessons.countsAgainstQuota,
      note: privateLessons.note,
      studentVisibleNote: privateLessons.studentVisibleNote,
      meetingUrl: privateLessons.meetingUrl,
    })
    .from(privateLessons)
    .leftJoin(
      enrollmentPackages,
      eq(enrollmentPackages.id, privateLessons.enrollmentPackageId),
    )
    .leftJoin(subjects, eq(subjects.id, privateLessons.subjectId))
    .leftJoin(topics, eq(topics.id, privateLessons.topicId))
    .leftJoin(users, eq(users.id, privateLessons.instructorUserId))
    .leftJoin(
      coachProfiles,
      eq(coachProfiles.id, privateLessons.instructorProfileId),
    )
    .where(eq(privateLessons.enrollmentId, enrollmentId))
    .orderBy(
      desc(privateLessons.heldAt),
      desc(privateLessons.scheduledAt),
      desc(privateLessons.id),
    )
    .limit(opts?.limit ?? 200);

  return rows.map((r) => ({
    id: r.id,
    enrollmentPackageId: r.enrollmentPackageId,
    packageName: r.packageName,
    subjectId: r.subjectId,
    subjectName: r.subjectName,
    topicId: r.topicId,
    topicName: r.topicName,
    instructorUserId: r.instructorUserId,
    instructorProfileId: r.instructorProfileId,
    instructorName: r.instructorUserName ?? r.instructorProfileName ?? null,
    scheduledAt: r.scheduledAt,
    heldAt: r.heldAt,
    durationMinutes: r.durationMinutes,
    status: r.status,
    countsAgainstQuota: r.countsAgainstQuota,
    note: r.note,
    studentVisibleNote: r.studentVisibleNote,
    meetingUrl: r.meetingUrl,
  }));
}

export type PackageOverview = {
  packages: EnrollmentPackageRow[];
  lessons: PrivateLessonRow[];
  /** Aktif paketlerin toplam hakkı ve kullanımı. */
  quota: QuotaSummary;
  /** Paket başına ayrı sayaç (id → özet). */
  quotaByPackage: Map<number, QuotaSummary>;
};

/**
 * Bir kaydın paket + ders tablosu, tek yerde.
 *
 * Kalan hak SAKLANMAZ, burada türetilir (bkz. `@/lib/ozel-ders`). Pakete
 * bağlanmamış dersler (`enrollment_package_id` NULL) hiçbir sayacı yakmaz —
 * hak dışı/ekstra derstir; listede görünür, kotada görünmez.
 */
export async function getPackageOverview(
  enrollmentId: number,
): Promise<PackageOverview> {
  const [packages, lessons] = await Promise.all([
    listEnrollmentPackages(enrollmentId),
    listPrivateLessons(enrollmentId),
  ]);

  const quotaByPackage = new Map<number, QuotaSummary>();
  for (const p of packages) {
    const own = lessons.filter((l) => l.enrollmentPackageId === p.id);
    quotaByPackage.set(p.id, quotaSummary(p.accruedHours, own));
  }

  const active = packages.filter((p) => p.status === "aktif");
  const quota = mergeQuota(
    active.map((p) => quotaByPackage.get(p.id)!).filter(Boolean),
  );

  return { packages, lessons, quota, quotaByPackage };
}

/**
 * Öğrenci ana sayfası / program rozeti için hafif özet — ders listesi
 * çekilmeden yalnız sayaç ve yaklaşan ders gerekiyorsa bunu kullan.
 */
export async function getStudentPackageSummary(enrollmentId: number): Promise<{
  hasPackage: boolean;
  quota: QuotaSummary;
  upcoming: PrivateLessonRow[];
}> {
  const { packages, lessons, quota } = await getPackageOverview(enrollmentId);
  const now = Date.now();
  const upcoming = lessons
    .filter(
      (l) =>
        l.status === "scheduled" &&
        l.scheduledAt != null &&
        l.scheduledAt.getTime() >= now,
    )
    .sort(
      (a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0),
    );
  return {
    hasPackage: packages.some((p) => p.status === "aktif"),
    quota,
    upcoming,
  };
}

/**
 * Verilen haftaya düşen özel dersler — program ızgarasındaki gün rozetleri.
 * `plan_tasks` satırı ÜRETİLMEZ; bu salt okuma bir render girdisidir
 * (bkz. `plan_day_layouts` deseni).
 */
export async function listLessonsInRange(
  enrollmentId: number,
  start: Date,
  end: Date,
): Promise<PrivateLessonRow[]> {
  const all = await listPrivateLessons(enrollmentId);
  const from = start.getTime();
  const to = end.getTime();
  return all.filter((l) => {
    const at = (l.heldAt ?? l.scheduledAt)?.getTime();
    return at != null && at >= from && at < to;
  });
}

/** Eğitmen seçenekleri: hesabı olan koçlar + hesapsız dış öğretmen profilleri. */
export async function listInstructorOptions(): Promise<
  { value: string; label: string }[]
> {
  const db = getDb();
  const [coaches, profiles] = await Promise.all([
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.role, ["coach", "admin"]))
      .orderBy(asc(users.name)),
    db
      .select({ id: coachProfiles.id, name: coachProfiles.displayName })
      .from(coachProfiles)
      // Yalnız HESAPSIZ profiller: hesabı olanlar zaten koç listesinde.
      .where(
        and(eq(coachProfiles.isActive, true), isNull(coachProfiles.userId)),
      )
      .orderBy(asc(coachProfiles.displayName)),
  ]);

  return [
    ...coaches.map((c) => ({ value: `u:${c.id}`, label: c.name })),
    // Hesapsız profiller "dış öğretmen" olarak ayrışsın.
    ...profiles.map((p) => ({ value: `p:${p.id}`, label: `${p.name} (dış)` })),
  ];
}

/** Birden çok kaydın aktif paket adları — kadro/liste rozetleri için. */
export async function packagesByEnrollment(
  enrollmentIds: readonly number[],
): Promise<Map<number, EnrollmentPackageRow[]>> {
  if (enrollmentIds.length === 0) return new Map();
  const db = getDb();
  const rows = await selectInChunks(enrollmentIds, (part) =>
    db
      .select({
        enrollmentId: enrollmentPackages.enrollmentId,
        id: enrollmentPackages.id,
        packageId: enrollmentPackages.packageId,
        name: enrollmentPackages.nameSnapshot,
        priceKurus: enrollmentPackages.priceKurusSnapshot,
        kind: enrollmentPackages.kind,
        lessonHoursGranted: enrollmentPackages.lessonHoursGranted,
        renewal: enrollmentPackages.renewal,
        hoursPerPeriod: enrollmentPackages.hoursPerPeriod,
        startsOn: enrollmentPackages.startsOn,
        endsOn: enrollmentPackages.endsOn,
        status: enrollmentPackages.status,
        note: enrollmentPackages.note,
      })
      .from(enrollmentPackages)
      .where(
        and(
          inArray(enrollmentPackages.enrollmentId, part),
          eq(enrollmentPackages.status, "aktif"),
        ),
      ),
  );
  const out = new Map<number, EnrollmentPackageRow[]>();
  for (const r of rows) {
    const list = out.get(r.enrollmentId) ?? [];
    list.push({
      id: r.id,
      packageId: r.packageId,
      name: r.name,
      priceKurus: r.priceKurus,
      kind: r.kind,
      lessonHoursGranted: r.lessonHoursGranted,
      renewal: r.renewal,
      hoursPerPeriod: r.hoursPerPeriod,
      accruedHours: accruedHours(r),
      startsOn: r.startsOn,
      endsOn: r.endsOn,
      status: r.status,
      note: r.note,
    });
    out.set(r.enrollmentId, list);
  }
  return out;
}

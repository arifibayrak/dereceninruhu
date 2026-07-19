import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ImageIcon, TimerIcon } from "lucide-react";

import {
  getEnrollmentDetailByUserId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import {
  getStudyDayTotal,
  getStudyWeekTotal,
  listStudyLogs,
} from "@/db/queries/study";
import { trDayKey } from "@/lib/dates";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatMinutes, STUDY_SOURCE_LABELS } from "@/lib/study";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import {
  StudyLogger,
  type StudySubject,
} from "@/components/app/study-logger";
import { StudyLogDelete } from "@/components/app/study-log-delete";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Kronometre" };

const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function KronometrePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const { enrollment } = detail;
  const now = new Date();
  const todayKey = trDayKey(now);

  const [sections, todayLogs, dayTotal, weekTotal] = await Promise.all([
    getSectionsForEnrollment(enrollment.examTemplateId, enrollment.trackCode),
    listStudyLogs(enrollment.id, { day: now }),
    getStudyDayTotal(enrollment.id, now),
    getStudyWeekTotal(enrollment.id, now),
  ]);

  const subjects: StudySubject[] = sections.flatMap((s) =>
    s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      sectionName: s.name,
    })),
  );

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-title">Kronometre</h1>
        <p className="text-sm text-muted-foreground">
          Çalışma süreni tut ya da elle gir — koçun toplam süreni görür.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Bugün" value={formatMinutes(dayTotal)} hint="çalışma" />
        <StatTile
          label="Bu hafta"
          value={formatMinutes(weekTotal)}
          hint="Pzt–Paz"
        />
      </div>

      <StudyLogger
        enrollmentId={enrollment.id}
        subjects={subjects}
        todayKey={todayKey}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bugünkü oturumlar</CardTitle>
          <CardDescription>
            {todayLogs.length > 0
              ? `Toplam ${formatMinutes(dayTotal)}`
              : "Henüz kayıt yok — kronometreyi başlat ya da manuel ekle."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayLogs.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              <TimerIcon className="size-4 shrink-0" />
              Bugün için çalışma kaydı yok.
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {todayLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {log.subjectName ?? "Genel"}
                      <Badge variant="secondary">
                        {STUDY_SOURCE_LABELS[log.source]}
                      </Badge>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {timeFmt.format(log.createdAt)}
                      {log.note ? ` · ${log.note}` : ""}
                      {log.proofKey ? (
                        <a
                          href={`/api/uploads/${log.proofKey}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <ImageIcon className="size-3" />
                          Kanıt
                        </a>
                      ) : null}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatMinutes(log.minutes)}
                  </span>
                  <StudyLogDelete id={log.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

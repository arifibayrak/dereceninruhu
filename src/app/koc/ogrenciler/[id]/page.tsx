import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import { getEnrollmentPayment } from "@/db/queries/muhasebe";
import {
  getStudyBySubject,
  getStudyWeekTotal,
  getTotalStudyMinutes,
  getWeeklyStudyMinutes,
} from "@/db/queries/study";
import {
  getMockList,
  getStudentInsightInput,
  getTotalQuestions,
  getWeekQuestionTotal,
} from "@/db/queries/tracking";
import { daysBetween, formatWeekLabel } from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import { buildStudentInsights, computeStreak, netTrend } from "@/lib/insights";
import { formatMinutes } from "@/lib/study";
import { InsightList } from "@/components/app/insight-list";
import { PaymentStatusBadge } from "@/components/app/payment-status-badge";
import { StalenessBadge } from "@/components/app/staleness-badge";
import { StudySubjectBars } from "@/components/app/study-subject-bars";
import {
  NetProgressChart,
  WeeklyStudyChart,
} from "@/components/charts/lazy-charts";
import { StatTile } from "@/components/brand/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CockpitShell, resolveCockpit } from "./_cockpit";

export const metadata: Metadata = { title: "Öğrenci" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function OgrenciGenelBakisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  const { enrollment } = await resolveCockpit(studentId);
  const base = `/koc/ogrenciler/${studentId}`;
  const now = new Date();

  const [
    totalQuestions,
    weekTotal,
    insightInput,
    mocks,
    studyWeek,
    studyTotal,
    studyWeekly,
    studyBySubject,
    payment,
  ] = await Promise.all([
    getTotalQuestions(enrollment.id),
    getWeekQuestionTotal(enrollment.id, now),
    getStudentInsightInput(enrollment.id, now),
    getMockList(enrollment.id),
    getStudyWeekTotal(enrollment.id, now),
    getTotalStudyMinutes(enrollment.id),
    getWeeklyStudyMinutes(enrollment.id, 8, now),
    getStudyBySubject(enrollment.id, 8, now),
    getEnrollmentPayment(enrollment.id, now),
  ]);

  const insights = buildStudentInsights(insightInput);
  // Seri ikinci kez çekilmiyor: `getStudentInsightInput` zaten `getNetSeries`'i
  // çalıştırıp sonucu taşıyor (3 yollu join + group by, sayfa başına bir kez).
  const netSeries = insightInput.netSeries;
  const trend = netTrend(netSeries);
  const streak = computeStreak(insightInput.activeDayKeys, now);
  const staleDays = insightInput.lastActivity
    ? daysBetween(insightInput.lastActivity, now)
    : null;
  const recentMocks = mocks.slice(0, 5);

  return (
    <>
      <CockpitShell studentId={studentId} active="" />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Toplam soru"
            value={formatInt(totalQuestions)}
            hint="Tüm zamanlar"
          />
          <StatTile
            label="Bu hafta"
            value={formatInt(weekTotal)}
            hint={`${formatWeekLabel(now)} · soru`}
          />
          <StatTile
            label="Çalışma"
            value={formatMinutes(studyWeek)}
            hint={`bu hafta · toplam ${formatMinutes(studyTotal)}`}
          />
          <StatTile
            label="Son net"
            value={trend.latest !== null ? formatNet(trend.latest) : "—"}
            delta={trend.delta ?? undefined}
            hint="Son tam deneme"
          />
          <StatTile
            label="Seri"
            value={`${formatInt(streak)} gün`}
            hint="Günlük giriş"
          />
          <BadgeTile label="Ödeme">
            <PaymentStatusBadge payment={payment} />
          </BadgeTile>
          <BadgeTile label="Son giriş">
            <StalenessBadge staleDays={staleDays} />
          </BadgeTile>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Net gelişimi</CardTitle>
              <CardDescription>Tam denemeler · toplam net</CardDescription>
            </CardHeader>
            <CardContent>
              {netSeries.length > 0 ? (
                <NetProgressChart
                  points={netSeries.map((p) => ({
                    label: dateFmt.format(p.takenOn).replace(/ \d{4}$/, ""),
                    net: p.net,
                  }))}
                />
              ) : (
                <EmptyNote text="Henüz tam deneme girilmedi." />
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col gap-2 lg:col-span-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Otomatik içgörüler
            </h3>
            <InsightList insights={insights} limit={4} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Çalışma süresi</CardTitle>
            <CardDescription>Kronometre + manuel · son 8 hafta</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {studyTotal > 0 ? (
              <WeeklyStudyChart
                points={studyWeekly.map((w) => ({
                  label: formatWeekLabel(w.weekStart),
                  minutes: w.minutes,
                }))}
              />
            ) : (
              <EmptyNote text="Henüz çalışma süresi kaydı yok." />
            )}
            {studyBySubject.length > 0 && (
              <StudySubjectBars rows={studyBySubject} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son denemeler</CardTitle>
            <CardDescription>En yeni {formatInt(recentMocks.length)} deneme</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMocks.length === 0 ? (
              <EmptyNote text="Henüz deneme girilmedi." />
            ) : (
              <ul className="flex flex-col divide-y">
                {recentMocks.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <Link
                      href={`${base}/deneme/${m.id}/analiz`}
                      className="flex min-w-0 flex-1 flex-col gap-0.5 hover:text-primary"
                    >
                      <span className="truncate text-sm font-medium">
                        {m.name?.trim() || m.publisher?.trim() || m.sectionCode}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dateFmt.format(m.takenOn)} · {m.sectionName}
                      </span>
                    </Link>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatNet(m.totalNet)} net
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`${base}/denemeler`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Tüm denemeler
              <ChevronRightIcon className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BadgeTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <span className="text-[13px] font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

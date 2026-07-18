import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRightIcon, CrosshairIcon } from "lucide-react";

import { getEnrollmentDetailByUserId } from "@/db/queries/enrollment";
import {
  getNetSeries,
  getStudentInsightInput,
  getTotalQuestions,
  getWeeklyVolume,
} from "@/db/queries/tracking";
import { getCurrentUser, type Role } from "@/lib/session";
import { formatWeekLabel } from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import { buildStudentInsights, netTrend } from "@/lib/insights";
import { InsightList } from "@/components/app/insight-list";
import { NoEnrollmentCard } from "@/components/app/no-enrollment";
import { NetProgressChart } from "@/components/charts/net-progress-chart";
import { WeeklyVolumeChart } from "@/components/charts/weekly-volume-chart";
import { StatTile } from "@/components/brand/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Gelişim" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

export default async function GelisimPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris");
  const role = (user as { role?: Role }).role ?? "student";

  const detail = await getEnrollmentDetailByUserId(user.id);
  if (!detail) {
    return <NoEnrollmentCard isCoach={role === "coach" || role === "admin"} />;
  }
  const enrollmentId = detail.enrollment.id;

  const now = new Date();
  const [netSeries, volume, insightInput, totalQuestions] = await Promise.all([
    getNetSeries(enrollmentId),
    getWeeklyVolume(enrollmentId, 8, now),
    getStudentInsightInput(enrollmentId, now),
    getTotalQuestions(enrollmentId),
  ]);
  const insights = buildStudentInsights(insightInput);
  const trend = netTrend(insightInput.netSeries);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-title">Gelişim</h1>
        <p className="text-sm text-muted-foreground">
          Netlerin, soru hacmin ve otomatik içgörülerin bir arada.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="Son net"
          value={trend.latest !== null ? formatNet(trend.latest) : "—"}
          delta={trend.delta ?? undefined}
          hint="Son tam deneme"
        />
        <StatTile
          label="Deneme"
          value={formatInt(netSeries.length)}
          hint="Tam deneme sayısı"
        />
        <StatTile
          label="Bu hafta"
          value={formatInt(insightInput.weekQuestionTotal)}
          hint="soru"
        />
        <StatTile
          label="Toplam"
          value={formatInt(totalQuestions)}
          hint="soru · tüm zamanlar"
        />
      </div>

      <Link
        href="/ogrenci/analiz"
        className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <CrosshairIcon className="size-4 text-primary" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium">Eksik konular ve kaynak takibi</span>
          <span className="truncate text-xs text-muted-foreground">
            Deneme analizlerinden toplam eksik sıralaman + ısı haritan
          </span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Net gelişimi</CardTitle>
          <CardDescription>Tam denemeler · toplam net</CardDescription>
        </CardHeader>
        <CardContent>
          {netSeries.length > 0 ? (
            <NetProgressChart
              points={netSeries.map((p) => ({
                label: dateFmt.format(p.takenOn),
                net: p.net,
              }))}
            />
          ) : (
            <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              İlk tam denemeni girdiğinde net grafiğin burada çizilecek.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Haftalık soru hacmi</CardTitle>
          <CardDescription>Son 8 hafta</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyVolumeChart
            points={volume.map((v) => ({
              label: formatWeekLabel(v.weekStart),
              total: v.total,
            }))}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-semibold">İçgörüler</h2>
        <InsightList insights={insights} />
      </div>
    </>
  );
}

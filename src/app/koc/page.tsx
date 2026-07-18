import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CircleCheckIcon,
  InboxIcon,
  MessageCircleIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";

import { redirect } from "next/navigation";

import { countNewLeads } from "@/db/queries/cms";
import { getOverdueInvoiceCount } from "@/db/queries/muhasebe";
import { getPlansAwaitingPublish } from "@/db/queries/plans";
import { getUpcomingSessions } from "@/db/queries/sessions";
import { getCoachDashboard } from "@/db/queries/roster";
import { formatWeekLabel, trDayKey } from "@/lib/dates";
import { getViewer } from "@/lib/session";
import { formatInt } from "@/lib/format";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import { AnalysisToggle } from "@/components/app/analysis-toggle";
import { StalenessBadge } from "@/components/app/staleness-badge";
import { StatTile } from "@/components/brand/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Koç Paneli" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

const sessionFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function KocPanelPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const [dash, pendingPlans, upcomingSessions, newLeadCount, overdueCount] =
    await Promise.all([
      getCoachDashboard(viewer),
      getPlansAwaitingPublish(),
      getUpcomingSessions(),
      countNewLeads(),
      getOverdueInvoiceCount(
        new Date(),
        viewer.role === "coach" ? viewer.id : null,
      ),
    ]);
  const now = new Date();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-gold" />
            Bu hafta · {formatWeekLabel(now)}
          </span>
          <h1 className="font-heading text-title">Koç paneli</h1>
        </div>
        <Button render={<Link href="/koc/ogrenciler/yeni" />}>
          <PlusIcon data-icon="inline-start" />
          Yeni öğrenci
        </Button>
      </div>

      {newLeadCount > 0 && (
        <Link
          href="/koc/leadler?durum=yeni"
          className="flex items-center gap-3 rounded-xl bg-gold/10 p-4 ring-1 ring-gold/30 transition-colors hover:bg-gold/15"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/20">
            <InboxIcon className="size-4.5 text-gold-foreground dark:text-gold" />
          </span>
          <span className="flex-1 text-sm font-medium">
            {formatInt(newLeadCount)} yeni lead ön görüşme bekliyor
          </span>
          <ArrowRightIcon className="size-4 text-muted-foreground" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

        <StatTile
          label="Aktif öğrenci"
          value={formatInt(dash.rosterCount)}
          hint="Kadro"
        />
        <StatTile
          label="Bu hafta soru"
          value={formatInt(dash.weekQuestionTotal)}
          hint="Tüm öğrenciler"
        />
        <StatTile
          label="Bu hafta deneme"
          value={formatInt(dash.weekMockCount)}
          hint="Girilen deneme"
        />
        <StatTile
          label="Analiz bekleyen"
          value={formatInt(dash.pendingMocks.length)}
          hint="Deneme analizi"
        />
        <Link href="/koc/muhasebe" className="contents">
          <StatTile
            label="Gecikmiş ödeme"
            value={formatInt(overdueCount)}
            hint="Muhasebe →"
            className={
              overdueCount > 0 ? "ring-destructive/30" : undefined
            }
          />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bugün hatırlat</CardTitle>
            <CardDescription>
              3+ gündür soru girişi olmayan öğrenciler — tek dokunuşla
              WhatsApp&apos;tan dürt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dash.staleStudents.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-sm text-success">
                <CircleCheckIcon className="size-4 shrink-0" />
                Harika — herkes son 3 gün içinde giriş yapmış.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {dash.staleStudents.map((s) => (
                  <li
                    key={s.enrollmentId}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/koc/ogrenciler/${s.studentId}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {s.fullName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {s.examCode}
                        {s.trackName ? ` · ${s.trackName}` : ""}
                      </span>
                    </div>
                    <StalenessBadge staleDays={s.staleDays} />
                    {s.phone ? (
                      <Button
                        variant="outline"
                        size="xs"
                        render={
                          <a
                            href={buildWaLink(
                              s.phone,
                              waTemplates.soruGiris({
                                studentName: s.fullName.split(" ")[0],
                                days: s.staleDays ?? undefined,
                              }),
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <MessageCircleIcon data-icon="inline-start" />
                        WhatsApp
                      </Button>
                    ) : (
                      <Badge variant="outline">Telefon yok</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analiz bekleyen denemeler</CardTitle>
            <CardDescription>
              Girilen ama birlikte analiz edilmemiş denemeler.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dash.pendingMocks.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <SparklesIcon className="size-4 shrink-0" />
                Bekleyen analiz yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {dash.pendingMocks.map((m) => (
                  <li
                    key={m.mockExamId}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/koc/ogrenciler/${m.studentId}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {m.studentName}
                      </Link>
                      <span className="truncate text-xs text-muted-foreground">
                        {m.label} · {m.sectionName} ·{" "}
                        {dateFmt.format(m.takenOn)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="xs"
                      render={
                        <Link
                          href={`/koc/ogrenciler/${m.studentId}/deneme/${m.mockExamId}/analiz`}
                        />
                      }
                    >
                      Analiz gir
                    </Button>
                    <AnalysisToggle mockExamId={m.mockExamId} done={false} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yayınlanmayı bekleyen programlar</CardTitle>
            <CardDescription>
              Taslak kalan haftalık programlar — öğrenci yayınlanana kadar
              görmez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPlans.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-sm text-success">
                <SendIcon className="size-4 shrink-0" />
                Taslak program yok — tüm programlar yayında.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {pendingPlans.map((p) => (
                  <li
                    key={p.planId}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/koc/ogrenciler/${p.studentId}?tab=program&hafta=${trDayKey(p.weekStart)}`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {p.studentName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatWeekLabel(p.weekStart)} ·{" "}
                        {formatInt(p.taskCount)} görev
                      </span>
                    </div>
                    <Badge className="bg-warning/10 text-warning">Taslak</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan görüşmeler (7 gün)</CardTitle>
            <CardDescription>
              Önümüzdeki hafta planlı koçluk görüşmeleri.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {upcomingSessions.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                <CalendarDaysIcon className="size-4 shrink-0" />
                Önümüzdeki 7 günde planlı görüşme yok.
              </div>
            ) : (
              <ul className="flex flex-col divide-y">
                {upcomingSessions.map((s) => (
                  <li
                    key={s.sessionId}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/koc/ogrenciler/${s.studentId}?tab=gorusmeler`}
                        className="truncate text-sm font-medium hover:text-primary"
                      >
                        {s.studentName}
                      </Link>
                      <span className="truncate text-xs text-muted-foreground">
                        {sessionFmt.format(s.scheduledAt)}
                        {s.studentVisibleNote
                          ? ` · ${s.studentVisibleNote}`
                          : ""}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="self-end"
              render={<Link href="/koc/gorusmeler" />}
            >
              Tüm görüşmeler →
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

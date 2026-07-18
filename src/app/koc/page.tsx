import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleCheckIcon,
  MessageCircleIcon,
  PlusIcon,
  SparklesIcon,
} from "lucide-react";

import { getCoachDashboard } from "@/db/queries/roster";
import { formatWeekLabel } from "@/lib/dates";
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

export default async function KocPanelPage() {
  const dash = await getCoachDashboard();
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                    <AnalysisToggle mockExamId={m.mockExamId} done={false} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

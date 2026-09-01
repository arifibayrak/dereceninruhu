import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TargetIcon,
} from "lucide-react";

import {
  getWeeklyMockResults,
  type WeeklyMockRow,
} from "@/db/queries/tracking";
import {
  addDays,
  formatWeekLabel,
  mondayOf,
  trDayKey,
} from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import { formatPace, secondsPerQuestion } from "@/lib/pace";
import { formatMinutes } from "@/lib/study";
import { getViewer } from "@/lib/session";
import { cn } from "@/lib/utils";
import { MockActions } from "@/components/app/mock-actions";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Denemeler" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  weekday: "short",
  day: "numeric",
  month: "short",
});

type Sort = "net" | "isim";

/** Satırın temposu (sn/soru) — süre girilmemişse null. */
const paceOf = (r: { durationMinutes: number | null; questionCount: number }) =>
  secondsPerQuestion(r.durationMinutes, r.questionCount);

export default async function KocDenemelerPage({
  searchParams,
}: {
  searchParams: Promise<{ hafta?: string; sirala?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const { hafta, sirala } = await searchParams;
  const now = new Date();
  const anchor =
    hafta && /^\d{4}-\d{2}-\d{2}$/.test(hafta) ? new Date(hafta) : now;
  const monday = mondayOf(Number.isNaN(anchor.getTime()) ? now : anchor);
  const currentMonday = mondayOf(now);
  const isCurrentWeek = monday.getTime() === currentMonday.getTime();
  const sort: Sort = sirala === "isim" ? "isim" : "net";

  const rows = await getWeeklyMockResults({ weekAnchor: monday, viewer, sort });

  /*
   * Genel ve branş denemeleri AYRI tablolarda: 30 soruluk bir Matematik branş
   * denemesinin neti ile 120 soruluk genel denemenin neti aynı ölçek değildir,
   * tek listede nete göre sıralanınca pano yanlış okunuyordu.
   */
  const genel = rows.filter((r) => r.scope === "full");
  const brans = rows.filter((r) => r.scope === "branch");
  const count = rows.length;
  const avg = (list: WeeklyMockRow[]) =>
    list.length > 0
      ? list.reduce((acc, r) => acc + r.totalNet, 0) / list.length
      : null;
  const genelAvg = avg(genel);
  const bransAvg = avg(brans);
  const weekLabel = isCurrentWeek ? "Bu haftaki" : formatWeekLabel(monday);
  const sortLabel =
    sort === "net" ? " · nete göre sıralı" : " · isme göre sıralı";

  const mondayKey = trDayKey(monday);
  const prevKey = trDayKey(addDays(monday, -7));
  const nextKey = trDayKey(addDays(monday, 7));
  const href = (h: string, s: Sort) => `/koc/denemeler?hafta=${h}&sirala=${s}`;

  return (
    <>
      <div data-tour="denemeler-hafta" className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Haftalık deneme panosu
        </span>
        <h1 className="font-heading text-title">Denemeler</h1>
        <p className="text-sm text-muted-foreground">
          {viewer.role === "admin"
            ? "Tüm kadronun bu haftaki deneme netleri — tek tabloda."
            : "Öğrencilerinin bu haftaki deneme netleri."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Önceki hafta"
            render={<Link href={href(prevKey, sort)} />}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="flex flex-col items-center leading-tight">
            <span className="font-heading text-sm font-semibold">
              {formatWeekLabel(monday)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isCurrentWeek ? "Bu hafta" : "Geçmiş hafta"}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Sonraki hafta"
            disabled={isCurrentWeek}
            render={
              isCurrentWeek ? undefined : <Link href={href(nextKey, sort)} />
            }
          >
            <ChevronRightIcon />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Sırala:</span>
          <SortChip active={sort === "net"} href={href(mondayKey, "net")}>
            Nete göre
          </SortChip>
          <SortChip active={sort === "isim"} href={href(mondayKey, "isim")}>
            İsme göre
          </SortChip>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Deneme" value={String(count)} hint="bu hafta" />
        <StatTile
          label="Genel ort."
          value={genelAvg === null ? "—" : formatNet(genelAvg)}
          hint={`${formatInt(genel.length)} genel deneme`}
        />
        <StatTile
          label="Branş ort."
          value={bransAvg === null ? "—" : formatNet(bransAvg)}
          hint={`${formatInt(brans.length)} branş denemesi`}
        />
      </div>

      {count === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sonuçlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
              <TargetIcon className="size-4 shrink-0" />
              Bu hafta girilen deneme yok.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <ResultsCard
            title="Genel denemeler"
            description={`${weekLabel} girilen tam denemeler${sortLabel}.`}
            rows={genel}
            emptyText="Bu hafta genel deneme girilmedi."
          />
          <ResultsCard
            title="Branş denemeleri"
            description={`${weekLabel} girilen ders bazlı denemeler${sortLabel}.`}
            rows={brans}
            emptyText="Bu hafta branş denemesi girilmedi."
          />
        </>
      )}
    </>
  );
}

/**
 * Tek bir kapsamın (genel ya da branş) haftalık tablosu. Branşta ders adı
 * satırın kimliğidir — "Deneme 3" tek başına hangi dersti belli etmiyordu.
 */
function ResultsCard({
  title,
  description,
  rows,
  emptyText,
}: {
  title: string;
  description: string;
  rows: WeeklyMockRow[];
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title} · {formatInt(rows.length)}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <TargetIcon className="size-4 shrink-0" />
            {emptyText}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Öğrenci</TableHead>
                <TableHead>Deneme</TableHead>
                <TableHead className="hidden sm:table-cell">Bölüm</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="hidden md:table-cell">Tarih</TableHead>
                <TableHead className="text-right">Analiz</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.mockId}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/koc/ogrenciler/${r.studentId}/denemeler`}
                      className="hover:text-primary"
                    >
                      {r.studentName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.name?.trim() || r.publisher?.trim() || "Deneme"}
                    {r.scope === "branch" && r.subjectNames.length > 0 && (
                      <span className="block text-xs font-medium text-foreground/70">
                        {r.subjectNames.join(" · ")}
                      </span>
                    )}
                    {/* Süre/tempo — branş denemesinde hız takibinin ta kendisi. */}
                    {paceOf(r) && (
                      <span className="block text-xs tabular-nums text-muted-foreground/80">
                        {formatMinutes(r.durationMinutes ?? 0)} ·{" "}
                        {formatPace(paceOf(r)!)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {r.examCode} · {r.sectionName}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatNet(r.totalNet)}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                    {dateFmt.format(r.takenOn)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1.5">
                      {r.analysisDone ? (
                        <Badge
                          variant="outline"
                          className="border-success/40 text-success"
                        >
                          Edildi
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Bekliyor</Badge>
                      )}
                      <MockActions
                        mockExamId={r.mockId}
                        label={`${r.studentName} · ${
                          r.name?.trim() || r.publisher?.trim() || "Deneme"
                        }`}
                      />
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function SortChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </Link>
  );
}

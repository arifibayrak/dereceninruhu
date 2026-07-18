import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, HourglassIcon, MessageCircleIcon } from "lucide-react";

import {
  getEnrollmentDetailByStudentId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import {
  getMockList,
  getNetSeries,
  getStudentInsightInput,
  getTotalQuestions,
  getWeekGrid,
  getWeekQuestionTotal,
} from "@/db/queries/tracking";
import { formatWeekLabel, trDayKey, weekDays } from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import {
  buildStudentInsights,
  computeStreak,
  netTrend,
} from "@/lib/insights";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import { AnalysisToggle } from "@/components/app/analysis-toggle";
import { InsightList } from "@/components/app/insight-list";
import {
  CopyInviteButton,
  WaInviteButton,
} from "@/components/app/invite-actions";
import { MockCreateDialog } from "@/components/app/mock-create-dialog";
import type { MockSection } from "@/components/app/mock-form";
import { WeekGridForm, type GridSection } from "@/components/app/week-grid-form";
import { NetProgressChart } from "@/components/charts/net-progress-chart";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = { title: "Öğrenci" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const STUB_TABS = [
  { value: "program", label: "Program" },
  { value: "konular", label: "Konular" },
  { value: "icerik", label: "İçerik" },
  { value: "gorusmeler", label: "Görüşmeler" },
  { value: "muhasebe", label: "Muhasebe" },
] as const;

export default async function OgrenciKokpitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId) || studentId <= 0) notFound();

  const detail = await getEnrollmentDetailByStudentId(studentId);
  if (!detail) notFound();
  const { student, enrollment } = detail;

  const now = new Date();
  const sections = await getSectionsForEnrollment(
    enrollment.examTemplateId,
    enrollment.trackCode,
  );
  const [grid, mocks, netSeries, insightInput, totalQuestions, weekTotal] =
    await Promise.all([
      getWeekGrid(enrollment.id, now),
      getMockList(enrollment.id),
      getNetSeries(enrollment.id),
      getStudentInsightInput(enrollment.id, now),
      getTotalQuestions(enrollment.id),
      getWeekQuestionTotal(enrollment.id, now),
    ]);

  const insights = buildStudentInsights(insightInput);
  const trend = netTrend(insightInput.netSeries);
  const streak = computeStreak(insightInput.activeDayKeys, now);

  const gridSections: GridSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    subjects: s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      parentSubjectId: sub.parentSubjectId,
    })),
  }));
  const mockSections: MockSection[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    wrongPenaltyDivisor: s.wrongPenaltyDivisor,
    subjects: s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      isScored: sub.isScored,
      parentSubjectId: sub.parentSubjectId,
      officialQuestionCount: sub.officialQuestionCount,
    })),
  }));

  const dayKeys = weekDays(now).map(trDayKey);
  const invitePath = student.inviteCode ? `/davet/${student.inviteCode}` : null;

  return (
    <>
      {/* Başlık */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          render={<Link href="/koc/ogrenciler" />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Öğrenciler
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-heading text-title">{student.fullName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {enrollment.examCode}
                {enrollment.trackName ? ` · ${enrollment.trackName}` : ""}
              </Badge>
              {student.userId ? (
                <Badge className="bg-success/10 text-success">
                  Davet kabul edildi
                </Badge>
              ) : (
                <Badge className="bg-warning/10 text-warning">
                  Davet bekliyor
                </Badge>
              )}
              {enrollment.targetText && (
                <span className="text-sm text-muted-foreground">
                  🎯 {enrollment.targetText}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {student.phone && (
              <Button
                variant="outline"
                size="sm"
                render={
                  <a
                    href={buildWaLink(
                      student.phone,
                      waTemplates.soruGiris({
                        studentName: student.fullName.split(" ")[0],
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
            )}
            {!student.userId && invitePath && (
              <>
                <CopyInviteButton invitePath={invitePath} size="sm" />
                {student.phone && (
                  <WaInviteButton
                    phone={student.phone}
                    studentName={student.fullName.split(" ")[0]}
                    invitePath={invitePath}
                    size="sm"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <Tabs defaultValue="ozet">
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="ozet">Özet</TabsTrigger>
            <TabsTrigger value="soru-takibi">Soru Takibi</TabsTrigger>
            <TabsTrigger value="denemeler">Denemeler</TabsTrigger>
            {STUB_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="profil">Profil</TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------------ Özet ------------------------------ */}
        <TabsContent value="ozet" className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Toplam soru"
              value={formatInt(totalQuestions)}
              hint="Tüm zamanlar"
            />
            <StatTile
              label="Bu hafta"
              value={formatInt(weekTotal)}
              hint={formatWeekLabel(now)}
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
        </TabsContent>

        {/* --------------------------- Soru takibi -------------------------- */}
        <TabsContent value="soru-takibi" className="flex flex-col gap-3 pt-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-base font-semibold">
              Bu hafta · {formatWeekLabel(now)}
            </h2>
            <span className="text-xs text-muted-foreground">
              Koç olarak düzenleyebilirsin
            </span>
          </div>
          <WeekGridForm
            enrollmentId={enrollment.id}
            dayKeys={dayKeys}
            todayKey={trDayKey(now)}
            sections={gridSections}
            initial={grid}
          />
        </TabsContent>

        {/* ---------------------------- Denemeler --------------------------- */}
        <TabsContent value="denemeler" className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-base font-semibold">
              Denemeler · {formatInt(mocks.length)}
            </h2>
            <MockCreateDialog
              enrollmentId={enrollment.id}
              sections={mockSections}
            />
          </div>
          {mocks.length === 0 ? (
            <EmptyNote text="Henüz deneme girilmedi. İlk denemeyi ekleyerek başla." />
          ) : (
            <div className="rounded-xl bg-card ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Tarih</TableHead>
                    <TableHead>Deneme</TableHead>
                    <TableHead>Bölüm</TableHead>
                    <TableHead>Kapsam</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="pr-4 text-right">Analiz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mocks.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="pl-4 text-muted-foreground">
                        {dateFmt.format(m.takenOn)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {m.name?.trim() || m.publisher?.trim() || m.sectionCode}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.sectionName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.scope === "full" ? "secondary" : "outline"}>
                          {m.scope === "full" ? "Tam" : "Branş"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatNet(m.totalNet)}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <AnalysisToggle
                          mockExamId={m.id}
                          done={m.analysisDone}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------ Stublar ---------------------------- */}
        {STUB_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="pt-2">
            <StubPanel title={t.label} />
          </TabsContent>
        ))}

        {/* ------------------------------ Profil ----------------------------- */}
        <TabsContent value="profil" className="pt-2">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>
                Düzenleme sonraki fazda; şimdilik özet bilgiler.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <ProfileRow label="Telefon" value={student.phone} />
                <ProfileRow label="Veli telefonu" value={student.parentPhone} />
                <ProfileRow label="Sınıf / durum" value={student.grade} />
                <ProfileRow label="Alan / bölüm" value={student.field} />
                <ProfileRow label="Okul" value={student.school} />
                <ProfileRow label="Dershane" value={student.dershane} />
                <ProfileRow label="Hedef" value={enrollment.targetText} />
                <ProfileRow
                  label="Başlangıç"
                  value={
                    enrollment.startDate
                      ? dateFmt.format(enrollment.startDate)
                      : null
                  }
                />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ProfileRow({ label, value }: { label: string; value: string | null }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value?.trim() || "—"}</dd>
    </>
  );
}

function StubPanel({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-14 text-center ring-1 ring-foreground/10">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <HourglassIcon className="size-5 text-primary" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-lg font-semibold">{title} yakında</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bu bölüm sonraki fazda geliyor. Şimdilik özet, soru takibi ve
          denemeler üzerinden ilerleyebilirsin.
        </p>
      </div>
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

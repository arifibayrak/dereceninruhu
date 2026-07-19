import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  MessageCircleIcon,
} from "lucide-react";

import { listCoaches } from "@/db/queries/admin";
import {
  getEnrollmentDetailByStudentId,
  getSectionsForEnrollment,
} from "@/db/queries/enrollment";
import {
  getResourcesForEnrollment,
  getWeeklyPlan,
  listWeeklyPlans,
} from "@/db/queries/plans";
import { listSessionsForEnrollment } from "@/db/queries/sessions";
import {
  getMockList,
  getNetSeries,
  getStudentInsightInput,
  getTotalQuestions,
  getWeekGrid,
  getWeekQuestionTotal,
} from "@/db/queries/tracking";
import { getStudyWeekTotal } from "@/db/queries/study";
import {
  addDays,
  DAY_NAMES_TR,
  formatWeekLabel,
  mondayOf,
  trDayKey,
  trWeekday,
  weekDays,
} from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import { formatMinutes } from "@/lib/study";
import { getViewer } from "@/lib/session";
import {
  buildStudentInsights,
  computeStreak,
  netTrend,
} from "@/lib/insights";
import { cn } from "@/lib/utils";
import { buildWaLink, waTemplates } from "@/lib/whatsapp";
import { AnalysisToggle } from "@/components/app/analysis-toggle";
import { CoachAssignSelect } from "@/components/app/coach-assign-select";
import { HideStudentButton } from "@/components/app/hide-student-actions";
import { InsightList } from "@/components/app/insight-list";
import {
  CopyInviteButton,
  WaInviteButton,
} from "@/components/app/invite-actions";
import { MockCreateDialog } from "@/components/app/mock-create-dialog";
import { StudentProfileForm } from "@/components/app/student-profile-form";
import type { MockSection } from "@/components/app/mock-form";
import {
  ProgramBuilder,
  type BuilderSubject,
  type BuilderTask,
} from "@/components/app/program-builder";
import {
  SessionsPanel,
  type SessionItem,
} from "@/components/app/sessions-panel";
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
import type { EnrollmentSessionRow } from "@/db/queries/sessions";
import { AnalizPanel } from "./analiz-panel";
import { IcerikTab } from "./icerik-tab";
import { KonularTab } from "./konular-tab";
import { MuhasebeTab } from "./muhasebe-tab";

export const metadata: Metadata = { title: "Öğrenci" };

const dateFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

const TAB_VALUES = [
  "ozet",
  "soru-takibi",
  "denemeler",
  "program",
  "konular",
  "icerik",
  "gorusmeler",
  "muhasebe",
  "profil",
] as const;

function toSessionItems(rows: EnrollmentSessionRow[]): SessionItem[] {
  return rows.map((r) => ({
    id: r.id,
    scheduledAtMs: r.scheduledAt?.getTime() ?? null,
    heldAtMs: r.heldAt?.getTime() ?? null,
    status: r.status,
    summary: r.summary,
    studentVisibleNote: r.studentVisibleNote,
    nextPlanId: r.nextPlanId,
    nextPlanWeekKey: r.nextPlanWeekKey,
    meetingUrl: r.meetingUrl,
    meetingProvider: r.meetingProvider,
  }));
}

export default async function OgrenciKokpitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hafta?: string; tab?: string }>;
}) {
  const { id } = await params;
  const { hafta, tab } = await searchParams;
  const studentId = Number(id);
  if (!Number.isInteger(studentId) || studentId <= 0) notFound();

  const detail = await getEnrollmentDetailByStudentId(studentId);
  if (!detail) notFound();
  const { student, enrollment } = detail;

  const viewer = await getViewer();
  const isAdmin = viewer?.role === "admin";
  // Koç yalnız kendisine atanan öğrencinin kokpitini (muhasebe dahil) görür.
  if (viewer?.role === "coach" && enrollment.coachUserId !== viewer.id) {
    notFound();
  }
  const coaches = isAdmin ? await listCoaches() : [];

  const initialTab = (TAB_VALUES as readonly string[]).includes(tab ?? "")
    ? (tab as string)
    : "ozet";

  const now = new Date();
  const anchor =
    hafta && /^\d{4}-\d{2}-\d{2}$/.test(hafta) ? new Date(hafta) : now;
  const planMonday = mondayOf(Number.isNaN(anchor.getTime()) ? now : anchor);
  const currentMonday = mondayOf(now);
  const isPlanCurrentWeek = planMonday.getTime() === currentMonday.getTime();

  const sections = await getSectionsForEnrollment(
    enrollment.examTemplateId,
    enrollment.trackCode,
  );
  const [
    grid,
    mocks,
    netSeries,
    insightInput,
    totalQuestions,
    weekTotal,
    plan,
    planWeeks,
    resources,
    sessions,
    studyWeek,
  ] = await Promise.all([
    getWeekGrid(enrollment.id, now),
    getMockList(enrollment.id),
    getNetSeries(enrollment.id),
    getStudentInsightInput(enrollment.id, now),
    getTotalQuestions(enrollment.id),
    getWeekQuestionTotal(enrollment.id, now),
    getWeeklyPlan(enrollment.id, planMonday),
    listWeeklyPlans(enrollment.id, 8),
    getResourcesForEnrollment(enrollment.id),
    listSessionsForEnrollment(enrollment.id, now),
    getStudyWeekTotal(enrollment.id, now),
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

  // Program sekmesi verileri
  const builderSubjects: BuilderSubject[] = sections.flatMap((s) =>
    s.loggable.map((sub) => ({
      id: sub.id,
      name: sub.name,
      sectionName: s.name,
    })),
  );
  const builderTasks: BuilderTask[] = (plan?.tasks ?? []).map((t) => ({
    id: t.id,
    day: t.day,
    subjectId: t.subjectId,
    subjectName: t.subjectName,
    resourceId: t.resourceId,
    resourceName: t.resourceName,
    description: t.description,
    targetQuestions: t.targetQuestions,
    isDone: t.isDone,
  }));
  const builderDays = weekDays(planMonday).map((d, i) => ({
    day: i + 1,
    name: DAY_NAMES_TR[i],
    dateLabel: dayMonthFmt.format(d),
  }));
  const planWeekKey = trDayKey(planMonday);
  const prevWeekKey = trDayKey(addDays(planMonday, -7));
  const nextWeekKey = trDayKey(addDays(planMonday, 7));
  const programHref = (weekKey: string) =>
    `/koc/ogrenciler/${studentId}?tab=program&hafta=${weekKey}`;

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
              {enrollment.coachName && (
                <Badge variant="outline">Koç: {enrollment.coachName}</Badge>
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
            {isAdmin && (
              <HideStudentButton
                studentId={student.id}
                fullName={student.fullName}
              />
            )}
          </div>
        </div>
      </div>

      {/* Sekmeler — ?tab= değişince yeniden kurulur (görüşme → program akışı) */}
      <Tabs key={initialTab} defaultValue={initialTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max">
            <TabsTrigger value="ozet">Özet</TabsTrigger>
            <TabsTrigger value="soru-takibi">Soru Takibi</TabsTrigger>
            <TabsTrigger value="denemeler">Denemeler</TabsTrigger>
            <TabsTrigger value="program">Program</TabsTrigger>
            <TabsTrigger value="gorusmeler">Görüşmeler</TabsTrigger>
            <TabsTrigger value="konular">Konular</TabsTrigger>
            <TabsTrigger value="icerik">İçerik</TabsTrigger>
            <TabsTrigger value="muhasebe">Muhasebe</TabsTrigger>
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
              label="Bu hafta çalışma"
              value={formatMinutes(studyWeek)}
              hint="Kronometre + manuel"
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
                        <span className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="xs"
                            render={
                              <Link
                                href={`/koc/ogrenciler/${studentId}/deneme/${m.id}/analiz`}
                              />
                            }
                          >
                            <ClipboardListIcon data-icon="inline-start" />
                            Analiz
                          </Button>
                          <AnalysisToggle
                            mockExamId={m.id}
                            done={m.analysisDone}
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <AnalizPanel enrollmentId={enrollment.id} />
        </TabsContent>

        {/* ----------------------------- Program ----------------------------- */}
        <TabsContent value="program" className="flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Önceki hafta"
              render={<Link href={programHref(prevWeekKey)} />}
            >
              <ChevronLeftIcon />
            </Button>
            <div className="flex flex-col items-center leading-tight">
              <span className="font-heading text-sm font-semibold">
                {formatWeekLabel(planMonday)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isPlanCurrentWeek
                  ? "Bu hafta"
                  : planMonday.getTime() < currentMonday.getTime()
                    ? "Geçmiş hafta"
                    : "Gelecek hafta"}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="Sonraki hafta"
              render={<Link href={programHref(nextWeekKey)} />}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          {planWeeks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">
                Planlı haftalar:
              </span>
              {planWeeks.map((p) => {
                const weekKey = trDayKey(p.weekStart);
                const isActive = weekKey === planWeekKey;
                return (
                  <Link
                    key={p.id}
                    href={programHref(weekKey)}
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium ring-1 ring-foreground/10 transition-colors",
                      isActive
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 rounded-full",
                        p.status === "draft" ? "bg-warning" : "bg-success",
                      )}
                    />
                    {formatWeekLabel(p.weekStart)}
                  </Link>
                );
              })}
            </div>
          )}

          <ProgramBuilder
            enrollmentId={enrollment.id}
            weekKey={planWeekKey}
            plan={
              plan
                ? {
                    id: plan.id,
                    status: plan.status,
                    motto: plan.motto,
                    coachNote: plan.coachNote,
                  }
                : null
            }
            tasks={builderTasks}
            subjects={builderSubjects}
            resources={resources}
            days={builderDays}
            todayDay={isPlanCurrentWeek ? trWeekday(now) : null}
          />
        </TabsContent>

        {/* ---------------------------- Görüşmeler ---------------------------- */}
        <TabsContent value="gorusmeler" className="pt-2">
          <div className="mb-3">
            <Link
              href={`/koc/ogrenciler/${student.id}/transkript`}
              className="inline-flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-foreground/10 hover:ring-foreground/20"
            >
              <MessageCircleIcon className="size-4 text-muted-foreground" />
              Görüşme transkriptleri (AI önerileri)
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </Link>
          </div>
          <SessionsPanel
            enrollmentId={enrollment.id}
            studentId={student.id}
            upcoming={toSessionItems(sessions.upcoming)}
            past={toSessionItems(sessions.past)}
          />
        </TabsContent>

        {/* ------------------------------ Konular ---------------------------- */}
        <TabsContent value="konular" className="pt-2">
          <KonularTab
            enrollmentId={enrollment.id}
            examTemplateId={enrollment.examTemplateId}
            trackCode={enrollment.trackCode}
          />
        </TabsContent>

        {/* ------------------------------ İçerik ------------------------------ */}
        <TabsContent value="icerik" className="pt-2">
          <IcerikTab
            enrollmentId={enrollment.id}
            examTemplateId={enrollment.examTemplateId}
            studentName={student.fullName}
          />
        </TabsContent>

        {/* ----------------------------- Muhasebe ----------------------------- */}
        <TabsContent value="muhasebe" className="pt-2">
          <MuhasebeTab
            enrollmentId={enrollment.id}
            studentName={student.fullName}
          />
        </TabsContent>

        {/* ------------------------------ Profil ----------------------------- */}
        <TabsContent value="profil" className="pt-2">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Öğrenci bilgilerini düzenle.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 text-sm">
                {isAdmin ? (
                  <>
                    <dt className="self-center text-muted-foreground">Koç</dt>
                    <dd>
                      <CoachAssignSelect
                        key={enrollment.coachUserId ?? "koc-yok"}
                        enrollmentId={enrollment.id}
                        coachUserId={enrollment.coachUserId}
                        coaches={coaches.map((c) => ({
                          id: c.id,
                          name: c.name,
                        }))}
                      />
                    </dd>
                  </>
                ) : (
                  <ProfileRow label="Koç" value={enrollment.coachName} />
                )}
                <ProfileRow
                  label="Başlangıç"
                  value={
                    enrollment.startDate
                      ? dateFmt.format(enrollment.startDate)
                      : null
                  }
                />
              </dl>
              <StudentProfileForm
                variant="coach"
                studentId={studentId}
                initial={{
                  fullName: student.fullName,
                  phone: student.phone ?? "",
                  parentPhone: student.parentPhone ?? "",
                  targetText: enrollment.targetText ?? "",
                  grade: student.grade ?? "",
                  field: student.field ?? "",
                  school: student.school ?? "",
                  dershane: student.dershane ?? "",
                  email: student.email ?? "",
                  telegram: student.telegram ?? "",
                  city: student.city ?? "",
                  birthYear: student.birthYear ?? undefined,
                }}
              />
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

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
      {text}
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  CopyIcon,
  ListChecksIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addPlanTask,
  copyPreviousWeekPlan,
  deletePlanTask,
  publishPlan,
  togglePlanTaskDone,
  updatePlanTask,
  upsertWeeklyPlan,
} from "@/actions/plans";
import {
  LONG_NOTE_CHARS,
  noteTaskCandidates,
  parseCoachNote,
  type NoteTaskCandidate,
} from "@/lib/plan-note";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProgramGrid } from "@/components/app/program-grid";
import { ResourcePicker } from "@/components/app/resource-picker";
import {
  DayLayoutDialog,
  type LayoutSource,
} from "@/components/app/program-day-layout";
import {
  DAY_COLORS,
  defaultDayColor,
  type DayLayoutEntry,
} from "@/lib/plan-layout";

export type BuilderSubject = {
  id: number;
  name: string;
  sectionName: string;
  /** Dersin sınavı — çift sınavlı kayıtta rozet/filtre için. */
  examCode?: string;
  examName?: string;
};
export type BuilderResource = { id: number; name: string };
export type BuilderTask = {
  id: number;
  /** 1..7 = güne atanmış; null = haftalık konu (güne atanmamış). */
  day: number | null;
  subjectId: number | null;
  subjectName: string | null;
  /** Göreve bağlı kaynaklar — birden çok olabilir, seçim sırasında. */
  resourceIds: number[];
  resourceNames: string[];
  description: string | null;
  targetQuestions: number | null;
  isDone: boolean;
};
export type BuilderDay = { day: number; name: string; dateLabel: string };

export type BuilderPlan = {
  id: number;
  status: "draft" | "published" | "completed";
  motto: string | null;
  coachNote: string | null;
  proposedByStudent?: boolean;
  studentSubmittedAt?: Date | string | null;
} | null;

type Props = {
  enrollmentId: number;
  /** Haftanın pazartesisi, yyyy-mm-dd. */
  weekKey: string;
  plan: BuilderPlan;
  tasks: BuilderTask[];
  subjects: BuilderSubject[];
  resources: BuilderResource[];
  days: BuilderDay[];
  /** Görüntülenen hafta bu haftaysa bugünün günü (1-7), değilse null. */
  todayDay: number | null;
  /** Haftadan haftaya sabit ders düzeni (7 gün, boş günler dahil). */
  layout: DayLayoutEntry[];
  /** Düzeni dolu diğer kayıtlar — "başka öğrenciden kopyala". */
  layoutSources: LayoutSource[];
};

const STATUS_META = {
  draft: { label: "Hazırlanıyor", className: "bg-warning/10 text-warning" },
  published: { label: "Yayınlandı", className: "bg-success/10 text-success" },
  completed: { label: "Tamamlandı", className: "bg-muted text-muted-foreground" },
} as const;

type TaskDialogState =
  /** subjectId: düzendeki dersin altından eklenirken ön-doldurulur. */
  | { mode: "add"; day: number; subjectId?: number }
  | { mode: "edit"; task: BuilderTask }
  | null;

type View = "hafta" | "gun";

/** Koç kokpiti — haftalık program kurucusu (ders × konu + günlük dağılım). */
export function ProgramBuilder({
  enrollmentId,
  weekKey,
  plan,
  tasks,
  subjects,
  resources,
  days,
  todayDay,
  layout,
  layoutSources,
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("hafta");
  const [motto, setMotto] = useState(plan?.motto ?? "");
  const [coachNote, setCoachNote] = useState(plan?.coachNote ?? "");
  const [savingMeta, setSavingMeta] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copying, setCopying] = useState(false);
  const [taskDialog, setTaskDialog] = useState<TaskDialogState>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({});
  const [togglePending, startToggle] = useTransition();

  const noteCandidates = useMemo(
    () => noteTaskCandidates(parseCoachNote(coachNote)),
    [coachNote],
  );

  const layoutByDay = useMemo(
    () => new Map(layout.map((d) => [d.day, d])),
    [layout],
  );
  const subjectById = useMemo(
    () => new Map(subjects.map((s) => [s.id, s])),
    [subjects],
  );
  /** İki sınava birden hazırlanan öğrencide ders adlarına sınav kodu eklenir. */
  const multiExam = useMemo(
    () => new Set(subjects.map((s) => s.examCode).filter(Boolean)).size > 1,
    [subjects],
  );
  const dayNames = useMemo(
    () => Object.fromEntries(days.map((d) => [d.day, d.name])),
    [days],
  );

  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const status = plan?.status ?? "draft";
  const statusMeta = STATUS_META[status];
  const weekTasks = tasks.filter((t) => t.day == null);
  /*
   * Koçun kurduğu program ilk konuyla birlikte kendiliğinden yayına girer —
   * ayrı "Yayınla" adımı yok. Onay yalnız ÖĞRENCİNİN kendi önerdiği taslakta
   * gerekir; koç onaylayana kadar öğrenci konuları işaretleyemez.
   */
  const isStudentProposal = status === "draft" && Boolean(plan?.proposedByStudent);

  const metaDirty =
    motto !== (plan?.motto ?? "") || coachNote !== (plan?.coachNote ?? "");

  const saveMeta = async () => {
    setSavingMeta(true);
    const res = await upsertWeeklyPlan({
      enrollmentId,
      weekStart: weekKey,
      motto,
      coachNote,
    });
    setSavingMeta(false);
    if (res.ok) {
      toast.success("Strateji kaydedildi");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const publish = async () => {
    if (!plan) return;
    setPublishing(true);
    const res = await publishPlan({ planId: plan.id });
    setPublishing(false);
    if (res.ok) {
      toast.success("Öğrencinin önerisi onaylandı 🎉", {
        description: "Program resmileşti — öğrenci artık konuları işaretleyebilir.",
      });
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const copyPrevious = async () => {
    setCopying(true);
    const res = await copyPreviousWeekPlan({ enrollmentId, weekStart: weekKey });
    setCopying(false);
    if (res.ok) {
      toast.success(`${res.data.added} konu geçen haftadan kopyalandı`);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const toggleTask = (task: BuilderTask) => {
    startToggle(async () => {
      const res = await togglePlanTaskDone({
        taskId: task.id,
        isDone: !task.isDone,
      });
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  };

  const removeTask = (task: BuilderTask) => {
    startToggle(async () => {
      const res = await deletePlanTask({ taskId: task.id });
      if (res.ok) {
        toast.success("Görev silindi");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const isDayOpen = (day: number) =>
    openDays[day] ?? (todayDay !== null ? day === todayDay : day === 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Durum + tamamlanma + yayınla */}
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
            {isStudentProposal && (
              <Badge className="bg-info/10 text-info">Öğrenci önerisi</Badge>
            )}
            <span className="text-sm text-muted-foreground tabular-nums">
              {done}/{total} konu · %{pct}
            </span>
          </div>
          {isStudentProposal && (
            <Button
              size="sm"
              onClick={publish}
              disabled={publishing || !plan || total === 0}
            >
              <SendIcon data-icon="inline-start" />
              {publishing ? "Onaylanıyor…" : "Onayla"}
            </Button>
          )}
        </div>

        {total > 0 && (
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Program tamamlanma yüzdesi"
          >
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {isStudentProposal ? (
          <p className="text-xs text-muted-foreground">
            Öğrencinin kendi önerisi — <span className="font-medium">Onayla</span>
            &apos;ya basana kadar konuları işaretleyemez.
          </p>
        ) : (
          status === "draft" && (
            <p className="text-xs text-muted-foreground">
              İlk konuyu ekler eklemez program öğrenciye açılır — ayrı bir
              yayınlama adımı yok.
            </p>
          )
        )}
      </div>

      {/* Strateji / Koç notu — programdan ayrı, stratejik panel */}
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-sm font-semibold">
            Strateji / Koç notu
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={saveMeta}
            disabled={savingMeta || !metaDirty}
          >
            <SaveIcon data-icon="inline-start" />
            {savingMeta ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="plan-motto">Haftanın mottosu</FieldLabel>
            <Input
              id="plan-motto"
              placeholder="Örn. Bu hafta istikrar haftası 💪"
              value={motto}
              maxLength={200}
              onChange={(e) => setMotto(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="plan-not">Koç notu</FieldLabel>
            <Textarea
              id="plan-not"
              placeholder="Öğrencinin bu hafta odaklanacağı stratejik noktalar…"
              value={coachNote}
              maxLength={2000}
              rows={2}
              onChange={(e) => setCoachNote(e.target.value)}
            />
          </Field>
        </div>

        {/*
          Uzun not = öğrenci ekranında metin duvarı. Notu gün gün göreve
          çevirmeyi öner — öğrenci "ne çalışacağım"ı işaretlenebilir maddeler
          hâlinde görsün.
        */}
        {noteCandidates.length > 1 && coachNote.length > LONG_NOTE_CHARS && (
          <div className="flex flex-col items-start gap-2 rounded-xl bg-info/10 p-3.5 text-sm text-pretty text-muted-foreground sm:flex-row sm:items-center">
            <ListChecksIcon className="size-4 shrink-0 text-info" />
            <span className="min-w-0 flex-1">
              Bu not uzun — öğrenciler gün gün işaretlenebilir görev listesini çok
              daha rahat okuyor.
            </span>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setConvertOpen(true)}
            >
              Notu görevlere dönüştür
            </Button>
          </div>
        )}
      </div>

      {/* Görünüm geçişi + araçlar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ViewToggle view={view} onChange={setView} />
        <div className="flex flex-wrap items-center gap-2">
          <DayLayoutDialog
            enrollmentId={enrollmentId}
            layout={layout}
            subjects={subjects}
            sources={layoutSources}
            dayNames={dayNames}
          />
          {/*
            Haftalık program iskeleti çoğu öğrencide sabit — kopyalama her hafta
            erişilebilir olmalı, yalnız hafta boşken değil. Dolu haftada üzerine
            EKLER (silmez), o yüzden metin de "ekle" der.
          */}
          <Button
            variant="outline"
            size="sm"
            onClick={copyPrevious}
            disabled={copying}
          >
            <CopyIcon data-icon="inline-start" />
            {copying
              ? "Kopyalanıyor…"
              : total === 0
                ? "Geçen haftadan kopyala"
                : "Geçen haftayı ekle"}
          </Button>
        </div>
      </div>

      {view === "hafta" ? (
        <ProgramGrid
          enrollmentId={enrollmentId}
          weekKey={weekKey}
          subjects={subjects}
          resources={resources}
          days={days}
          tasks={tasks}
          mode="edit"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Gün atanmamış (haftalık) konular */}
          {weekTasks.length > 0 && (
            <section className="flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Bu hafta · gün atanmamış
              </span>
              {weekTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  togglePending={togglePending}
                  onToggle={() => toggleTask(task)}
                  onEdit={() => setTaskDialog({ mode: "edit", task })}
                  onRemove={() => removeTask(task)}
                />
              ))}
            </section>
          )}

          {/* Gün sütunları (mobilde akordeon) */}
          <div className="grid gap-3 lg:grid-cols-7 lg:gap-2">
            {days.map((d) => {
              const dayTasks = tasks.filter((t) => t.day === d.day);
              const open = isDayOpen(d.day);
              const isToday = todayDay === d.day;
              const entry = layoutByDay.get(d.day);
              const tone = DAY_COLORS[entry?.color ?? defaultDayColor(d.day)];
              /*
                Düzendeki dersler o günün iskeleti: her ders kendi bölmesini
                alır, altına doğrudan konu eklenir (ders + gün önceden dolu).
                Düzende olmayan derse yazılmış görevler "Diğer"e düşer — düzen
                değişse bile hiçbir görev gizlenmez.
              */
              const layoutSubjectIds = entry?.subjectIds ?? [];
              const otherTasks = dayTasks.filter(
                (t) => t.subjectId == null || !layoutSubjectIds.includes(t.subjectId),
              );
              return (
                <section
                  key={d.day}
                  className={cn(
                    "flex flex-col rounded-xl bg-card ring-1",
                    layoutSubjectIds.length > 0
                      ? tone.card
                      : "ring-foreground/10",
                    isToday && "ring-primary/40",
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenDays((prev) => ({ ...prev, [d.day]: !open }))
                    }
                    className="flex items-center justify-between gap-2 p-3 text-left lg:pointer-events-none"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-semibold",
                          isToday && "text-primary",
                        )}
                      >
                        {layoutSubjectIds.length > 0 && (
                          <span
                            className={cn("size-2 shrink-0 rounded-full", tone.dot)}
                          />
                        )}
                        {d.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {d.dateLabel}
                        {dayTasks.length > 0 && ` · ${dayTasks.length} görev`}
                      </span>
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform lg:hidden",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "flex-col gap-2 px-3 pb-3",
                      open ? "flex" : "hidden lg:flex",
                    )}
                  >
                    {layoutSubjectIds.map((subjectId) => {
                      const subject = subjectById.get(subjectId);
                      if (!subject) return null;
                      const subjectTasks = dayTasks.filter(
                        (t) => t.subjectId === subjectId,
                      );
                      return (
                        <div key={subjectId} className="flex flex-col gap-1.5">
                          <span
                            className={cn(
                              "self-start rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              tone.chip,
                            )}
                          >
                            {subject.name}
                            {multiExam && subject.examCode
                              ? ` · ${subject.examCode}`
                              : ""}
                          </span>
                          {subjectTasks.map((task) => (
                            <TaskRow
                              key={task.id}
                              task={task}
                              togglePending={togglePending}
                              onToggle={() => toggleTask(task)}
                              onEdit={() =>
                                setTaskDialog({ mode: "edit", task })
                              }
                              onRemove={() => removeTask(task)}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setTaskDialog({ mode: "add", day: d.day, subjectId })
                            }
                            className="flex items-center gap-1 self-start rounded-md px-1 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
                          >
                            <PlusIcon className="size-3" />
                            Konu ekle
                          </button>
                        </div>
                      );
                    })}

                    {otherTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        togglePending={togglePending}
                        onToggle={() => toggleTask(task)}
                        onEdit={() => setTaskDialog({ mode: "edit", task })}
                        onRemove={() => removeTask(task)}
                      />
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-center border-dashed"
                      onClick={() => setTaskDialog({ mode: "add", day: d.day })}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Görev ekle
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* Görev ekle/düzenle diyaloğu (gün görünümü) */}
      <Dialog
        open={taskDialog !== null}
        onOpenChange={(open) => {
          if (!open) setTaskDialog(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {taskDialog?.mode === "edit" ? "Görevi düzenle" : "Yeni görev"}
            </DialogTitle>
            <DialogDescription>
              Ders seçimi opsiyonel. Günü boş bırakırsan bu haftanın genel konusu
              olur.
            </DialogDescription>
          </DialogHeader>
          {taskDialog && (
            <TaskForm
              key={
                taskDialog.mode === "edit"
                  ? `edit-${taskDialog.task.id}`
                  : `add-${taskDialog.day}-${taskDialog.subjectId ?? 0}`
              }
              enrollmentId={enrollmentId}
              weekKey={weekKey}
              subjects={subjects}
              resources={resources}
              days={days}
              initial={taskDialog}
              onDone={() => setTaskDialog(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Koç notunu gün gün göreve dönüştürme */}
      <Dialog
        open={convertOpen}
        onOpenChange={(open) => {
          if (!open) setConvertOpen(false);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notu görevlere dönüştür</DialogTitle>
            <DialogDescription>
              Her madde bir görev olur. Günleri kontrol et, istemediklerinin
              işaretini kaldır. Not silinmez — olduğu gibi kalır.
            </DialogDescription>
          </DialogHeader>
          {convertOpen && (
            <NoteConverter
              enrollmentId={enrollmentId}
              weekKey={weekKey}
              candidates={noteCandidates}
              days={days}
              onDone={() => setConvertOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Görünüm geçişi                                                            */
/* -------------------------------------------------------------------------- */

function ViewToggle({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const items: { value: View; label: string }[] = [
    { value: "hafta", label: "Hafta · ders" },
    { value: "gun", label: "Gün" },
  ];
  return (
    <div className="inline-flex rounded-full bg-muted p-0.5">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            view === it.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gün görünümü görev satırı                                                 */
/* -------------------------------------------------------------------------- */

function TaskRow({
  task,
  togglePending,
  onToggle,
  onEdit,
  onRemove,
}: {
  task: BuilderTask;
  togglePending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-2.5">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={togglePending}
          aria-label={
            task.isDone ? "Görevi geri al" : "Görevi tamamlandı işaretle"
          }
          className="mt-0.5 shrink-0"
        >
          {task.isDone ? (
            <CheckCircle2Icon className="size-4.5 text-success" />
          ) : (
            <CircleIcon className="size-4.5 text-muted-foreground/50" />
          )}
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {task.subjectName && (
            <span className="text-[11px] font-semibold text-primary">
              {task.subjectName}
            </span>
          )}
          <p
            className={cn(
              "text-sm break-words",
              task.isDone && "text-muted-foreground line-through",
            )}
          >
            {task.description}
          </p>
          {(task.targetQuestions != null || task.resourceNames.length > 0) && (
            <span className="text-[11px] text-muted-foreground">
              {[
                task.targetQuestions != null
                  ? `${task.targetQuestions} soru`
                  : null,
                // Kaynaklar kendi aralarında virgülle ayrılır.
                task.resourceNames.length > 0
                  ? task.resourceNames.join(", ")
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Görevi düzenle"
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Görevi sil"
          className="text-destructive hover:text-destructive"
          disabled={togglePending}
          onClick={onRemove}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Koç notu → görev dönüştürücü                                             */
/* -------------------------------------------------------------------------- */

/**
 * Notun maddelerini toplu göreve çevirir. Görevler `addPlanTask` ile TEK TEK
 * ve SIRAYLA eklenir — `slot` sıralaması mevcut en yüksek slot'tan türetildiği
 * için paralel çağrılar aynı slot'u alabilir (bkz. actions/plans.ts).
 */
function NoteConverter({
  enrollmentId,
  weekKey,
  candidates,
  days,
  onDone,
}: {
  enrollmentId: number;
  weekKey: string;
  candidates: NoteTaskCandidate[];
  days: BuilderDay[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState(() =>
    candidates.map((c) => ({ ...c, selected: true })),
  );

  const dayItems = days.map((d) => ({ value: d.day, label: d.name }));
  const selectedCount = rows.filter((r) => r.selected).length;

  const update = (key: string, patch: Partial<(typeof rows)[number]>) =>
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );

  const convert = async () => {
    const picked = rows.filter((r) => r.selected);
    if (picked.length === 0) return;
    setSaving(true);
    let failed = 0;
    for (const row of picked) {
      const res = await addPlanTask({
        enrollmentId,
        weekStart: weekKey,
        day: row.day,
        subjectId: null,
        resourceIds: [],
        description: row.description,
        targetQuestions: null,
      });
      if (!res.ok) failed++;
    }
    setSaving(false);
    if (failed > 0) {
      toast.error(
        `${picked.length - failed} görev eklendi, ${failed} tanesi eklenemedi.`,
      );
    } else {
      toast.success(`${picked.length} görev eklendi`, {
        description: "Ders ve hedef soru bilgisini görevlerden düzenleyebilirsin.",
      });
    }
    onDone();
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className={cn(
              "flex items-start gap-2 rounded-lg bg-muted/50 p-2.5",
              !row.selected && "opacity-50",
            )}
          >
            <input
              type="checkbox"
              aria-label={`${row.description} görevini ekle`}
              className="mt-2 size-4 shrink-0 accent-primary"
              checked={row.selected}
              onChange={(e) => update(row.key, { selected: e.target.checked })}
            />
            <input
              type="text"
              aria-label="Görev açıklaması"
              value={row.description}
              maxLength={300}
              onChange={(e) => update(row.key, { description: e.target.value })}
              className="h-9 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm outline-none hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Select
              items={dayItems}
              value={row.day}
              onValueChange={(v) => {
                if (typeof v === "number") update(row.key, { day: v });
              }}
            >
              <SelectTrigger aria-label="Gün" className="h-9 w-28 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayItems.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {selectedCount}/{rows.length} madde seçili
        </span>
        <Button onClick={convert} disabled={saving || selectedCount === 0}>
          {saving ? "Ekleniyor…" : `${selectedCount} görev olarak ekle`}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Görev formu (gün görünümü diyaloğu)                                       */
/* -------------------------------------------------------------------------- */

function TaskForm({
  enrollmentId,
  weekKey,
  subjects,
  resources,
  days,
  initial,
  onDone,
}: {
  enrollmentId: number;
  weekKey: string;
  subjects: BuilderSubject[];
  resources: BuilderResource[];
  days: BuilderDay[];
  initial: NonNullable<TaskDialogState>;
  onDone: () => void;
}) {
  const router = useRouter();
  const editTask = initial.mode === "edit" ? initial.task : null;
  const [saving, setSaving] = useState(false);
  // 0 = güne atanmamış (haftalık konu).
  const [day, setDay] = useState<number>(
    editTask ? (editTask.day ?? 0) : initial.mode === "add" ? initial.day : 0,
  );
  // Düzendeki dersin altından "Konu ekle"ye basıldıysa ders hazır gelir.
  const [subjectId, setSubjectId] = useState<number>(
    editTask?.subjectId ??
      (initial.mode === "add" ? (initial.subjectId ?? 0) : 0),
  );
  const [resourceIds, setResourceIds] = useState<number[]>(
    editTask?.resourceIds ?? [],
  );
  const [description, setDescription] = useState(editTask?.description ?? "");
  const [target, setTarget] = useState(
    editTask?.targetQuestions != null ? String(editTask.targetQuestions) : "",
  );

  const dayItems = [
    { value: 0, label: "Bu hafta (gün yok)" },
    ...days.map((d) => ({ value: d.day, label: d.name })),
  ];
  const subjectItems = [
    { value: 0, label: "Genel (ders seçme)" },
    ...subjects.map((s) => ({
      value: s.id,
      label: `${s.name} · ${s.sectionName}`,
    })),
  ];

  const submit = async () => {
    if (description.trim() === "") {
      toast.error("Görev açıklaması gerekli.");
      return;
    }
    const shared = {
      day: day === 0 ? null : day,
      subjectId: subjectId === 0 ? null : subjectId,
      resourceIds,
      description,
      targetQuestions: target === "" ? null : Math.min(2000, Number(target)),
    };
    setSaving(true);
    const res = editTask
      ? await updatePlanTask({ taskId: editTask.id, ...shared })
      : await addPlanTask({ enrollmentId, weekStart: weekKey, ...shared });
    setSaving(false);
    if (res.ok) {
      toast.success(editTask ? "Görev güncellendi" : "Görev eklendi");
      onDone();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="gorev-gun">Gün</FieldLabel>
          <Select
            items={dayItems}
            value={day}
            onValueChange={(v) => {
              if (typeof v === "number") setDay(v);
            }}
          >
            <SelectTrigger id="gorev-gun" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayItems.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="gorev-ders">Ders</FieldLabel>
          <Select
            items={subjectItems}
            value={subjectId}
            onValueChange={(v) => {
              if (typeof v === "number") setSubjectId(v);
            }}
          >
            <SelectTrigger id="gorev-ders" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subjectItems.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="gorev-aciklama">Açıklama *</FieldLabel>
        <Textarea
          id="gorev-aciklama"
          placeholder="Örn. Türev tekrar + 40 soru (Limit fasikül)"
          value={description}
          maxLength={300}
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="gorev-hedef">Hedef soru</FieldLabel>
          <Input
            id="gorev-hedef"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Örn. 40"
            value={target}
            onChange={(e) =>
              setTarget(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </Field>
      </div>

      <ResourcePicker
        idPrefix="gorev-kaynak"
        resources={resources}
        value={resourceIds}
        onChange={setResourceIds}
      />

      <Button
        onClick={submit}
        disabled={saving || description.trim() === ""}
        className="self-end"
      >
        {saving
          ? "Kaydediliyor…"
          : editTask
            ? "Görevi kaydet"
            : "Görevi ekle"}
      </Button>
    </div>
  );
}

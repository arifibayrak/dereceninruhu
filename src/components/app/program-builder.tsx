"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addPlanTask,
  deletePlanTask,
  publishPlan,
  togglePlanTaskDone,
  updatePlanTask,
  upsertWeeklyPlan,
} from "@/actions/plans";
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

export type BuilderSubject = { id: number; name: string; sectionName: string };
export type BuilderResource = { id: number; name: string };
export type BuilderTask = {
  id: number;
  day: number;
  subjectId: number | null;
  subjectName: string | null;
  resourceId: number | null;
  resourceName: string | null;
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
};

const STATUS_META = {
  draft: { label: "Taslak", className: "bg-warning/10 text-warning" },
  published: { label: "Yayınlandı", className: "bg-success/10 text-success" },
  completed: { label: "Tamamlandı", className: "bg-muted text-muted-foreground" },
} as const;

type TaskDialogState =
  | { mode: "add"; day: number }
  | { mode: "edit"; task: BuilderTask }
  | null;

/** Koç kokpiti — haftalık program kurucusu (Pzt–Paz, görev ekle/düzenle/yayınla). */
export function ProgramBuilder({
  enrollmentId,
  weekKey,
  plan,
  tasks,
  subjects,
  resources,
  days,
  todayDay,
}: Props) {
  const router = useRouter();
  const [motto, setMotto] = useState(plan?.motto ?? "");
  const [coachNote, setCoachNote] = useState(plan?.coachNote ?? "");
  const [savingMeta, setSavingMeta] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [taskDialog, setTaskDialog] = useState<TaskDialogState>(null);
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({});
  const [togglePending, startToggle] = useTransition();

  const total = tasks.length;
  const done = tasks.filter((t) => t.isDone).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const status = plan?.status ?? "draft";
  const statusMeta = STATUS_META[status];

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
      toast.success("Program kaydedildi");
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
      toast.success("Program yayınlandı 🎉", {
        description: "Öğrenci artık bu haftanın programını görüyor.",
      });
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
      {/* Üst bilgi: durum + tamamlanma + motto/not + yayınla */}
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
            <span className="text-sm text-muted-foreground tabular-nums">
              {done}/{total} görev · %{pct}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={saveMeta}
              disabled={savingMeta || !metaDirty}
            >
              <SaveIcon data-icon="inline-start" />
              {savingMeta ? "Kaydediliyor…" : "Kaydet"}
            </Button>
            {status === "draft" && (
              <Button
                size="sm"
                onClick={publish}
                disabled={publishing || !plan || total === 0}
              >
                <SendIcon data-icon="inline-start" />
                {publishing ? "Yayınlanıyor…" : "Yayınla"}
              </Button>
            )}
          </div>
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
              placeholder="Öğrencinin bu hafta odaklanacağı noktalar…"
              value={coachNote}
              maxLength={2000}
              rows={2}
              onChange={(e) => setCoachNote(e.target.value)}
            />
          </Field>
        </div>

        {status === "draft" && total > 0 && (
          <p className="text-xs text-muted-foreground">
            Program taslak — öğrenci <span className="font-medium">Yayınla</span>
            &apos;ya basana kadar görmez.
          </p>
        )}
      </div>

      {/* Gün sütunları (mobilde akordeon) */}
      <div className="grid gap-3 lg:grid-cols-7 lg:gap-2">
        {days.map((d) => {
          const dayTasks = tasks.filter((t) => t.day === d.day);
          const open = isDayOpen(d.day);
          const isToday = todayDay === d.day;
          return (
            <section
              key={d.day}
              className={cn(
                "flex flex-col rounded-xl bg-card ring-1 ring-foreground/10",
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
                      "text-sm font-semibold",
                      isToday && "text-primary",
                    )}
                  >
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
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTask(task)}
                        disabled={togglePending}
                        aria-label={
                          task.isDone
                            ? "Görevi geri al"
                            : "Görevi tamamlandı işaretle"
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
                            task.isDone &&
                              "text-muted-foreground line-through",
                          )}
                        >
                          {task.description}
                        </p>
                        {(task.targetQuestions != null ||
                          task.resourceName) && (
                          <span className="text-[11px] text-muted-foreground">
                            {[
                              task.targetQuestions != null
                                ? `${task.targetQuestions} soru`
                                : null,
                              task.resourceName,
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
                        onClick={() => setTaskDialog({ mode: "edit", task })}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Görevi sil"
                        className="text-destructive hover:text-destructive"
                        disabled={togglePending}
                        onClick={() => removeTask(task)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
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

      {/* Görev ekle/düzenle diyaloğu */}
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
              Ders seçimi opsiyonel — açıklama yeterli. Konu listeleri sonraki
              fazda geliyor.
            </DialogDescription>
          </DialogHeader>
          {taskDialog && (
            <TaskForm
              key={
                taskDialog.mode === "edit"
                  ? `edit-${taskDialog.task.id}`
                  : `add-${taskDialog.day}`
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Görev formu (diyalog içi)                                                 */
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
  const [day, setDay] = useState<number>(
    editTask ? editTask.day : initial.mode === "add" ? initial.day : 1,
  );
  const [subjectId, setSubjectId] = useState<number>(editTask?.subjectId ?? 0);
  const [resourceId, setResourceId] = useState<number>(
    editTask?.resourceId ?? 0,
  );
  const [description, setDescription] = useState(editTask?.description ?? "");
  const [target, setTarget] = useState(
    editTask?.targetQuestions != null ? String(editTask.targetQuestions) : "",
  );

  const dayItems = days.map((d) => ({ value: d.day, label: d.name }));
  const subjectItems = [
    { value: 0, label: "Genel (ders seçme)" },
    ...subjects.map((s) => ({
      value: s.id,
      label: `${s.name} · ${s.sectionName}`,
    })),
  ];
  const resourceItems = [
    { value: 0, label: "Kaynak yok" },
    ...resources.map((r) => ({ value: r.id, label: r.name })),
  ];

  const submit = async () => {
    if (description.trim() === "") {
      toast.error("Görev açıklaması gerekli.");
      return;
    }
    const shared = {
      day,
      subjectId: subjectId === 0 ? null : subjectId,
      resourceId: resourceId === 0 ? null : resourceId,
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
        {resources.length > 0 && (
          <Field>
            <FieldLabel htmlFor="gorev-kaynak">Kaynak</FieldLabel>
            <Select
              items={resourceItems}
              value={resourceId}
              onValueChange={(v) => {
                if (typeof v === "number") setResourceId(v);
              }}
            >
              <SelectTrigger id="gorev-kaynak" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resourceItems.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>

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

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import {
  addPlanTask,
  deletePlanTask,
  togglePlanTaskDone,
  updatePlanTask,
} from "@/actions/plans";
import { cn } from "@/lib/utils";
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
import { ResourcePicker } from "@/components/app/resource-picker";

/* -------------------------------------------------------------------------- */
/*  Tipler                                                                     */
/* -------------------------------------------------------------------------- */

export type GridSubject = { id: number; name: string; sectionName?: string };
export type GridResource = { id: number; name: string };
export type GridDay = { day: number; name: string };
export type GridTask = {
  id: number;
  /** 1..7 = güne atanmış; null = haftalık konu (güne atanmamış). */
  day: number | null;
  subjectId: number | null;
  subjectName: string | null;
  /** Konuya bağlı kaynaklar — birden çok olabilir, seçim sırasında. */
  resourceIds: number[];
  resourceNames: string[];
  description: string | null;
  targetQuestions: number | null;
  isDone: boolean;
};

/** Kısa gün etiketleri (gün rozeti). 1=Pzt … 7=Paz. */
const SHORT_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

type Column = {
  subjectId: number | null;
  subjectName: string | null;
  tasks: GridTask[];
};

/**
 * Görevleri DERS kolonlarına böler. `subjects` sırayı verir; boş kolonlar da
 * (edit modunda "konu ekle" için) render edilir. Dersi olmayan görevler sonda
 * "Genel" kolonunda toplanır (yalnız içinde görev varsa gösterilir).
 */
function toColumns(subjects: GridSubject[], tasks: GridTask[]): Column[] {
  const cols: Column[] = subjects.map((s) => ({
    subjectId: s.id,
    subjectName: s.name,
    tasks: [],
  }));
  const byId = new Map(cols.map((c) => [c.subjectId, c]));
  const general: Column = { subjectId: null, subjectName: null, tasks: [] };
  for (const t of tasks) {
    const col = t.subjectId != null ? byId.get(t.subjectId) : undefined;
    (col ?? general).tasks.push(t);
  }
  return general.tasks.length > 0 ? [...cols, general] : cols;
}

type Props = {
  enrollmentId: number;
  /** Haftanın pazartesisi, yyyy-mm-dd. */
  weekKey: string;
  subjects: GridSubject[];
  resources: GridResource[];
  days: GridDay[];
  tasks: GridTask[];
  /** check = öğrenci yayınlanmış programı işaretler; edit = ekle/düzenle/sil. */
  mode: "check" | "edit";
};

type DialogState =
  | { mode: "add"; subjectId: number | null }
  | { mode: "edit"; task: GridTask }
  | null;

/** İyimser tamam/geri-al — check modunda konu hücresine dokununca. */
function useDoneToggle() {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});
  const doneOf = (t: GridTask) => overrides[t.id] ?? t.isDone;
  const toggle = async (t: GridTask) => {
    const next = !doneOf(t);
    setOverrides((prev) => ({ ...prev, [t.id]: next }));
    const res = await togglePlanTaskDone({ taskId: t.id, isDone: next });
    if (!res.ok) {
      setOverrides((prev) => ({ ...prev, [t.id]: !next }));
      toast.error(res.error);
    } else {
      router.refresh();
    }
  };
  return { doneOf, toggle };
}

/**
 * Ders × konu programı (Görsel: HAFTALIK DERS ÇALIŞMA PROGRAMI). Masaüstünde
 * ders kolonları (yatay kaydırılır), mobilde ders başına açılır kapanır kart.
 * `check` modunda öğrenci konuları işaretler; `edit` modunda koç ya da öğrenci
 * kendi taslağında konu ekler/düzenler/siler.
 */
export function ProgramGrid({
  enrollmentId,
  weekKey,
  subjects,
  resources,
  days,
  tasks,
  mode,
}: Props) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const { doneOf, toggle } = useDoneToggle();
  const columns = useMemo(() => toColumns(subjects, tasks), [subjects, tasks]);
  const editable = mode === "edit";

  const cellProps = { editable, doneOf, toggle, setDialog };

  return (
    <div className="flex flex-col gap-3">
      {/* Masaüstü — ders kolonları, yatay kaydırma + yapışkan başlıklar yok */}
      <div className="hidden overflow-x-auto rounded-2xl bg-card p-3 ring-1 ring-foreground/10 lg:block">
        <div className="flex gap-3">
          {columns.map((col) => (
            <div
              key={col.subjectId ?? "genel"}
              className="flex w-56 shrink-0 flex-col gap-2"
            >
              <div className="flex items-baseline justify-between gap-1 border-b border-foreground/10 pb-1.5">
                <span className="font-heading text-sm font-semibold text-primary">
                  {col.subjectName ?? "Genel"}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {col.tasks.length}
                </span>
              </div>
              {col.tasks.map((t) => (
                <TopicCell key={t.id} task={t} {...cellProps} />
              ))}
              {editable && (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-center border-dashed"
                  onClick={() =>
                    setDialog({ mode: "add", subjectId: col.subjectId })
                  }
                >
                  <PlusIcon data-icon="inline-start" />
                  Konu
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobil — ders başına açılır kapanır kart */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        {columns.map((col) => (
          <SubjectCard
            key={col.subjectId ?? "genel"}
            col={col}
            editable={editable}
            doneOf={doneOf}
            toggle={toggle}
            setDialog={setDialog}
          />
        ))}
      </div>

      {editable && dialog && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialog.mode === "edit" ? "Konuyu düzenle" : "Yeni konu"}
              </DialogTitle>
              <DialogDescription>
                Konuyu bir derse ekle. İstersen bir güne de ata — atamazsan bu
                haftanın genel konusu olur.
              </DialogDescription>
            </DialogHeader>
            <TopicForm
              key={dialog.mode === "edit" ? `e-${dialog.task.id}` : "add"}
              enrollmentId={enrollmentId}
              weekKey={weekKey}
              subjects={subjects}
              resources={resources}
              days={days}
              state={dialog}
              onDone={() => setDialog(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Konu hücresi                                                               */
/* -------------------------------------------------------------------------- */

function TopicMeta({ task }: { task: GridTask }) {
  const meta = [
    task.day != null ? SHORT_DAYS[task.day - 1] : null,
    task.targetQuestions != null ? `${task.targetQuestions} soru` : null,
    // Kaynaklar kendi aralarında virgülle — meta ayracı "·" kalabalıklaşmasın.
    task.resourceNames.length > 0 ? task.resourceNames.join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  if (!meta) return null;
  return <span className="text-[11px] text-muted-foreground">{meta}</span>;
}

function TopicCell({
  task,
  editable,
  doneOf,
  toggle,
  setDialog,
}: {
  task: GridTask;
  editable: boolean;
  doneOf: (t: GridTask) => boolean;
  toggle: (t: GridTask) => void;
  setDialog: (s: DialogState) => void;
}) {
  const done = doneOf(task);

  if (!editable) {
    return (
      <button
        type="button"
        onClick={() => toggle(task)}
        aria-pressed={done}
        className={cn(
          "flex w-full items-start gap-2 rounded-lg bg-muted/50 p-2 text-left transition-colors active:bg-muted",
          done && "bg-success/5",
        )}
      >
        {done ? (
          <CheckCircle2Icon className="mt-0.5 size-4.5 shrink-0 text-success" />
        ) : (
          <CircleIcon className="mt-0.5 size-4.5 shrink-0 text-muted-foreground/40" />
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "text-sm break-words",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.description || "Konu"}
          </span>
          <TopicMeta task={task} />
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2">
      <p className="text-sm break-words">{task.description || "Konu"}</p>
      <div className="flex items-center justify-between gap-1">
        <TopicMeta task={task} />
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Konuyu düzenle"
            onClick={() => setDialog({ mode: "edit", task })}
          >
            <PencilIcon />
          </Button>
          <DeleteTopicButton taskId={task.id} />
        </div>
      </div>
    </div>
  );
}

function DeleteTopicButton({ taskId }: { taskId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const remove = async () => {
    setPending(true);
    const res = await deletePlanTask({ taskId });
    setPending(false);
    if (res.ok) {
      toast.success("Konu silindi");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Konuyu sil"
      className="text-destructive hover:text-destructive"
      disabled={pending}
      onClick={remove}
    >
      <Trash2Icon />
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mobil — ders kartı                                                        */
/* -------------------------------------------------------------------------- */

function SubjectCard({
  col,
  editable,
  doneOf,
  toggle,
  setDialog,
}: {
  col: Column;
  editable: boolean;
  doneOf: (t: GridTask) => boolean;
  toggle: (t: GridTask) => void;
  setDialog: (s: DialogState) => void;
}) {
  // Dolu dersler açık başlar; boş dersler (edit) kapalı.
  const [open, setOpen] = useState(col.tasks.length > 0);
  const done = col.tasks.filter(doneOf).length;

  return (
    <section className="flex flex-col rounded-xl bg-card ring-1 ring-foreground/10">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between gap-2 p-3 text-left"
      >
        <span className="font-heading text-sm font-semibold text-primary">
          {col.subjectName ?? "Genel"}
        </span>
        <span className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {editable
              ? `${col.tasks.length} konu`
              : `${done}/${col.tasks.length}`}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          {col.tasks.length === 0 && !editable && (
            <p className="text-xs text-muted-foreground">Bu derste konu yok.</p>
          )}
          {col.tasks.map((t) => (
            <TopicCell
              key={t.id}
              task={t}
              editable={editable}
              doneOf={doneOf}
              toggle={toggle}
              setDialog={setDialog}
            />
          ))}
          {editable && (
            <Button
              variant="outline"
              size="sm"
              className="justify-center border-dashed"
              onClick={() =>
                setDialog({ mode: "add", subjectId: col.subjectId })
              }
            >
              <PlusIcon data-icon="inline-start" />
              Konu ekle
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Konu ekle / düzenle formu                                                 */
/* -------------------------------------------------------------------------- */

function TopicForm({
  enrollmentId,
  weekKey,
  subjects,
  resources,
  days,
  state,
  onDone,
}: {
  enrollmentId: number;
  weekKey: string;
  subjects: GridSubject[];
  resources: GridResource[];
  days: GridDay[];
  state: NonNullable<DialogState>;
  onDone: () => void;
}) {
  const router = useRouter();
  const editTask = state.mode === "edit" ? state.task : null;
  const initialSubject =
    state.mode === "add" ? state.subjectId : (editTask?.subjectId ?? null);

  const [saving, setSaving] = useState(false);
  const [subjectId, setSubjectId] = useState<number>(initialSubject ?? 0);
  const [description, setDescription] = useState(editTask?.description ?? "");
  const [target, setTarget] = useState(
    editTask?.targetQuestions != null ? String(editTask.targetQuestions) : "",
  );
  const [resourceIds, setResourceIds] = useState<number[]>(
    editTask?.resourceIds ?? [],
  );
  // 0 = güne atanmamış (haftalık konu).
  const [day, setDay] = useState<number>(editTask?.day ?? 0);

  const subjectItems = [
    { value: 0, label: "Genel (ders yok)" },
    ...subjects.map((s) => ({
      value: s.id,
      label: s.sectionName ? `${s.name} · ${s.sectionName}` : s.name,
    })),
  ];
  const dayItems = [
    { value: 0, label: "Bu hafta (gün yok)" },
    ...days.map((d) => ({ value: d.day, label: d.name })),
  ];

  const submit = async () => {
    if (description.trim() === "") {
      toast.error("Konu açıklaması gerekli.");
      return;
    }
    const shared = {
      subjectId: subjectId === 0 ? null : subjectId,
      resourceIds,
      description,
      targetQuestions: target === "" ? null : Math.min(2000, Number(target)),
      day: day === 0 ? null : day,
    };
    setSaving(true);
    const res = editTask
      ? await updatePlanTask({ taskId: editTask.id, ...shared })
      : await addPlanTask({ enrollmentId, weekStart: weekKey, ...shared });
    setSaving(false);
    if (res.ok) {
      toast.success(editTask ? "Konu güncellendi" : "Konu eklendi");
      onDone();
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="konu-aciklama">Konu / açıklama *</FieldLabel>
        <Textarea
          id="konu-aciklama"
          placeholder="Örn. Üslü Sayılar — konu tekrarı + 30 soru"
          value={description}
          maxLength={300}
          rows={2}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="konu-ders">Ders</FieldLabel>
          <Select
            items={subjectItems}
            value={subjectId}
            onValueChange={(v) => {
              if (typeof v === "number") setSubjectId(v);
            }}
          >
            <SelectTrigger id="konu-ders" className="w-full">
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
        <Field>
          <FieldLabel htmlFor="konu-gun">Gün (opsiyonel)</FieldLabel>
          <Select
            items={dayItems}
            value={day}
            onValueChange={(v) => {
              if (typeof v === "number") setDay(v);
            }}
          >
            <SelectTrigger id="konu-gun" className="w-full">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="konu-hedef">Hedef soru</FieldLabel>
          <Input
            id="konu-hedef"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Örn. 30"
            value={target}
            onChange={(e) =>
              setTarget(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
          />
        </Field>
      </div>

      <ResourcePicker
        idPrefix="konu-kaynak"
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
            ? "Konuyu kaydet"
            : "Konu ekle"}
      </Button>
    </div>
  );
}

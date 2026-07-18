"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { toast } from "sonner";

import { togglePlanTaskDone } from "@/actions/plans";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ChecklistTask = {
  id: number;
  description: string | null;
  subjectName: string | null;
  resourceName: string | null;
  targetQuestions: number | null;
  isDone: boolean;
};

export type ChecklistDay = {
  day: number;
  name: string;
  dateLabel: string;
  tasks: ChecklistTask[];
};

/** İyimser tamam/geri-al: yerel override + server action + refresh. */
function useTaskToggle() {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<number, boolean>>({});

  const doneOf = (t: ChecklistTask) => overrides[t.id] ?? t.isDone;

  const toggle = async (t: ChecklistTask) => {
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

function TaskRow({
  task,
  done,
  onToggle,
}: {
  task: ChecklistTask;
  done: boolean;
  onToggle: () => void;
}) {
  const meta = [
    task.subjectName,
    task.targetQuestions != null ? `${task.targetQuestions} soru` : null,
    task.resourceName,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className={cn(
        "flex min-h-13 w-full items-center gap-3 rounded-xl bg-card p-3 pl-3.5 text-left ring-1 ring-foreground/10 transition-colors active:bg-muted",
        done && "bg-success/5 ring-success/25",
      )}
    >
      {done ? (
        <CheckCircle2Icon className="size-5.5 shrink-0 text-success" />
      ) : (
        <CircleIcon className="size-5.5 shrink-0 text-muted-foreground/40" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            "text-sm font-medium break-words",
            done && "text-muted-foreground line-through",
          )}
        >
          {task.description || task.subjectName || "Görev"}
        </span>
        {meta && (
          <span className="text-xs text-muted-foreground">{meta}</span>
        )}
      </span>
    </button>
  );
}

/** Öğrenci — haftalık programın gün gün kontrol listesi + tamamlanma çubuğu. */
export function ProgramChecklist({
  days,
  todayDay,
}: {
  days: ChecklistDay[];
  todayDay: number | null;
}) {
  const { doneOf, toggle } = useTaskToggle();

  const all = days.flatMap((d) => d.tasks);
  const total = all.length;
  const done = all.filter(doneOf).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Tamamlanma */}
      <div className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium">Haftalık ilerleme</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatInt(done)}/{formatInt(total)} görev ·{" "}
            <span className="font-semibold text-foreground">%{pct}</span>
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Haftalık program ilerlemesi"
        >
          <div
            className="h-full rounded-full bg-success transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && total > 0 && (
          <p className="text-xs font-medium text-success">
            Haftanın tüm görevleri tamam — helal olsun! 🎉
          </p>
        )}
      </div>

      {/* Günler */}
      {days.map((d) => {
        const dayDone = d.tasks.filter(doneOf).length;
        const isToday = todayDay === d.day;
        return (
          <section key={d.day} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2
                className={cn(
                  "font-heading text-sm font-semibold",
                  isToday && "text-primary",
                )}
              >
                {d.name}
                {isToday && " · Bugün"}
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {d.dateLabel}
                {d.tasks.length > 0 && ` · ${dayDone}/${d.tasks.length}`}
              </span>
            </div>
            {d.tasks.length === 0 ? (
              <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                Bugün için görev yok — dinlenmek de programın parçası. 😌
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {d.tasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    done={doneOf(t)}
                    onToggle={() => toggle(t)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Öğrenci Bugün ekranı — günün görevleri, hızlı işaretleme + programa link. */
export function TodayPlanTasks({ tasks }: { tasks: ChecklistTask[] }) {
  const { doneOf, toggle } = useTaskToggle();
  const done = tasks.filter(doneOf).length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          Bugünün programı
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatInt(done)}/{formatInt(tasks.length)}
        </span>
      </div>
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          done={doneOf(t)}
          onToggle={() => toggle(t)}
        />
      ))}
      <Link
        href="/ogrenci/program"
        className="inline-flex items-center gap-1 self-end text-xs font-medium text-primary hover:underline"
      >
        Haftanın tamamını gör
        <ChevronRightIcon className="size-3.5" />
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleIcon,
  GraduationCapIcon,
} from "lucide-react";

import { setPlanTaskDone, usePlanTaskDone } from "@/lib/plan-task-done";
import { formatInt } from "@/lib/format";
import { formatLessonMinutes } from "@/lib/ozel-ders";
import { DAY_COLORS, type DayColorKey } from "@/lib/plan-layout";
import { cn } from "@/lib/utils";

export type ChecklistTask = {
  id: number;
  description: string | null;
  subjectName: string | null;
  /** Göreve bağlı kaynaklar — birden çok olabilir. */
  resourceNames: string[];
  targetQuestions: number | null;
  isDone: boolean;
};

/**
 * O güne düşen özel ders — salt render girdisi.
 *
 * `plan_tasks` satırı ÜRETİLMEZ: özel ders bir program görevi değil, verilen
 * bir hizmettir (bkz. `plan_day_layouts` kararı). Öğrenci işaretleyemez, sadece
 * görür.
 */
export type ChecklistLesson = {
  id: number;
  subjectName: string | null;
  durationMinutes: number;
  instructorName: string | null;
  status: "scheduled" | "held" | "cancelled" | "missed";
};

export type ChecklistDay = {
  day: number;
  name: string;
  dateLabel: string;
  tasks: ChecklistTask[];
  /** Koçun kurduğu ders düzeninden gelen gün rengi (yoksa varsayılan). */
  color?: DayColorKey;
  /** O güne planlanmış/işlenmiş özel dersler. */
  lessons?: ChecklistLesson[];
};

/**
 * İyimser tamam/geri-al — ızgarayla ORTAK depo (`@/lib/plan-task-done`).
 * Sayfa yenilenmez: yeni durum yerelde tutulur, action arkada kaydeder.
 */
function useTaskToggle() {
  const isDone = usePlanTaskDone();
  const doneOf = (t: ChecklistTask) => isDone(t.id, t.isDone);
  const toggle = (t: ChecklistTask) => void setPlanTaskDone(t.id, !doneOf(t));
  return { doneOf, toggle };
}

/**
 * Görevleri ders adına göre bitişik bloklara ayırır — aynı dersin görevleri
 * arka arkaya gelir ve ders adı bir kez yazılır. Gün içindeki sıra korunur:
 * bir ders ilk göründüğü yerde konumlanır (yeniden sıralama yok).
 */
type TaskGroup = { subjectName: string | null; tasks: ChecklistTask[] };

function groupBySubject(tasks: ChecklistTask[]): TaskGroup[] {
  const groups: TaskGroup[] = [];
  for (const task of tasks) {
    const name = task.subjectName ?? null;
    const existing = groups.find((g) => g.subjectName === name);
    if (existing) existing.tasks.push(task);
    else groups.push({ subjectName: name, tasks: [task] });
  }
  return groups;
}

function TaskRow({
  task,
  done,
  onToggle,
  /** Ders adı blok başlığında yazıldıysa satırda tekrarlanmaz. */
  hideSubject = false,
}: {
  task: ChecklistTask;
  done: boolean;
  onToggle: () => void;
  hideSubject?: boolean;
}) {
  const meta = [
    hideSubject ? null : task.subjectName,
    task.targetQuestions != null ? `${task.targetQuestions} soru` : null,
    // Kaynaklar kendi aralarında virgülle — meta ayracı "·" kalabalıklaşmasın.
    task.resourceNames.length > 0 ? task.resourceNames.join(", ") : null,
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

  // Bugün en üstte: öğrenci sayfayı açınca ilk "bugün ne var"ı görsün.
  const today = days.find((d) => d.day === todayDay);
  const orderedDays = today
    ? [today, ...days.filter((d) => d.day !== todayDay)]
    : days;

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

      {/* Günler — bugün varsa en üste alınır, listede tekrarlanmaz. */}
      {orderedDays.map((d) => (
        <DaySection
          key={d.day}
          day={d}
          isToday={todayDay === d.day}
          doneOf={doneOf}
          toggle={toggle}
        />
      ))}
    </div>
  );
}

/** Bir günün bölümü — yapışkan başlık + ders bazlı gruplanmış görevler. */
function DaySection({
  day,
  isToday,
  doneOf,
  toggle,
}: {
  day: ChecklistDay;
  isToday: boolean;
  doneOf: (t: ChecklistTask) => boolean;
  toggle: (t: ChecklistTask) => void;
}) {
  const dayDone = day.tasks.filter(doneOf).length;
  const groups = groupBySubject(day.tasks);
  // Tek ders varsa blok başlığı gereksiz — ders adı satır metasında kalır.
  const showSubjectHeaders =
    groups.length > 1 && groups.some((g) => g.subjectName);
  // Gün rengi koçun ders düzeninden gelir; günleri bir bakışta ayırır.
  const tone = day.color ? DAY_COLORS[day.color] : null;

  return (
    <section className="flex flex-col gap-2">
      <div
        className={cn(
          // Yapışkan: uzun günlerde hangi güne baktığın kaybolmasın.
          // Düz zemin: her gün başlığında backdrop-blur, kaydırırken düşük uçlu
          // Android'de kare kaçırtıyordu.
          "sticky top-0 z-10 -mx-1 flex items-baseline justify-between gap-2 bg-background px-1 py-1.5",
          isToday && "rounded-lg bg-primary/10",
        )}
      >
        <h2
          className={cn(
            "flex items-center gap-1.5 font-heading text-sm font-semibold",
            isToday && "text-primary",
          )}
        >
          {tone && (
            <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} />
          )}
          {day.name}
          {isToday && " · Bugün"}
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {day.dateLabel}
          {day.tasks.length > 0 && ` · ${dayDone}/${day.tasks.length}`}
        </span>
      </div>

      {(day.lessons ?? []).length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {day.lessons!.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-2 rounded-xl bg-gold/10 px-3 py-2 text-xs"
            >
              <GraduationCapIcon className="size-3.5 shrink-0 text-gold" />
              <span className="min-w-0 flex-1 truncate font-medium">
                Özel ders{l.subjectName ? ` · ${l.subjectName}` : ""}
                {l.instructorName ? ` · ${l.instructorName}` : ""}
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatLessonMinutes(l.durationMinutes)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {day.tasks.length === 0 ? (
        <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          {(day.lessons ?? []).length > 0
            ? "Bu gün için program görevi yok."
            : isToday
              ? "Bugün için görev yok — dinlenmek de programın parçası. 😌"
              : "Bu gün için görev yok."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group, gi) => (
            <div key={gi} className="flex flex-col gap-2">
              {showSubjectHeaders && group.subjectName && (
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {group.subjectName}
                </span>
              )}
              {group.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  done={doneOf(t)}
                  onToggle={() => toggle(t)}
                  hideSubject={showSubjectHeaders && group.subjectName !== null}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
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

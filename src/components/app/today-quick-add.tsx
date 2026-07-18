"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MinusIcon, PlusIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { upsertQuestionLogs } from "@/actions/tracking";
import { formatInt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuickAddSubject = {
  id: number;
  name: string;
  parentSubjectId: number | null;
  sectionName: string;
};

type Props = {
  enrollmentId: number;
  /** Bugünün trDayKey'i. */
  dayKey: string;
  subjects: QuickAddSubject[];
  /** subjectId → bugünkü soru sayısı. */
  initial: Record<number, number>;
};

/** Bugün ekranı — ders başına hızlı soru girişi, büyük dokunma alanları. */
export function TodayQuickAdd({ enrollmentId, dayKey, subjects, initial }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<number, string>>(() => {
    const out: Record<number, string> = {};
    for (const [id, v] of Object.entries(initial)) out[Number(id)] = String(v);
    return out;
  });

  const numOf = (id: number) => {
    const raw = values[id];
    if (raw === undefined) return initial[id] ?? 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const dirty = useMemo(
    () => subjects.some((s) => numOf(s.id) !== (initial[s.id] ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, subjects, initial],
  );

  const total = subjects.reduce((acc, s) => acc + numOf(s.id), 0);

  const bump = (id: number, delta: number) => {
    const next = Math.max(0, Math.min(2000, numOf(id) + delta));
    setValues((prev) => ({ ...prev, [id]: String(next) }));
  };

  const save = async () => {
    const entries = subjects
      .filter((s) => numOf(s.id) > 0 || initial[s.id] !== undefined)
      .map((s) => ({ subjectId: s.id, questionCount: numOf(s.id) }));
    if (entries.length === 0) return;
    setSaving(true);
    const res = await upsertQuestionLogs({
      enrollmentId,
      logDate: dayKey,
      entries,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Bugünkü sorular kaydedildi 🔥");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {subjects.map((subject, index) => {
        const sectionHeader =
          index === 0 || subjects[index - 1].sectionName !== subject.sectionName
            ? subject.sectionName
            : null;
        const isChild = subject.parentSubjectId != null;
        return (
          <div key={subject.id} className="flex flex-col gap-2">
            {sectionHeader && (
              <span className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:mt-0">
                {sectionHeader}
              </span>
            )}
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl bg-card p-2 pl-3.5 ring-1 ring-foreground/10",
                isChild && "ml-4",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium",
                  isChild && "text-muted-foreground font-normal",
                )}
              >
                {subject.name}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label={`${subject.name} 5 azalt`}
                className="size-10 shrink-0"
                onClick={() => bump(subject.id, -5)}
              >
                <MinusIcon />
              </Button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label={`${subject.name} soru sayısı`}
                value={values[subject.id] ?? (initial[subject.id] !== undefined ? String(initial[subject.id]) : "")}
                placeholder="0"
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [subject.id]: e.target.value.replace(/\D/g, "").slice(0, 4),
                  }))
                }
                className="h-10 w-14 shrink-0 rounded-lg border border-input bg-transparent text-center text-base font-medium tabular-nums outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
              <Button
                variant="outline"
                size="icon"
                aria-label={`${subject.name} 5 artır`}
                className="size-10 shrink-0"
                onClick={() => bump(subject.id, 5)}
              >
                <PlusIcon />
              </Button>
            </div>
          </div>
        );
      })}

      <div className="sticky bottom-16 mt-2 flex items-center justify-between gap-3 rounded-xl bg-background/95 p-2 backdrop-blur">
        <span className="pl-2 text-sm text-muted-foreground">
          Bugün toplam{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatInt(total)}
          </span>{" "}
          soru
        </span>
        <Button size="lg" onClick={save} disabled={saving || !dirty} className="h-11">
          <SaveIcon data-icon="inline-start" />
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}

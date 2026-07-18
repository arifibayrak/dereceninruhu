"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { upsertQuestionLogs } from "@/actions/tracking";
import { DAY_NAMES_TR_SHORT } from "@/lib/dates";
import { formatInt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GridSubject = {
  id: number;
  name: string;
  parentSubjectId: number | null;
};

export type GridSection = {
  id: number;
  name: string;
  subjects: GridSubject[];
};

type Props = {
  enrollmentId: number;
  /** Pazartesi→Pazar, trDayKey (yyyy-mm-dd). */
  dayKeys: string[];
  /** Bugünün trDayKey'i — bu haftadaysa sütun vurgulanır. */
  todayKey?: string | null;
  sections: GridSection[];
  /** `${dayKey}:${subjectId}` → soru sayısı. */
  initial: Record<string, number>;
};

const keyOf = (dayKey: string, subjectId: number) => `${dayKey}:${subjectId}`;

/**
 * Haftalık soru takibi ızgarası — günler × dersler, hücre bazlı upsert.
 * Hem öğrenci hem koç aynı bileşeni kullanır (yetki aksiyon katmanında).
 */
export function WeekGridForm({
  enrollmentId,
  dayKeys,
  todayKey,
  sections,
  initial,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(initial)) out[k] = String(v);
    return out;
  });

  const allSubjects = useMemo(
    () => sections.flatMap((s) => s.subjects),
    [sections],
  );

  const numAt = (dayKey: string, subjectId: number) => {
    const k = keyOf(dayKey, subjectId);
    const raw = values[k];
    if (raw === undefined) return initial[k] ?? 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const dirtyDays = useMemo(() => {
    const days: string[] = [];
    for (const dayKey of dayKeys) {
      const dirty = allSubjects.some(
        (s) => numAt(dayKey, s.id) !== (initial[keyOf(dayKey, s.id)] ?? 0),
      );
      if (dirty) days.push(dayKey);
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, dayKeys, allSubjects, initial]);

  const setCell = (dayKey: string, subjectId: number, raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, 4);
    setValues((prev) => ({ ...prev, [keyOf(dayKey, subjectId)]: clean }));
  };

  const save = async () => {
    if (dirtyDays.length === 0) return;
    setSaving(true);
    let failed = 0;
    for (const dayKey of dirtyDays) {
      const entries = allSubjects
        .filter(
          (s) =>
            numAt(dayKey, s.id) > 0 ||
            keyOf(dayKey, s.id) in initial,
        )
        .map((s) => ({ subjectId: s.id, questionCount: numAt(dayKey, s.id) }));
      if (entries.length === 0) continue;
      const res = await upsertQuestionLogs({
        enrollmentId,
        logDate: dayKey,
        entries,
      });
      if (!res.ok) failed++;
    }
    setSaving(false);
    if (failed > 0) {
      toast.error("Bazı günler kaydedilemedi, tekrar dene.");
    } else {
      toast.success("Soru girişleri kaydedildi 💪");
    }
    router.refresh();
  };

  const dayTotal = (dayKey: string) =>
    allSubjects.reduce((acc, s) => acc + numAt(dayKey, s.id), 0);
  const subjectTotal = (subjectId: number) =>
    dayKeys.reduce((acc, d) => acc + numAt(d, subjectId), 0);
  const weekTotal = dayKeys.reduce((acc, d) => acc + dayTotal(d), 0);

  const showSectionHeaders = sections.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
                Ders
              </th>
              {dayKeys.map((dayKey, i) => (
                <th
                  key={dayKey}
                  className={cn(
                    "px-1 py-2 text-center font-medium",
                    dayKey === todayKey && "text-primary",
                  )}
                >
                  <div className="flex flex-col leading-tight">
                    <span>{DAY_NAMES_TR_SHORT[i]}</span>
                    <span className="text-[10px] font-normal text-muted-foreground tabular-nums">
                      {parseInt(dayKey.slice(8), 10)}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-2 py-2 text-right font-medium">Toplam</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <SectionRows
                key={section.id}
                section={section}
                showHeader={showSectionHeaders}
                dayKeys={dayKeys}
                todayKey={todayKey}
                values={values}
                initial={initial}
                setCell={setCell}
                subjectTotal={subjectTotal}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/40 font-medium">
              <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2 backdrop-blur">
                Günlük toplam
              </td>
              {dayKeys.map((dayKey) => (
                <td
                  key={dayKey}
                  className={cn(
                    "px-1 py-2 text-center tabular-nums",
                    dayKey === todayKey && "text-primary",
                  )}
                >
                  {dayTotal(dayKey) > 0 ? formatInt(dayTotal(dayKey)) : "–"}
                </td>
              ))}
              <td className="px-2 py-2 text-right tabular-nums">
                {formatInt(weekTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {dirtyDays.length > 0
            ? `${dirtyDays.length} günde kaydedilmemiş değişiklik var`
            : "Tüm değişiklikler kayıtlı"}
        </span>
        <Button
          onClick={save}
          disabled={saving || dirtyDays.length === 0}
          size="lg"
        >
          <SaveIcon data-icon="inline-start" />
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}

function SectionRows({
  section,
  showHeader,
  dayKeys,
  todayKey,
  values,
  initial,
  setCell,
  subjectTotal,
}: {
  section: GridSection;
  showHeader: boolean;
  dayKeys: string[];
  todayKey?: string | null;
  values: Record<string, string>;
  initial: Record<string, number>;
  setCell: (dayKey: string, subjectId: number, raw: string) => void;
  subjectTotal: (subjectId: number) => number;
}) {
  return (
    <>
      {showHeader && (
        <tr className="border-b bg-muted/30">
          <td
            colSpan={dayKeys.length + 2}
            className="px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {section.name}
          </td>
        </tr>
      )}
      {section.subjects.map((subject) => {
        const isChild = subject.parentSubjectId != null;
        return (
          <tr key={subject.id} className="border-b last:border-0">
            <td
              className={cn(
                "sticky left-0 z-10 bg-card px-3 py-1.5 font-medium whitespace-nowrap",
                isChild && "pl-6 text-muted-foreground font-normal",
              )}
            >
              {subject.name}
            </td>
            {dayKeys.map((dayKey) => {
              const k = `${dayKey}:${subject.id}`;
              const raw =
                values[k] ?? (initial[k] !== undefined ? String(initial[k]) : "");
              return (
                <td
                  key={dayKey}
                  className={cn(
                    "px-0.5 py-1 text-center",
                    dayKey === todayKey && "bg-primary/5",
                  )}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-label={`${subject.name} — ${dayKey}`}
                    value={raw}
                    placeholder="·"
                    onChange={(e) => setCell(dayKey, subject.id, e.target.value)}
                    className="h-9 w-12 rounded-md border border-transparent bg-transparent text-center text-sm tabular-nums transition-colors outline-none placeholder:text-muted-foreground/40 hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  />
                </td>
              );
            })}
            <td className="px-2 py-1.5 text-right text-muted-foreground tabular-nums">
              {subjectTotal(subject.id) > 0
                ? formatInt(subjectTotal(subject.id))
                : "–"}
            </td>
          </tr>
        );
      })}
    </>
  );
}

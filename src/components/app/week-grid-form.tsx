"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { upsertQuestionLogs } from "@/actions/tracking";
import { DAY_NAMES_TR, DAY_NAMES_TR_SHORT } from "@/lib/dates";
import { formatInt, formatNet } from "@/lib/format";
import {
  accuracyPct,
  breakdownState,
  entryNet,
  MAX_QUESTIONS_PER_CELL,
} from "@/lib/question-log";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  /** Net böleni — LGS 3, YKS/KPSS 4 (exam_sections.wrong_penalty_divisor). */
  wrongPenaltyDivisor: number;
};

/** Bir hücrenin sunucudan gelen hâli. */
export type GridCell = {
  total: number;
  correct: number | null;
  wrong: number | null;
  blank: number | null;
};

type Props = {
  enrollmentId: number;
  /** Pazartesi→Pazar, trDayKey (yyyy-mm-dd). */
  dayKeys: string[];
  /** Bugünün trDayKey'i — bu haftadaysa sütun vurgulanır. */
  todayKey?: string | null;
  sections: GridSection[];
  /** `${dayKey}:${subjectId}` → hücre. */
  initial: Record<string, GridCell>;
};

/** Düzenleme sırasındaki hücre — hepsi string (boş = girilmemiş). */
type Draft = { total: string; correct: string; wrong: string; blank: string };

const keyOf = (dayKey: string, subjectId: number) => `${dayKey}:${subjectId}`;

const EMPTY_DRAFT: Draft = { total: "", correct: "", wrong: "", blank: "" };

const numOrNull = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

function draftOf(cell: GridCell | undefined): Draft {
  if (!cell) return EMPTY_DRAFT;
  return {
    total: String(cell.total),
    correct: cell.correct != null ? String(cell.correct) : "",
    wrong: cell.wrong != null ? String(cell.wrong) : "",
    blank: cell.blank != null ? String(cell.blank) : "",
  };
}

/** Bir taslağın efektif toplamı — D/Y/B doluysa ondan türetilir. */
function draftTotal(d: Draft): number {
  const c = numOrNull(d.correct);
  const w = numOrNull(d.wrong);
  const b = numOrNull(d.blank);
  if (c !== null && w !== null && b !== null) return c + w + b;
  return numOrNull(d.total) ?? 0;
}

function sameDraft(a: Draft, b: Draft): boolean {
  return (
    draftTotal(a) === draftTotal(b) &&
    a.correct === b.correct &&
    a.wrong === b.wrong &&
    a.blank === b.blank
  );
}

/**
 * Haftalık soru takibi ızgarası — günler × dersler, gün bazlı upsert.
 * Hem öğrenci hem koç aynı bileşeni kullanır (yetki aksiyon katmanında).
 *
 * Hücreye dokunmak doğru/yanlış/boş panelini açar; kırılım girilirse toplam
 * otomatik hesaplanır ve net önizlenir. Kırılım opsiyoneldir — sadece toplam
 * yazmak da geçerlidir (bkz. `@/lib/question-log`).
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
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const out: Record<string, Draft> = {};
    for (const [k, cell] of Object.entries(initial)) out[k] = draftOf(cell);
    return out;
  });
  /** Açık panelin hedefi. */
  const [editing, setEditing] = useState<{
    dayKey: string;
    subject: GridSubject;
    divisor: number;
  } | null>(null);

  const allSubjects = useMemo(
    () => sections.flatMap((s) => s.subjects),
    [sections],
  );
  const divisorOf = useMemo(() => {
    const map = new Map<number, number>();
    for (const s of sections) {
      for (const sub of s.subjects) map.set(sub.id, s.wrongPenaltyDivisor);
    }
    return map;
  }, [sections]);

  const at = (dayKey: string, subjectId: number): Draft =>
    drafts[keyOf(dayKey, subjectId)] ?? draftOf(initial[keyOf(dayKey, subjectId)]);

  const totalAt = (dayKey: string, subjectId: number) =>
    draftTotal(at(dayKey, subjectId));

  const dirtyDays = useMemo(() => {
    const days: string[] = [];
    for (const dayKey of dayKeys) {
      const dirty = allSubjects.some((s) => {
        const k = keyOf(dayKey, s.id);
        return !sameDraft(
          drafts[k] ?? draftOf(initial[k]),
          draftOf(initial[k]),
        );
      });
      if (dirty) days.push(dayKey);
    }
    return days;
  }, [drafts, dayKeys, allSubjects, initial]);

  const setDraft = (dayKey: string, subjectId: number, next: Draft) => {
    setDrafts((prev) => ({ ...prev, [keyOf(dayKey, subjectId)]: next }));
  };

  const save = async () => {
    if (dirtyDays.length === 0) return;
    setSaving(true);
    let failed = 0;
    for (const dayKey of dirtyDays) {
      const entries = allSubjects
        .filter((s) => {
          const k = keyOf(dayKey, s.id);
          // Değeri olan ya da daha önce kaydedilmiş (silinebilir) hücreler.
          return totalAt(dayKey, s.id) > 0 || k in initial;
        })
        .map((s) => {
          const d = at(dayKey, s.id);
          const hasBreakdown = breakdownState({
            correctCount: numOrNull(d.correct),
            wrongCount: numOrNull(d.wrong),
            blankCount: numOrNull(d.blank),
          }) === "full";
          return {
            subjectId: s.id,
            questionCount: draftTotal(d),
            correctCount: hasBreakdown ? numOrNull(d.correct) : null,
            wrongCount: hasBreakdown ? numOrNull(d.wrong) : null,
            blankCount: hasBreakdown ? numOrNull(d.blank) : null,
          };
        });
      if (entries.length === 0) continue;
      const res = await callAction(upsertQuestionLogs, {
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
    allSubjects.reduce((acc, s) => acc + totalAt(dayKey, s.id), 0);
  const subjectTotal = (subjectId: number) =>
    dayKeys.reduce((acc, d) => acc + totalAt(d, subjectId), 0);
  const weekTotal = dayKeys.reduce((acc, d) => acc + dayTotal(d), 0);

  const showSectionHeaders = sections.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Hücreye dokun → doğru / yanlış / boş gir. İstersen sadece toplamı da
        yazabilirsin.
      </p>

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
                at={at}
                onOpen={(dayKey, subject) =>
                  setEditing({
                    dayKey,
                    subject,
                    divisor:
                      divisorOf.get(subject.id) ?? section.wrongPenaltyDivisor,
                  })
                }
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

      {editing && (
        <CellSheet
          dayKey={editing.dayKey}
          dayIndex={dayKeys.indexOf(editing.dayKey)}
          subject={editing.subject}
          divisor={editing.divisor}
          draft={at(editing.dayKey, editing.subject.id)}
          onChange={(next) =>
            setDraft(editing.dayKey, editing.subject.id, next)
          }
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function SectionRows({
  section,
  showHeader,
  dayKeys,
  todayKey,
  at,
  onOpen,
  subjectTotal,
}: {
  section: GridSection;
  showHeader: boolean;
  dayKeys: string[];
  todayKey?: string | null;
  at: (dayKey: string, subjectId: number) => Draft;
  onOpen: (dayKey: string, subject: GridSubject) => void;
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
              const d = at(dayKey, subject.id);
              const total = draftTotal(d);
              const hasBreakdown =
                d.correct !== "" && d.wrong !== "" && d.blank !== "";
              return (
                <td
                  key={dayKey}
                  className={cn(
                    "px-0.5 py-1 text-center",
                    dayKey === todayKey && "bg-primary/5",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(dayKey, subject)}
                    aria-label={`${subject.name} — ${dayKey} · ${
                      total > 0 ? `${total} soru` : "giriş yok"
                    }`}
                    className="relative inline-flex h-9 w-12 items-center justify-center rounded-md border border-transparent text-sm tabular-nums transition-colors hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {total > 0 ? (
                      total
                    ) : (
                      <span className="text-muted-foreground/40">·</span>
                    )}
                    {/* Kırılım girilmiş hücreyi ayırt eden sessiz işaret. */}
                    {hasBreakdown && (
                      <span
                        aria-hidden
                        className="absolute bottom-1 h-0.5 w-4 rounded-full bg-primary/60"
                      />
                    )}
                  </button>
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

/** Tek hücrenin düzenleme paneli — toplam + opsiyonel D/Y/B + net önizleme. */
function CellSheet({
  dayKey,
  dayIndex,
  subject,
  divisor,
  draft,
  onChange,
  onClose,
}: {
  dayKey: string;
  dayIndex: number;
  subject: GridSubject;
  divisor: number;
  draft: Draft;
  onChange: (next: Draft) => void;
  onClose: () => void;
}) {
  const clean = (raw: string) => raw.replace(/\D/g, "").slice(0, 4);
  const c = numOrNull(draft.correct);
  const w = numOrNull(draft.wrong);
  const b = numOrNull(draft.blank);
  const state = breakdownState({
    correctCount: c,
    wrongCount: w,
    blankCount: b,
  });
  const total = draftTotal(draft);
  const net =
    state === "full" ? entryNet({ correctCount: c, wrongCount: w }, divisor) : null;
  const acc = state === "full" ? accuracyPct(c ?? 0, w ?? 0) : null;
  const overLimit = total > MAX_QUESTIONS_PER_CELL;

  const dayLabel = DAY_NAMES_TR[dayIndex] ?? dayKey;
  const dayNum = parseInt(dayKey.slice(8), 10);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {subject.name} · {dayLabel} {dayNum}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["correct", "Doğru", "text-success"],
                ["wrong", "Yanlış", "text-destructive"],
                ["blank", "Boş", "text-muted-foreground"],
              ] as const
            ).map(([field, label, tone]) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className={cn("text-xs font-medium", tone)}>{label}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus={field === "correct"}
                  value={draft[field]}
                  placeholder="—"
                  onChange={(e) =>
                    onChange({ ...draft, [field]: clean(e.target.value) })
                  }
                  className="h-12 w-full rounded-lg border border-input bg-transparent text-center text-lg font-medium tabular-nums outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            ))}
          </div>

          {state === "full" ? (
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                Toplam{" "}
                <strong className="text-base text-foreground tabular-nums">
                  {formatInt(total)}
                </strong>
              </span>
              {net !== null && (
                <span className="text-sm text-muted-foreground">
                  Net{" "}
                  <strong className="text-base text-primary tabular-nums">
                    {formatNet(net)}
                  </strong>
                </span>
              )}
              {acc !== null && (
                <span className="text-sm text-muted-foreground">
                  Doğruluk{" "}
                  <strong className="text-base text-foreground tabular-nums">
                    %{acc}
                  </strong>
                </span>
              )}
            </div>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {state === "partial"
                  ? "Üçünü de doldur ya da üçünü de boş bırak"
                  : "Ya da sadece toplam soru sayısı"}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={draft.total}
                placeholder="0"
                disabled={state === "partial"}
                onChange={(e) =>
                  onChange({ ...draft, total: clean(e.target.value) })
                }
                className="h-12 w-full rounded-lg border border-input bg-transparent px-4 text-lg font-medium tabular-nums outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
              />
            </label>
          )}

          {overLimit && (
            <p className="text-sm text-destructive">
              Toplam en fazla {formatInt(MAX_QUESTIONS_PER_CELL)} olabilir.
            </p>
          )}
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onChange({ ...EMPTY_DRAFT });
              onClose();
            }}
          >
            Temizle
          </Button>
          <Button
            className="flex-1"
            disabled={state === "partial" || overLimit}
            onClick={onClose}
          >
            Tamam
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

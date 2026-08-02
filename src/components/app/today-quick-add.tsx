"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, MinusIcon, PlusIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { upsertQuestionLogs } from "@/actions/tracking";
import { formatInt, formatNet } from "@/lib/format";
import {
  accuracyPct,
  breakdownState,
  entryNet,
  MAX_QUESTIONS_PER_CELL,
} from "@/lib/question-log";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuickAddSubject = {
  id: number;
  name: string;
  parentSubjectId: number | null;
  sectionName: string;
  /** Net böleni — LGS 3, YKS/KPSS 4. */
  wrongPenaltyDivisor: number;
};

/** Bugünkü kayıt — toplam + (varsa) doğru/yanlış/boş. */
export type QuickAddCell = {
  total: number;
  correct: number | null;
  wrong: number | null;
  blank: number | null;
};

type Props = {
  enrollmentId: number;
  /** Bugünün trDayKey'i. */
  dayKey: string;
  subjects: QuickAddSubject[];
  /** subjectId → bugünkü kayıt. */
  initial: Record<number, QuickAddCell>;
};

type Draft = { total: string; correct: string; wrong: string; blank: string };

const EMPTY_DRAFT: Draft = { total: "", correct: "", wrong: "", blank: "" };

const numOrNull = (raw: string): number | null => {
  if (raw.trim() === "") return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

function draftOf(cell: QuickAddCell | undefined): Draft {
  if (!cell) return EMPTY_DRAFT;
  return {
    total: String(cell.total),
    correct: cell.correct != null ? String(cell.correct) : "",
    wrong: cell.wrong != null ? String(cell.wrong) : "",
    blank: cell.blank != null ? String(cell.blank) : "",
  };
}

/** D/Y/B doluysa toplam ondan türetilir; değilse elle yazılan toplam. */
function draftTotal(d: Draft): number {
  const c = numOrNull(d.correct);
  const w = numOrNull(d.wrong);
  const b = numOrNull(d.blank);
  if (c !== null && w !== null && b !== null) return c + w + b;
  return numOrNull(d.total) ?? 0;
}

const hasBreakdown = (d: Draft) =>
  breakdownState({
    correctCount: numOrNull(d.correct),
    wrongCount: numOrNull(d.wrong),
    blankCount: numOrNull(d.blank),
  }) === "full";

/**
 * Bugün ekranı — ders başına hızlı soru girişi, büyük dokunma alanları.
 *
 * Varsayılan yol tek sayı (toplam) girmektir; "D/Y/B" düğmesi satırı açıp
 * doğru/yanlış/boş alanlarını gösterir ve toplamı otomatik hesaplar.
 */
export function TodayQuickAdd({
  enrollmentId,
  dayKey,
  subjects,
  initial,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, Draft>>(() => {
    const out: Record<number, Draft> = {};
    for (const [id, cell] of Object.entries(initial)) {
      out[Number(id)] = draftOf(cell);
    }
    return out;
  });
  /** Açık kırılım satırları — kayıtta zaten kırılım varsa açık başlar. */
  const [expanded, setExpanded] = useState<Set<number>>(
    () =>
      new Set(
        Object.entries(initial)
          .filter(([, c]) => c.correct != null)
          .map(([id]) => Number(id)),
      ),
  );

  const at = (id: number): Draft => drafts[id] ?? draftOf(initial[id]);
  const totalOf = (id: number) => draftTotal(at(id));

  const dirty = useMemo(
    () =>
      subjects.some((s) => {
        const a = at(s.id);
        const b = draftOf(initial[s.id]);
        return (
          draftTotal(a) !== draftTotal(b) ||
          a.correct !== b.correct ||
          a.wrong !== b.wrong ||
          a.blank !== b.blank
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drafts, subjects, initial],
  );

  const total = subjects.reduce((acc, s) => acc + totalOf(s.id), 0);
  const invalid = subjects.some((s) => {
    const d = at(s.id);
    const state = breakdownState({
      correctCount: numOrNull(d.correct),
      wrongCount: numOrNull(d.wrong),
      blankCount: numOrNull(d.blank),
    });
    return state === "partial" || draftTotal(d) > MAX_QUESTIONS_PER_CELL;
  });

  const setDraft = (id: number, next: Draft) =>
    setDrafts((prev) => ({ ...prev, [id]: next }));

  const bump = (id: number, delta: number) => {
    const d = at(id);
    // Kırılım açıkken toplam türetilir; +/- doğru sayısını artırır.
    if (hasBreakdown(d)) {
      const next = Math.max(
        0,
        Math.min(MAX_QUESTIONS_PER_CELL, (numOrNull(d.correct) ?? 0) + delta),
      );
      setDraft(id, { ...d, correct: String(next) });
      return;
    }
    const next = Math.max(
      0,
      Math.min(MAX_QUESTIONS_PER_CELL, draftTotal(d) + delta),
    );
    setDraft(id, { ...d, total: String(next) });
  };

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    const entries = subjects
      .filter((s) => totalOf(s.id) > 0 || initial[s.id] !== undefined)
      .map((s) => {
        const d = at(s.id);
        const full = hasBreakdown(d);
        return {
          subjectId: s.id,
          questionCount: draftTotal(d),
          correctCount: full ? numOrNull(d.correct) : null,
          wrongCount: full ? numOrNull(d.wrong) : null,
          blankCount: full ? numOrNull(d.blank) : null,
        };
      });
    if (entries.length === 0) return;
    setSaving(true);
    const res = await callAction(upsertQuestionLogs, {
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
        const d = at(subject.id);
        const open = expanded.has(subject.id);
        const full = hasBreakdown(d);
        const net = full
          ? entryNet(
              {
                correctCount: numOrNull(d.correct),
                wrongCount: numOrNull(d.wrong),
              },
              subject.wrongPenaltyDivisor,
            )
          : null;
        const acc = full
          ? accuracyPct(numOrNull(d.correct) ?? 0, numOrNull(d.wrong) ?? 0)
          : null;

        return (
          <div key={subject.id} className="flex flex-col gap-2">
            {sectionHeader && (
              <span className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase first:mt-0">
                {sectionHeader}
              </span>
            )}
            <div
              className={cn(
                "flex flex-col gap-2 rounded-xl bg-card p-2 pl-3.5 ring-1 ring-foreground/10",
                isChild && "ml-4",
              )}
            >
              <div className="flex items-center gap-2">
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
                  value={full ? String(draftTotal(d)) : d.total}
                  readOnly={full}
                  placeholder="0"
                  onChange={(e) =>
                    setDraft(subject.id, {
                      ...d,
                      total: e.target.value.replace(/\D/g, "").slice(0, 4),
                    })
                  }
                  className={cn(
                    "h-10 w-14 shrink-0 rounded-lg border border-input bg-transparent text-center text-base font-medium tabular-nums outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
                    full && "border-dashed text-muted-foreground",
                  )}
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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${subject.name} doğru/yanlış/boş ${open ? "gizle" : "gir"}`}
                  aria-expanded={open}
                  className="size-10 shrink-0"
                  onClick={() => toggleExpand(subject.id)}
                >
                  <ChevronDownIcon
                    className={cn("transition-transform", open && "rotate-180")}
                  />
                </Button>
              </div>

              {open && (
                <div className="flex flex-col gap-2 border-t pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        ["correct", "Doğru", "text-success"],
                        ["wrong", "Yanlış", "text-destructive"],
                        ["blank", "Boş", "text-muted-foreground"],
                      ] as const
                    ).map(([field, label, tone]) => (
                      <label key={field} className="flex flex-col gap-1">
                        <span className={cn("text-[11px] font-medium", tone)}>
                          {label}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          aria-label={`${subject.name} ${label}`}
                          value={d[field]}
                          placeholder="—"
                          onChange={(e) =>
                            setDraft(subject.id, {
                              ...d,
                              [field]: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 4),
                            })
                          }
                          className="h-10 w-full rounded-lg border border-input bg-transparent text-center text-base font-medium tabular-nums outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {full ? (
                      <>
                        Net{" "}
                        <strong className="text-primary tabular-nums">
                          {net !== null ? formatNet(net) : "—"}
                        </strong>
                        {acc !== null && (
                          <>
                            {" · "}Doğruluk{" "}
                            <strong className="text-foreground tabular-nums">
                              %{acc}
                            </strong>
                          </>
                        )}
                      </>
                    ) : (
                      "Üçünü de doldurunca toplam ve net otomatik hesaplanır."
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* `bottom-16` çentikli telefonlarda yetmiyordu: nav `env(safe-area-inset-bottom)`
          kadar daha uzun, çubuk altında kalıyordu (bkz. topic-error-form). */}
      <div className="sticky bottom-[calc(var(--app-bottom-nav,0px)+1rem)] mt-2 flex items-center justify-between gap-3 rounded-xl bg-background/95 p-2 backdrop-blur">
        <span className="pl-2 text-sm text-muted-foreground">
          Bugün toplam{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatInt(total)}
          </span>{" "}
          soru
        </span>
        <Button
          size="lg"
          onClick={save}
          disabled={saving || !dirty || invalid}
          className="h-11"
        >
          <SaveIcon data-icon="inline-start" />
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { callAction } from "@/lib/action-client";
import { logResourceQuestions } from "@/actions/konular";
import { formatInt } from "@/lib/format";

export type ResourceQuestionItem = {
  id: number;
  name: string;
  subjectName: string | null;
  /** Bugün bu kaynaktan çözülen soru (başlangıç). */
  today: number;
  /** Tüm zamanlar toplamı (bilgi amaçlı). */
  total: number;
};

/**
 * Kaynak başına "bugün kaç soru" — mutlak değer girilir, blur'da kaydedilir
 * (logResourceQuestions upsert). Konu takibinden ayrı per-kaynak sayaç.
 */
export function ResourceQuestionLogger({
  enrollmentId,
  dayKey,
  resources,
}: {
  enrollmentId: number;
  dayKey: string;
  resources: ResourceQuestionItem[];
}) {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<number, number>>(() =>
    Object.fromEntries(resources.map((r) => [r.id, r.today])),
  );
  const [pending, startTransition] = useTransition();

  if (resources.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Önce kaynak ekle; sonra her kaynaktan bugün kaç soru çözdüğünü buradan
        girebilirsin.
      </div>
    );
  }

  const save = (resourceId: number, raw: number) => {
    const value = Math.max(0, Math.min(5000, Math.round(raw) || 0));
    setCounts((c) => ({ ...c, [resourceId]: value }));
    startTransition(async () => {
      const res = await callAction(logResourceQuestions, {
        enrollmentId,
        resourceId,
        logDate: dayKey,
        questionCount: value,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <ul className="flex flex-col divide-y rounded-xl bg-card ring-1 ring-foreground/10">
      {resources.map((r) => {
        const val = counts[r.id] ?? 0;
        return (
          <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{r.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {r.subjectName ?? "Genel"} · toplam {formatInt(r.total)} soru
              </span>
            </div>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={5000}
              aria-label={`${r.name} — bugün çözülen soru`}
              disabled={pending}
              value={val === 0 ? "" : val}
              placeholder="0"
              onChange={(e) =>
                setCounts((c) => ({
                  ...c,
                  [r.id]: Math.max(0, Math.round(Number(e.target.value) || 0)),
                }))
              }
              onBlur={(e) => save(r.id, Number(e.target.value))}
              className="h-10 w-16 shrink-0 rounded-lg border border-input bg-transparent text-center text-sm font-semibold tabular-nums"
            />
          </li>
        );
      })}
    </ul>
  );
}

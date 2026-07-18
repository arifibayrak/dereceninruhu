"use client";

import { useEffect, useMemo, useState } from "react";

import { DAY_NAMES_TR, daysBetween, formatTrDate, trWeekday } from "@/lib/dates";
import { EXAM_COUNTDOWNS, examTargetDate } from "@/lib/exam-dates";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Sınav aileleri — üstten alta gösterim sırası. */
const GROUP_ORDER = ["KPSS", "LGS", "YKS"] as const;

const GROUP_LABEL: Record<(typeof GROUP_ORDER)[number], string> = {
  KPSS: "KPSS",
  LGS: "LGS",
  YKS: "YKS",
};

/**
 * Sınav geri sayımı — LGS, YKS ve KPSS (3 kademe) için kalan GÜN sayısı,
 * sınav ailesine göre gruplanmış yapılandırılmış liste. "X gün kaldı" takvim
 * günü olarak sayılır (TRT gece yarısından gece yarısına); gece yarısı azalır.
 *
 * Saat okuma yalnız zamanlayıcı geri çağrısında (render saf); ilk render'da
 * `now = null` yer tutucu, mount sonrası tazelenir.
 */
export function ExamCountdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const id = setInterval(update, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const groups = useMemo(() => {
    const withTarget = EXAM_COUNTDOWNS.map((e) => ({
      ...e,
      target: examTargetDate(e.date),
    }));
    return GROUP_ORDER.map((code) => ({
      code,
      label: GROUP_LABEL[code],
      items: withTarget
        .filter((e) => e.exam === code)
        .sort((a, b) => a.target.getTime() - b.target.getTime()),
    })).filter((g) => g.items.length > 0);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {groups.map((group) => (
        <div key={group.code} className="flex flex-col gap-2">
          <span className="px-1 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {group.label}
          </span>
          <ul className="divide-y divide-foreground/10 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            {group.items.map((item) => {
              const days =
                now === null ? null : daysBetween(new Date(now), item.target);
              const weekday = DAY_NAMES_TR[trWeekday(item.target) - 1];

              return (
                <li
                  key={item.key}
                  className="flex items-center gap-3 px-4 py-4 sm:px-5"
                >
                  <span
                    aria-hidden
                    className={cn("size-2.5 shrink-0 rounded-full", item.dotClass)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-heading text-sm font-semibold sm:text-base">
                        {item.title}
                      </span>
                      {item.estimated && (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px]"
                        >
                          Tahmini
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTrDate(item.target)} · {weekday}
                      {item.note ? ` · ${item.note}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-1 tabular-nums">
                    {days === null ? (
                      <span
                        className={cn(
                          "font-heading text-2xl font-bold sm:text-3xl",
                          item.numberClass,
                        )}
                      >
                        —
                      </span>
                    ) : days > 0 ? (
                      <>
                        <span
                          className={cn(
                            "font-heading text-2xl font-bold sm:text-3xl",
                            item.numberClass,
                          )}
                        >
                          {days}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          gün
                        </span>
                      </>
                    ) : days === 0 ? (
                      <span
                        className={cn(
                          "font-heading text-base font-bold",
                          item.numberClass,
                        )}
                      >
                        Bugün!
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        Geçti
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

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

/** Bir zaman segmenti (gün/saat/dakika/saniye) — sayı üstte, etiket altta. */
function TimeSeg({
  value,
  label,
  className,
  pad = false,
  lead = false,
}: {
  value: number;
  label: string;
  className?: string;
  /** Saat/dakika/saniye 2 haneye tamamlanır (09, 05…). */
  pad?: boolean;
  /** Öne çıkan segment (gün) daha büyük. */
  lead?: boolean;
}) {
  return (
    <span className="flex flex-col items-center leading-none">
      <span
        className={cn(
          "font-heading font-bold tabular-nums",
          lead ? "text-2xl sm:text-3xl" : "text-lg sm:text-2xl",
          className,
        )}
      >
        {pad ? String(value).padStart(2, "0") : value}
      </span>
      <span className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

/**
 * Sınav geri sayımı — LGS, YKS ve KPSS (3 kademe) için kalan süre, sınav
 * ailesine göre gruplanmış yapılandırılmış liste. Hedef, sınav gününün TRT
 * gece yarısıdır; kalan süre gün/saat/dakika/saniye olarak gösterilir ve
 * **saniyede bir** güncellenir.
 *
 * Saat okuma yalnız zamanlayıcı geri çağrısında (render saf); ilk render'da
 * `now = null` yer tutucu, mount sonrası tazelenir.
 */
export function ExamCountdown() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    const first = setTimeout(update, 0);
    const id = setInterval(update, 1_000);
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
              const diffMs =
                now === null ? null : item.target.getTime() - now;
              const weekday = DAY_NAMES_TR[trWeekday(item.target) - 1];

              // Canlı geri sayım — kalan süreyi gün/saat/dakika/saniye böl.
              let remaining: { d: number; h: number; m: number; s: number } | null =
                null;
              if (diffMs !== null && diffMs > 0) {
                const totalSec = Math.floor(diffMs / 1000);
                remaining = {
                  d: Math.floor(totalSec / 86_400),
                  h: Math.floor((totalSec % 86_400) / 3_600),
                  m: Math.floor((totalSec % 3_600) / 60),
                  s: totalSec % 60,
                };
              }

              return (
                <li
                  key={item.key}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "mt-1.5 size-2.5 shrink-0 rounded-full",
                        item.dotClass,
                      )}
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
                  </div>

                  <div className="shrink-0 pl-5 sm:pl-0">
                    {remaining ? (
                      <div className="flex items-end gap-2.5 sm:gap-3">
                        <TimeSeg
                          value={remaining.d}
                          label="gün"
                          className={item.numberClass}
                          lead
                        />
                        <TimeSeg value={remaining.h} label="saat" pad />
                        <TimeSeg value={remaining.m} label="dk" pad />
                        <TimeSeg value={remaining.s} label="sn" pad />
                      </div>
                    ) : days === null ? (
                      <span
                        className={cn(
                          "font-heading text-2xl font-bold sm:text-3xl",
                          item.numberClass,
                        )}
                      >
                        —
                      </span>
                    ) : days === 0 ? (
                      <span
                        className={cn(
                          "font-heading text-lg font-bold",
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

"use client";

import { useState } from "react";

import type { SubjectDeficitGroup } from "@/lib/deficit";
import { formatInt } from "@/lib/format";
import { Button } from "@/components/ui/button";

/**
 * DERS DERS EKSİKLER — her dersten en çok eksik verilen ilk N konu.
 *
 * Üstteki çiplerden ders seçilir ("Tümü" hepsini bölüm bölüm gösterir).
 * Çubuklar TÜM derslerde ORTAK ölçektedir (`max` = en yüksek tek konu eksiği),
 * yoksa Tarih'in 9'u ile Türkçe'nin 42'si aynı boyda görünür ve dersler arası
 * kıyas yanıltıcı olur.
 */
export function SubjectDeficitPanel({
  groups,
  max,
}: {
  groups: SubjectDeficitGroup[];
  /** Ortak ölçek — genelde `deficits[0].total`. */
  max: number;
}) {
  const [subjectId, setSubjectId] = useState<number | null>(null);

  if (groups.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Henüz deneme analizi girilmedi. Deneme sonrası eksik konuları işleyince
        burada ders ders sıralama oluşur.
      </div>
    );
  }

  // Seçili ders listeden düşerse (veri değişti) "Tümü"ye dön.
  const selected = groups.find((g) => g.subjectId === subjectId) ?? null;
  const shown = selected ? [selected] : groups;
  const scale = Math.max(1, max);

  return (
    <div className="flex flex-col gap-4">
      {groups.length > 1 && (
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Ders filtresi"
        >
          <Button
            type="button"
            size="sm"
            variant={selected ? "outline" : "default"}
            aria-pressed={!selected}
            onClick={() => setSubjectId(null)}
          >
            Tümü
          </Button>
          {groups.map((g) => {
            const active = selected?.subjectId === g.subjectId;
            return (
              <Button
                key={g.subjectId}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => setSubjectId(g.subjectId)}
              >
                {g.subjectName}
                <span
                  className={
                    active
                      ? "tabular-nums opacity-70"
                      : "tabular-nums text-muted-foreground"
                  }
                >
                  {formatInt(g.total)}
                </span>
              </Button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {shown.map((g) => (
          <section
            key={g.subjectId}
            className="flex flex-col gap-2 border-t pt-3 first:border-t-0 first:pt-0"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: g.chartColor ?? "var(--color-primary)",
                  }}
                />
                <span className="truncate text-sm font-medium">
                  {g.subjectName}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatInt(g.total)} eksik
                {g.topicCount > g.topics.length &&
                  ` · ${formatInt(g.topicCount)} konu`}
              </span>
            </div>
            <ol className="flex flex-col gap-2">
              {g.topics.map((t, i) => (
                <li key={t.topicId} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-sm">{t.topicName}</span>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(6, Math.round((t.total / scale) * 100))}%`,
                          backgroundColor:
                            g.chartColor ?? "var(--color-primary)",
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {formatInt(t.total)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

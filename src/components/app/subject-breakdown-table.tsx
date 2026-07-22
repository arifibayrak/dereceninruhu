import { Fragment } from "react";

import { formatInt } from "@/lib/format";
import { accuracyPct } from "@/lib/question-log";
import type { SubjectBreakdown } from "@/db/queries/tracking";
import { cn } from "@/lib/utils";

/** Hafta başlangıcı → "6 Tem" (sütun başlığı; yıl gereksiz, pencere 8 hafta). */
const weekFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

/**
 * "Ders ders soru ve doğruluk" tablosu — öğrencinin Excel'de alışkın olduğu
 * görünüm. Satır = ders (bölüme göre gruplu), sütun = son N hafta + toplam
 * özet (Toplam / D / Y / Doğruluk).
 *
 * Kırılım opsiyonel olduğundan D/Y/Doğruluk hiç girilmemişse "—" gösterilir;
 * 0 göstermek "hepsini yanlış yapmış" gibi okunurdu.
 *
 * Sunucu bileşeni — etkileşim yok, salt okunur.
 */
export function SubjectBreakdownTable({ data }: { data: SubjectBreakdown }) {
  if (data.rows.length === 0) {
    return (
      <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Soru girişi yaptıkça ders ders kırılımın burada oluşacak.
      </p>
    );
  }

  // Bölüm başlıkları yalnız birden fazla bölüm varsa anlamlı.
  const sectionIds = new Set(data.rows.map((r) => r.sectionId));
  const showSectionHeaders = sectionIds.size > 1;

  const grandTotal = data.rows.reduce((acc, r) => acc + r.total.total, 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
                Ders
              </th>
              {data.weeks.map((w) => (
                <th
                  key={w.weekKey}
                  className="px-1.5 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap"
                >
                  {weekFmt.format(w.weekStart)}
                </th>
              ))}
              <th className="border-l px-2 py-2 text-right font-medium">
                Toplam
              </th>
              <th className="px-2 py-2 text-right font-medium text-success">
                D
              </th>
              <th className="px-2 py-2 text-right font-medium text-destructive">
                Y
              </th>
              <th className="px-2 py-2 text-right font-medium whitespace-nowrap">
                Doğruluk
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => {
              const prev = i > 0 ? data.rows[i - 1] : null;
              const header =
                showSectionHeaders &&
                (prev === null || prev.sectionId !== row.sectionId)
                  ? row.sectionName
                  : null;
              const isChild = row.parentSubjectId != null;
              const acc =
                row.total.correct != null && row.total.wrong != null
                  ? accuracyPct(row.total.correct, row.total.wrong)
                  : null;

              return (
                <Fragment key={row.subjectId}>
                  {header && (
                    <tr className="border-b bg-muted/30">
                      <td
                        colSpan={data.weeks.length + 5}
                        className="px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                      >
                        {header}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b last:border-0">
                    <td
                      className={cn(
                        "sticky left-0 z-10 bg-card px-3 py-2 font-medium whitespace-nowrap",
                        isChild && "pl-6 font-normal text-muted-foreground",
                      )}
                    >
                      {row.subjectName}
                    </td>
                    {data.weeks.map((w) => {
                      const cell = row.byWeek[w.weekKey];
                      return (
                        <td
                          key={w.weekKey}
                          className="px-1.5 py-2 text-center tabular-nums"
                        >
                          {cell && cell.total > 0 ? (
                            formatInt(cell.total)
                          ) : (
                            <span className="text-muted-foreground/40">·</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="border-l px-2 py-2 text-right font-medium tabular-nums">
                      {formatInt(row.total.total)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.total.correct != null ? (
                        formatInt(row.total.correct)
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.total.wrong != null ? (
                        formatInt(row.total.wrong)
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {acc !== null ? (
                        <span
                          className={cn(
                            "font-medium",
                            acc >= 80
                              ? "text-success"
                              : acc >= 60
                                ? "text-foreground"
                                : "text-destructive",
                          )}
                        >
                          %{acc}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t bg-muted/40 font-medium">
              <td className="sticky left-0 z-10 bg-muted/40 px-3 py-2">
                Tüm dersler
              </td>
              {data.weeks.map((w) => {
                const weekTotal = data.rows.reduce(
                  (acc, r) => acc + (r.byWeek[w.weekKey]?.total ?? 0),
                  0,
                );
                return (
                  <td
                    key={w.weekKey}
                    className="px-1.5 py-2 text-center tabular-nums"
                  >
                    {weekTotal > 0 ? formatInt(weekTotal) : "–"}
                  </td>
                );
              })}
              <td
                className="border-l px-2 py-2 text-right tabular-nums"
                colSpan={4}
              >
                {formatInt(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        &mdash; işareti o derste doğru/yanlış girilmediğini gösterir. Doğruluk =
        doğru ÷ (doğru + yanlış); boşlar sayılmaz.
      </p>
    </div>
  );
}

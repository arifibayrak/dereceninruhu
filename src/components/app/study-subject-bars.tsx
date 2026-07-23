import type { StudySubjectRow } from "@/db/queries/study";
import { formatMinutes } from "@/lib/study";

/** Ders ders çalışma süresi — oransal çubuklar (çoktan aza sıralı). */
export function StudySubjectBars({ rows }: { rows: StudySubjectRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Ders seçerek kaydettiğin çalışmalar burada dağılım olarak görünecek.
      </p>
    );
  }
  const max = rows[0]?.minutes ?? 0;
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((s) => {
        const pct = max > 0 ? Math.round((s.minutes / max) * 100) : 0;
        return (
          <li key={s.subjectId ?? "genel"} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{s.subjectName}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatMinutes(s.minutes)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: s.chartColor ?? "var(--chart-2)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

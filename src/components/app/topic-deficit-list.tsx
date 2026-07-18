import { formatInt } from "@/lib/format";
import type { TopicDeficit } from "@/db/queries/analiz";

/**
 * TOPLAM EKSİK sıralaması — en çok eksik verilen konular, çubuklu liste.
 * Server component; veri sayfadan gelir.
 */
export function TopicDeficitList({
  deficits,
  limit = 10,
}: {
  deficits: TopicDeficit[];
  limit?: number;
}) {
  const rows = deficits.slice(0, limit);
  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Henüz deneme analizi girilmedi. Deneme sonrası eksik konuları işleyince
        burada sıralama oluşur.
      </div>
    );
  }
  const max = rows[0].total;

  return (
    <ol className="flex flex-col gap-2">
      {rows.map((d, i) => (
        <li key={d.topicId} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-right text-xs font-semibold text-muted-foreground tabular-nums">
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{d.topicName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {d.subjectName}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(6, Math.round((d.total / max) * 100))}%`,
                  backgroundColor: d.chartColor ?? "var(--color-primary)",
                }}
              />
            </div>
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
            {formatInt(d.total)}
          </span>
        </li>
      ))}
    </ol>
  );
}

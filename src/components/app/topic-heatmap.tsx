import { cn } from "@/lib/utils";
import type { TopicHeatmapData } from "@/db/queries/analiz";

const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "short",
});

/** Eksik yoğunluğuna göre hücre arka planı. */
function cellClass(count: number | undefined): string {
  if (!count) return "bg-muted/30 text-muted-foreground/40";
  if (count === 1) return "bg-destructive/15 text-destructive";
  if (count === 2) return "bg-destructive/30 text-destructive";
  if (count <= 4) return "bg-destructive/50 text-white";
  return "bg-destructive/75 text-white";
}

/**
 * Konu × deneme ısı haritası — satırlar TOPLAM EKSİK sırasında, sütunlar
 * eskiden yeniye denemeler. Server component.
 */
export function TopicHeatmap({ data }: { data: TopicHeatmapData }) {
  if (data.topics.length === 0 || data.mocks.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
        Isı haritası için önce deneme analizlerinde konu eksikleri girilmeli.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium">
              Konu
            </th>
            {data.mocks.map((m) => (
              <th
                key={m.id}
                className="px-1 py-2 text-center font-medium whitespace-nowrap"
              >
                <div className="flex flex-col leading-tight">
                  <span className="max-w-16 truncate text-[11px]" title={m.label}>
                    {m.label}
                  </span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {dayMonthFmt.format(m.takenOn)}
                  </span>
                </div>
              </th>
            ))}
            <th className="px-2 py-2 text-right font-medium">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {data.topics.map((t) => (
            <tr key={t.topicId} className="border-b last:border-0">
              <td className="sticky left-0 z-10 bg-card px-3 py-1.5 whitespace-nowrap">
                <div className="flex max-w-52 flex-col leading-tight">
                  <span className="truncate font-medium" title={t.topicName}>
                    {t.topicName}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {t.subjectName}
                  </span>
                </div>
              </td>
              {data.mocks.map((m) => {
                const count = data.cells[`${t.topicId}:${m.id}`];
                return (
                  <td key={m.id} className="px-0.5 py-1 text-center">
                    <span
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-md text-xs font-medium tabular-nums",
                        cellClass(count),
                      )}
                      title={
                        count
                          ? `${t.topicName} · ${m.label}: ${count} eksik`
                          : undefined
                      }
                    >
                      {count ?? "·"}
                    </span>
                  </td>
                );
              })}
              <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                {t.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

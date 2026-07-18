import {
  AlarmClockIcon,
  ChartColumnIncreasingIcon,
  CircleAlertIcon,
  FlameIcon,
  SparklesIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";

import type { Insight, InsightTone } from "@/lib/insights";
import { cn } from "@/lib/utils";

/** buildStudentInsights'in icon adlarını lucide bileşenlerine eşler. */
const ICONS: Record<string, LucideIcon> = {
  AlarmClock: AlarmClockIcon,
  Target: TargetIcon,
  TrendingUp: TrendingUpIcon,
  TrendingDown: TrendingDownIcon,
  Flame: FlameIcon,
  ChartColumnIncreasing: ChartColumnIncreasingIcon,
  CircleAlert: CircleAlertIcon,
};

const TONE_STYLES: Record<InsightTone, { chip: string; icon: string }> = {
  positive: { chip: "bg-success/10", icon: "text-success" },
  warning: { chip: "bg-warning/10", icon: "text-warning" },
  neutral: { chip: "bg-info/10", icon: "text-info" },
};

/** Otomatik içgörü listesi — /ogrenci/gelisim ve koç kokpiti özeti. */
export function InsightList({
  insights,
  limit,
  emptyText = "Veri biriktikçe içgörüler burada görünecek.",
  className,
}: {
  insights: Insight[];
  limit?: number;
  emptyText?: string;
  className?: string;
}) {
  const shown = limit ? insights.slice(0, limit) : insights;

  if (shown.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground",
          className,
        )}
      >
        <SparklesIcon className="size-4 shrink-0" />
        {emptyText}
      </div>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {shown.map((insight) => {
        const Icon = ICONS[insight.icon] ?? SparklesIcon;
        const tone = TONE_STYLES[insight.tone];
        return (
          <li
            key={insight.id}
            className="flex items-start gap-3 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                tone.chip,
              )}
            >
              <Icon className={cn("size-4", tone.icon)} />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">{insight.title}</span>
              {insight.detail && (
                <span className="text-xs text-muted-foreground">
                  {insight.detail}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

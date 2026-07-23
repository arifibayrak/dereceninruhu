"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMinutes } from "@/lib/study";

export type StudyPoint = {
  /** Hafta etiketi, örn. "13 – 19 Tem". */
  label: string;
  minutes: number;
};

/** Haftalık çalışma süresi — çubuk grafik, ders paleti 2 (kehribar). */
export function WeeklyStudyChart({ points }: { points: StudyPoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--muted) 60%, transparent)" }}
            formatter={(value) => [formatMinutes(Number(value)), ""]}
            separator=""
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
          />
          <Bar
            dataKey="minutes"
            fill="var(--chart-2)"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

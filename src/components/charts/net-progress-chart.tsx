"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatNet } from "@/lib/format";

export type NetChartPoint = {
  /** X etiketi (deneme adı ya da tarih). */
  label: string;
  net: number;
};

/**
 * Toplam net gelişimi — /marka'daki statik SVG'nin Recharts karşılığı.
 * Son nokta derecenin altınıyla vurgulanır. Tema tokenlarını izler.
 */
export function NetProgressChart({ points }: { points: NetChartPoint[] }) {
  const data = points.map((p, i) => ({ ...p, i }));
  const last = data.length - 1;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="i"
            type="number"
            domain={[0, Math.max(last, 1)]}
            ticks={data.map((d) => d.i)}
            tickFormatter={(v: number) => data[v]?.label ?? ""}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={44}
            domain={["auto", "auto"]}
            tickFormatter={(v: number) => formatNet(v)}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            labelFormatter={(v) => data[Number(v)]?.label ?? ""}
            formatter={(value) => [`${formatNet(Number(value))} net`, ""]}
            separator=""
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--popover-foreground)",
            }}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--chart-1)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          {last >= 0 && (
            <ReferenceDot
              x={last}
              y={data[last].net}
              r={5.5}
              fill="var(--gold)"
              stroke="var(--card)"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

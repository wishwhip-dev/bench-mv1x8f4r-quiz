"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  score: { label: "Score", color: "var(--chart-1)" },
} satisfies ChartConfig;

export type ChartPoint = {
  /** Short axis label, e.g. "12 Oct" or "#3". */
  label: string;
  score: number;
};

/**
 * The score across recent attempts, oldest on the left. Rendered only with real points — the
 * caller decides what an empty history looks like.
 */
export function ScoreChart({ points }: { points: ChartPoint[] }) {
  if (points.length === 0) return null;

  return (
    <ChartContainer config={chartConfig} className="h-[180px] w-full sm:h-[220px]">
      <LineChart data={points} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis domain={[0, 10]} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="score"
          type="monotone"
          stroke="var(--color-score)"
          strokeWidth={2}
          // A dot, so a single attempt is still visible as a point rather than an empty box.
          dot={{ r: 3 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
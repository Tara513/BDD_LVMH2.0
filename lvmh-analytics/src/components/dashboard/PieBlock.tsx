"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_COLORS, TOOLTIP_STYLE, PIE_SIZE } from "./chartsConfig";

type PieData = Array<{ name: string; value: number }>;

export function PieBlock({
  data,
  title,
  description,
}: {
  data: PieData;
  title: string;
  description?: string;
}) {
  if (!data.length) return null;
  return (
    <ChartCard title={title} description={description}>
      <div className="min-h-0 w-full overflow-visible" style={{ height: PIE_SIZE.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 16, bottom: 16, left: 16 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={PIE_SIZE.outerRadius}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: "#737373" }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

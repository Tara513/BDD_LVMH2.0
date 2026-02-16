"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from "recharts";
import { CHART_COLORS, PIE_SIZE } from "./chartsConfig";

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
  const innerRadius = PIE_SIZE.innerRadius ?? 0;
  return (
    <ChartCard title={title} description={description}>
      <div className="min-h-0 w-full overflow-visible" style={{ height: PIE_SIZE.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 24, right: 200, bottom: 24, left: 24 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="38%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={PIE_SIZE.outerRadius}
              label={({ name, percent }) => (percent >= 0.01 ? `${(percent * 100).toFixed(1)}%` : "")}
              labelLine={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconSize={10}
              iconType="square"
              wrapperStyle={{ paddingLeft: 16 }}
              formatter={(value) => <span className="text-xs text-neutral-300">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

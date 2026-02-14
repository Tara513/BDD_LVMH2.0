"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
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
      <div className="min-h-0 w-full overflow-visible pb-3" style={{ height: PIE_SIZE.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 16, right: 28, bottom: 64, left: 28 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="44%"
              outerRadius={PIE_SIZE.outerRadius}
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: "#737373" }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              iconSize={10}
              iconType="circle"
              wrapperStyle={{ paddingTop: 14, minHeight: 48, flexWrap: "wrap", justifyContent: "center", gap: "4px 16px" }}
              formatter={(value) => <span className="text-xs text-neutral-300">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

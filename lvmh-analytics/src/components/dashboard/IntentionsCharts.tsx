"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TagDistribution } from "@/lib/dashboardStats";
import { intentionsSoiVsOffrir, top5Motifs } from "@/lib/dashboardStats";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE, BAR_RADIUS } from "./chartsConfig";
import { PieBlock } from "./PieBlock";

export function IntentionsCharts({ dist }: { dist: TagDistribution }) {
  const soiVsOffrir = intentionsSoiVsOffrir(dist);
  const top5 = top5Motifs(dist);
  const hasAny = soiVsOffrir.length > 0 || top5.length > 0;
  if (!hasAny) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Intentions d'achat
      </h2>
      <p className="text-xs text-neutral-500">
        Motivations dominantes et achat pour soi vs pour offrir.
      </p>
      <div className={`grid gap-6 ${soiVsOffrir.length > 0 && top5.length > 0 ? "lg:grid-cols-2" : ""}`}>
        {soiVsOffrir.length > 0 && (
          <PieBlock
            data={soiVsOffrir}
            title="Achat pour soi vs pour offrir"
            description="Répartition des motivations"
          />
        )}
        {top5.length > 0 && (
          <ChartCard
            title="Top 5 motifs"
            description="Anniversaire, Voyage, Investissement, etc."
          >
            <div className="min-h-0 w-full overflow-visible" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top5} layout="vertical" margin={{ top: 8, right: 16, bottom: 16, left: 4 }}>
                  <XAxis type="number" dataKey="count" {...AXIS_STYLE} />
                  <YAxis type="category" dataKey="name" width={130} {...AXIS_STYLE} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" radius={BAR_RADIUS} minPointSize={4}>
                    {top5.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    </section>
  );
}

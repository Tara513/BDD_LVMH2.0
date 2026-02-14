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
import { budgetTranches, budgetMoyenParProjet } from "@/lib/dashboardStats";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE, BAR_RADIUS } from "./chartsConfig";
import { PieBlock } from "./PieBlock";

export function BudgetCharts({ dist }: { dist: TagDistribution }) {
  const tranches = budgetTranches(dist);
  const moyenParProjet = budgetMoyenParProjet(dist);
  const hasAny = tranches.length > 0 || moyenParProjet.length > 0;
  if (!hasAny) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Budget analysis
      </h2>
      <p className="text-xs text-neutral-500">
        Répartition par tranche et budget moyen par type de projet.
      </p>
      <div className={`grid gap-6 ${tranches.length > 0 && moyenParProjet.length > 0 ? "lg:grid-cols-2" : ""}`}>
        {tranches.length > 0 && (
          <PieBlock
            data={tranches}
            title="Répartition par tranche de budget"
            description="Entry / Core / Premium / VIC"
          />
        )}
        {moyenParProjet.length > 0 && (
          <ChartCard
            title="Budget moyen par type de projet"
            description="Valeur client par motivation"
          >
            <div className="min-h-0 w-full overflow-visible" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moyenParProjet} layout="vertical" margin={{ top: 8, right: 16, bottom: 16, left: 4 }}>
                  <XAxis type="number" {...AXIS_STYLE} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k €`} />
                  <YAxis type="category" dataKey="name" width={100} {...AXIS_STYLE} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: number) => [`${v.toLocaleString("fr-FR")} €`, "Budget moyen"]}
                  />
                  <Bar dataKey="budgetMoyen" radius={BAR_RADIUS} minPointSize={4} barCategoryGap="12%">
                    {moyenParProjet.map((_, i) => (
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

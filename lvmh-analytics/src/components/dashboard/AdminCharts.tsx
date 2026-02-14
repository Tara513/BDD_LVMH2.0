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
import { PieBlock } from "./PieBlock";
import type { TagDistribution } from "@/lib/dashboardStats";
import {
  topPurchaseProjects,
  budgetTranches,
  topCategories,
  timingDistribution,
  materialsDistribution,
} from "@/lib/dashboardStats";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE, BAR_RADIUS } from "./chartsConfig";

function BarChartColored({
  data,
  title,
  description,
  dataKey = "count",
}: {
  data: Array<{ name: string; count: number }>;
  title: string;
  description?: string;
  dataKey?: string;
}) {
  if (!data.length) {
    return (
      <ChartCard title={title} description={description}>
        <div className="flex h-56 items-center justify-center text-xs text-neutral-500">Aucune donnée</div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title={title} description={description}>
      <div className="min-h-0 w-full overflow-visible" style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 20, bottom: 80, left: 12 }}>
            <XAxis dataKey="name" {...AXIS_STYLE} angle={-35} textAnchor="end" height={72} interval={0} />
            <YAxis {...AXIS_STYLE} width={32} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey={dataKey} radius={BAR_RADIUS} minPointSize={4} barCategoryGap="18%">
              {data.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function AdminCharts({ dist }: { dist: TagDistribution }) {
  const purchaseProjects = topPurchaseProjects(dist);
  const budget = budgetTranches(dist);
  const productCategories = topCategories(dist);
  const timing = timingDistribution(dist);
  const materials = materialsDistribution(dist);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Top Purchase Projects
        </h2>
        <BarChartColored
          data={purchaseProjects}
          title="Top Purchase Projects"
          description="Répartition des projets d'achat majeurs"
        />
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Budget Distribution
        </h2>
        {budget.length > 0 ? (
          <PieBlock
            data={budget}
            title="Budget Distribution"
            description="Entry / Core / Premium / VIC"
          />
        ) : (
          <ChartCard title="Budget Distribution" description="Entry / Core / Premium / VIC">
            <div className="flex h-56 items-center justify-center text-xs text-neutral-500">Aucune donnée</div>
          </ChartCard>
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <BarChartColored
          data={timing}
          title="Timing Distribution"
          description="1-3 mois, 3-6 mois, > 6 mois"
        />
        <BarChartColored
          data={productCategories}
          title="Top Product Categories"
          description="Sacs, Sneakers, etc."
        />
        <BarChartColored
          data={materials}
          title="Materials Preferences"
          description="Cuir grainé, Exotiques, etc."
        />
      </div>
    </div>
  );
}

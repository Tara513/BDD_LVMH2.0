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
import { topCategories, topSacs, topChaussures, maisonDistribution } from "@/lib/dashboardStats";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE, BAR_RADIUS } from "./chartsConfig";
import { PieBlock } from "./PieBlock";

function MaisonPlaceholder() {
  return (
    <ChartCard title="Répartition par maison" description="Marques LVMH citées dans les notes">
      <div className="flex h-[220px] w-full items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900/30">
        <p className="text-center text-xs text-neutral-500">
          Aucune marque détectée.
          <br />
          Réanalyser le fichier pour extraire les maisons.
        </p>
      </div>
    </ChartCard>
  );
}

function BarBlock({
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
  if (!data.length) return null;
  return (
    <ChartCard title={title} description={description}>
      <div className="min-h-0 w-full overflow-visible" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 16, left: 4 }}>
            <XAxis type="number" {...AXIS_STYLE} />
            <YAxis type="category" dataKey="name" width={140} {...AXIS_STYLE} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey={dataKey} radius={BAR_RADIUS} minPointSize={4} barCategoryGap="12%">
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

export function ProduitsCharts({ dist }: { dist: TagDistribution }) {
  const categories = topCategories(dist);
  const sacs = topSacs(dist);
  const chaussures = topChaussures(dist);
  const maisons = maisonDistribution(dist);
  const hasAny = categories.length > 0 || sacs.length > 0 || chaussures.length > 0 || maisons.length > 0;
  if (!hasAny) return null;

  const sacsPie = sacs.map((d) => ({ name: d.name, value: d.count }));
  const chaussuresPie = chaussures.map((d) => ({ name: d.name, value: d.count }));

  const blocks = [
    categories.length ? <BarBlock key="cat" data={categories} title="Top catégories produits" description="Répartition par type de produit" /> : null,
    sacs.length ? <PieBlock key="sacs" data={sacsPie} title="Top types de sacs" description="Sac à main, travail, voyage" /> : null,
    chaussures.length ? <PieBlock key="chaussures" data={chaussuresPie} title="Top types de chaussures" description="Sneakers, bottes, escarpins" /> : null,
    maisons.length ? (
      <PieBlock key="maisons" data={maisons} title="Répartition par maison" description="Marques LVMH citées dans les notes" />
    ) : (
      <MaisonPlaceholder key="maisons" />
    ),
  ].filter(Boolean);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Produits & catégories
      </h2>
      <p className="text-xs text-neutral-500">
        Drivers business : catégories, sacs, chaussures, maisons.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {blocks}
      </div>
    </section>
  );
}

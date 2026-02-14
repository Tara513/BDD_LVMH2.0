"use client";

import type { TagDistribution } from "@/lib/dashboardStats";
import { styleDistribution } from "@/lib/dashboardStats";
import { PieBlock } from "./PieBlock";

export function StyleCharts({ dist }: { dist: TagDistribution }) {
  const styleData = styleDistribution(dist);
  if (styleData.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Style & sensibilité mode
      </h2>
      <p className="text-xs text-neutral-500">
        Trendy vs Timeless vs Classic pour guider la stratégie produit.
      </p>
      <PieBlock
        data={styleData}
        title="Trendy vs Timeless vs Classic"
        description="Positionnement style client"
      />
    </section>
  );
}

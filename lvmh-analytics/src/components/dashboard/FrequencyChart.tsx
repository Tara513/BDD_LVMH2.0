"use client";

import type { TagDistribution } from "@/lib/dashboardStats";
import { frequencyDistribution } from "@/lib/dashboardStats";
import { PieBlock } from "./PieBlock";

export function FrequencyChart({ dist }: { dist: TagDistribution }) {
  const data = frequencyDistribution(dist);
  if (data.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Fréquence d'achat
      </h2>
      <p className="text-xs text-neutral-500">
        Régulier / Occasionnel / Rare pour comprendre la fidélité.
      </p>
      <PieBlock
        data={data}
        title="Répartition Regular / Occasional / Rare"
        description="Fréquence d'achat identifiée en note"
      />
    </section>
  );
}

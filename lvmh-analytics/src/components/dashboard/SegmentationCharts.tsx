"use client";

import type { TagDistribution } from "@/lib/dashboardStats";
import {
  segmentationAge,
  segmentationGenre,
  segmentationStatut,
} from "@/lib/dashboardStats";
import { PieBlock } from "./PieBlock";

export function SegmentationCharts({ dist }: { dist: TagDistribution }) {
  const age = segmentationAge(dist);
  const genre = segmentationGenre(dist);
  const statut = segmentationStatut(dist);
  const hasAny = age.length > 0 || genre.length > 0 || statut.length > 0;
  if (!hasAny) return null;

  const blocks = [
    age.length ? <PieBlock key="age" data={age} title="Répartition par tranche d'âge" description="Âge ou génération identifiée" /> : null,
    genre.length ? <PieBlock key="genre" data={genre} title="Répartition par genre" description="Genre identifié en note" /> : null,
    statut.length ? <PieBlock key="statut" data={statut} title="Statut relationnel" description="New / Regular / Loyal / VIP" /> : null,
  ].filter(Boolean);

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        Segmentation client
      </h2>
      <p className="text-xs text-neutral-500">
        Structure de la clientèle (âge, genre, statut relationnel).
      </p>
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        {blocks}
      </div>
    </section>
  );
}

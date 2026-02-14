/**
 * Dérivation des KPIs et séries pour le dashboard admin à partir de get_dashboard_stats RPC.
 * Aucune donnée mockée : tout vient de Supabase.
 */
import { BUDGET_MIDPOINTS } from "./taxonomy";

export type TagDistribution = Record<string, Record<string, number>>;

export type DashboardStatsRpc = {
  totalClients: number;
  taggedCount: number;
  tagDistribution: TagDistribution;
};

export type DashboardKpis = {
  totalClients: number;
  vipHighValuePct: number | null;
  budgetMoyen: number | null;
  achatsUrgentsPct: number | null;
  taggingRate: number;
  nouveauxVsFidelesPct: { nouveaux: number; fideles: number } | null;
};

function getFamilyTagCounts(dist: TagDistribution, family: string): Record<string, number> {
  return dist[family] ?? {};
}

function sumTagCounts(tagCounts: Record<string, number>): number {
  return Object.values(tagCounts).reduce((a, b) => a + b, 0);
}

/** Compte total de tags pour une famille (pour répartitions) */
function familyTotal(dist: TagDistribution, family: string): number {
  return sumTagCounts(getFamilyTagCounts(dist, family));
}

export function deriveKpis(rpc: DashboardStatsRpc): DashboardKpis {
  const total = rpc.totalClients;
  const taggingRate = total > 0 ? Math.round((rpc.taggedCount / total) * 100) : 0;

  const clientSegment = getFamilyTagCounts(rpc.tagDistribution, "Client_Segment");
  const vipCount = (clientSegment["VIP"] ?? 0) + (clientSegment["High_Value"] ?? 0);
  const vipHighValuePct = total > 0 && (clientSegment["VIP"] != null || clientSegment["High_Value"] != null)
    ? Math.round((vipCount / total) * 100)
    : null;

  const budgetSegment = getFamilyTagCounts(rpc.tagDistribution, "Budget_Segment");
  const budgetTotalTags = sumTagCounts(budgetSegment);
  let budgetMoyen: number | null = null;
  if (budgetTotalTags > 0) {
    let sum = 0;
    for (const [tag, count] of Object.entries(budgetSegment)) {
      const mid = BUDGET_MIDPOINTS[tag];
      if (mid != null) sum += mid * count;
    }
    budgetMoyen = Math.round(sum / budgetTotalTags);
  }

  const urgence = getFamilyTagCounts(rpc.tagDistribution, "Urgence");
  const urgentCount = urgence["Urgent"] ?? 0;
  const achatsUrgentsPct = total > 0 && (urgence["Urgent"] != null || urgence["Planned"] != null)
    ? Math.round((urgentCount / total) * 100)
    : null;

  const newCount = clientSegment["New"] ?? 0;
  const loyalCount = clientSegment["Loyal"] ?? 0;
  const segmentTotal = newCount + loyalCount;
  const nouveauxVsFidelesPct = total > 0 && segmentTotal > 0
    ? {
        nouveaux: Math.round((newCount / total) * 100),
        fideles: Math.round((loyalCount / total) * 100),
      }
    : null;

  return {
    totalClients: total,
    vipHighValuePct: vipHighValuePct ?? null,
    budgetMoyen,
    achatsUrgentsPct: achatsUrgentsPct ?? null,
    taggingRate,
    nouveauxVsFidelesPct,
  };
}

/** Format { name, value } pour graphiques (bar / pie) */
export function distributionToSeries(
  dist: TagDistribution,
  family: string,
  labelMap?: Record<string, string>
): Array<{ name: string; value: number }> {
  const counts = getFamilyTagCounts(dist, family);
  return Object.entries(counts)
    .map(([tag, value]) => ({ name: labelMap?.[tag] ?? tag, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Pour graphiques bar horizontaux (top N) */
export function topN(
  dist: TagDistribution,
  family: string,
  n: number,
  labelMap?: Record<string, string>
): Array<{ name: string; count: number }> {
  return distributionToSeries(dist, family, labelMap)
    .slice(0, n)
    .map((d) => ({ name: d.name, count: d.value }));
}

/** Achat pour soi vs Cadeau : Cadeau = offrir, reste Motivations = pour soi (approximation) */
export function intentionsSoiVsOffrir(dist: TagDistribution): Array<{ name: string; value: number }> {
  const motivations = getFamilyTagCounts(dist, "Motivations");
  const cadeau = motivations["Cadeau"] ?? 0;
  const pourSoi = sumTagCounts(motivations) - cadeau;
  const out: Array<{ name: string; value: number }> = [];
  if (pourSoi > 0) out.push({ name: "Pour soi", value: pourSoi });
  if (cadeau > 0) out.push({ name: "Pour offrir", value: cadeau });
  return out;
}

/** Top 5 motifs (Motivations) */
export function top5Motifs(dist: TagDistribution): Array<{ name: string; count: number }> {
  return topN(dist, "Motivations", 5, {
    Anniversaire: "Anniversaire",
    Cadeau: "Cadeau",
    Célébration: "Célébration",
    Investissement: "Investissement",
    Professionnel: "Professionnel",
    Voyage: "Voyage",
  });
}

/** Top catégories produits = Produits (tous) */
export function topCategories(dist: TagDistribution): Array<{ name: string; count: number }> {
  return topN(dist, "Produits", 10, {
    Sac_Main: "Sac à main",
    Sac_Travail: "Sac travail",
    Sac_Voyage: "Sac voyage",
    Petite_Maroquinerie: "Petite maroquinerie",
    Sneakers: "Sneakers",
    Botte: "Bottes",
    Escarpin: "Escarpins",
  });
}

/** Top types de sacs (tags Produits contenant "Sac") */
export function topSacs(dist: TagDistribution): Array<{ name: string; count: number }> {
  const produits = getFamilyTagCounts(dist, "Produits");
  const sacTags = Object.entries(produits).filter(
    ([tag]) => tag === "Sac_Main" || tag === "Sac_Travail" || tag === "Sac_Voyage"
  );
  const labelMap: Record<string, string> = {
    Sac_Main: "Sac à main",
    Sac_Travail: "Sac travail",
    Sac_Voyage: "Sac voyage",
  };
  return sacTags
    .map(([tag, count]) => ({ name: labelMap[tag] ?? tag, count }))
    .sort((a, b) => b.count - a.count);
}

/** Top types de chaussures */
export function topChaussures(dist: TagDistribution): Array<{ name: string; count: number }> {
  const produits = getFamilyTagCounts(dist, "Produits");
  const shoeTags = Object.entries(produits).filter(
    ([tag]) => tag === "Sneakers" || tag === "Botte" || tag === "Escarpin"
  );
  const labelMap: Record<string, string> = {
    Sneakers: "Sneakers",
    Botte: "Bottes",
    Escarpin: "Escarpins",
  };
  return shoeTags
    .map(([tag, count]) => ({ name: labelMap[tag] ?? tag, count }))
    .sort((a, b) => b.count - a.count);
}

/** Répartition par maison (marque LVMH) pour graphique catégorie importante */
export function maisonDistribution(dist: TagDistribution): Array<{ name: string; value: number }> {
  return distributionToSeries(dist, "Maison");
}

/** Répartition par tranche de budget (Budget_Segment) */
export function budgetTranches(dist: TagDistribution): Array<{ name: string; value: number }> {
  const labelMap: Record<string, string> = {
    Entry: "Entry (≤2,5k€)",
    Core: "Core (2,5k–7,5k€)",
    Premium: "Premium (7,5k–15k€)",
    VIC: "VIC (15k€+)",
  };
  return distributionToSeries(dist, "Budget_Segment", labelMap);
}

/** Budget moyen par type de projet. Sans croisement note-level on affiche le budget moyen global
 * avec une barre par motif (même valeur) pour structure évolutive. */
export function budgetMoyenParProjet(dist: TagDistribution): Array<{ name: string; budgetMoyen: number }> {
  const budgetSegment = getFamilyTagCounts(dist, "Budget_Segment");
  const totalBudgetTags = sumTagCounts(budgetSegment);
  if (totalBudgetTags === 0) return [];
  let sum = 0;
  for (const [tag, count] of Object.entries(budgetSegment)) {
    const mid = BUDGET_MIDPOINTS[tag];
    if (mid != null) sum += mid * count;
  }
  const globalMoyen = Math.round(sum / totalBudgetTags);
  const motivations = getFamilyTagCounts(dist, "Motivations");
  return Object.entries(motivations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([motif]) => ({ name: motif, budgetMoyen: globalMoyen }));
}

/** Style : Trendy / Timeless / Classic */
export function styleDistribution(dist: TagDistribution): Array<{ name: string; value: number }> {
  return distributionToSeries(dist, "Style", {
    Trendy: "Trendy",
    Timeless: "Timeless",
    Classic: "Classic",
  });
}

/** Fréquence : Regular / Occasional / Rare */
export function frequencyDistribution(dist: TagDistribution): Array<{ name: string; value: number }> {
  return distributionToSeries(dist, "Frequency", {
    Regular: "Régulier",
    Occasional: "Occasionnel",
    Rare: "Rare",
  });
}

/** Segmentation : âge, genre, statut relationnel */
export function segmentationAge(dist: TagDistribution): Array<{ name: string; value: number }> {
  return distributionToSeries(dist, "Age_Range");
}

export function segmentationGenre(dist: TagDistribution): Array<{ name: string; value: number }> {
  return distributionToSeries(dist, "Genre", { Femme: "Femme", Homme: "Homme" });
}

export function segmentationStatut(dist: TagDistribution): Array<{ name: string; value: number }> {
  return distributionToSeries(dist, "Client_Segment", {
    New: "New",
    Regular: "Regular",
    Loyal: "Loyal",
    VIP: "VIP",
    High_Value: "High Value",
  });
}

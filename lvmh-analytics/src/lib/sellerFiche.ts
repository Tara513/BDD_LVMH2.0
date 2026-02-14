/**
 * Logique métier fiche client vendeur.
 * Uniquement basé sur les tags réels (note_tags). Aucune donnée inventée.
 */

export type TagEntry = { tag: string; tag_family: string };
export type TagsByFamily = Record<string, string[]>;

export function tagsByFamily(entries: TagEntry[]): TagsByFamily {
  const out: TagsByFamily = {};
  for (const { tag_family, tag } of entries) {
    if (!out[tag_family]) out[tag_family] = [];
    if (!out[tag_family].includes(tag)) out[tag_family].push(tag);
  }
  return out;
}

/** Retourne le tag le plus fréquent dans une famille (premier rencontré si égalité). */
export function mostFrequentTag(entries: TagEntry[], family: string): string | null {
  const ofFamily = entries.filter((e) => e.tag_family === family);
  if (ofFamily.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const e of ofFamily) {
    counts[e.tag] = (counts[e.tag] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

/**
 * Recommandations basées uniquement sur des règles conditionnelles (tags réels).
 * Aucune IA, aucune donnée inventée.
 */
export function getRecommendations(tagsByFamily: TagsByFamily): string[] {
  const recs: string[] = [];
  const segment = tagsByFamily["Client_Segment"] ?? [];
  const budget = tagsByFamily["Budget_Segment"] ?? [];
  const motivations = tagsByFamily["Motivations"] ?? [];
  const urgence = tagsByFamily["Urgence"] ?? [];

  if ((segment.includes("VIP") || segment.includes("High_Value")) && budget.includes("VIC")) {
    recs.push("Proposition pièce iconique");
  }
  if (motivations.includes("Cadeau") && motivations.includes("Anniversaire")) {
    recs.push("Proposer article signature cadeau");
  }
  if (urgence.includes("Urgent")) {
    recs.push("Prioriser disponibilité immédiate");
  }
  if ((segment.includes("Loyal") || segment.includes("Regular")) && (tagsByFamily["Style"] ?? []).includes("Classic")) {
    recs.push("Proposer nouveautés de la collection classique");
  }
  if (motivations.includes("Voyage")) {
    recs.push("Orienter vers gamme voyage et bagagerie");
  }
  if (segment.includes("New") && budget.includes("Premium")) {
    recs.push("Accueillir et présenter l’univers de la maison");
  }
  if (motivations.includes("Investissement")) {
    recs.push("Mettre en avant pièces à forte valeur de revente");
  }
  if ((tagsByFamily["Timing"] ?? []).includes("> 6 mois")) {
    recs.push("Rester en contact pour rappel en amont de l’échéance");
  }

  return recs;
}

/** Groupes pour l’accordéon « Tags détaillés » (étiquettes d’affichage). */
export const TAG_GROUP_LABELS: Record<string, string> = {
  Genre: "Identity",
  Age_Range: "Identity",
  Client_Segment: "Relation",
  Frequency: "Relation",
  Motivations: "Projet d’achat",
  Budget_Segment: "Budget & Timing",
  Timing: "Budget & Timing",
  Urgence: "Budget & Timing",
  Produits: "Produits",
  Style: "Style & préférences",
  Matières: "Style & préférences",
};

export function getTagGroupsForAccordion(tagsByFamily: TagsByFamily): { groupLabel: string; families: string[] }[] {
  const groupToFamilies: Record<string, string[]> = {};
  for (const family of Object.keys(tagsByFamily)) {
    const label = TAG_GROUP_LABELS[family] ?? "Autres";
    if (!groupToFamilies[label]) groupToFamilies[label] = [];
    groupToFamilies[label].push(family);
  }
  const order = [
    "Identity",
    "Relation",
    "Projet d’achat",
    "Budget & Timing",
    "Produits",
    "Style & préférences",
    "Autres",
  ];
  return order
    .filter((g) => groupToFamilies[g]?.length)
    .map((groupLabel) => ({ groupLabel, families: groupToFamilies[groupLabel] }));
}

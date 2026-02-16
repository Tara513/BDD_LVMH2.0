/**
 * Suggestions retail Assistant – strictement basées sur les tags extraits.
 * Produits, Matières, Motivations, Maison, Budget_Segment, Style.
 * Aucune donnée inventée.
 */

import type { TagsByFamily } from "@/lib/assistantRetail";

export type RetailSuggestions = {
  suggested_categories: string[];
  suggested_materials: string[];
  suggested_house: string[];
  business_angle: string | null;
};

/** Mapping Motivation → catégorie produit suggérée (taxonomie). */
const MOTIVATION_TO_PRODUCT: Record<string, string> = {
  Voyage: "Sac_Voyage",
  Professionnel: "Sac_Travail",
  Cadeau: "Sac_Main",
  Anniversaire: "Petite_Maroquinerie",
  Célébration: "Sac_Main",
  Investissement: "Sac_Main",
};

/** Angles business par Budget_Segment (tags uniquement). */
const BUDGET_ANGLE: Record<string, string> = {
  VIC: "Positionnement haute exclusivité.",
  Premium: "Positionnement premium.",
  Core: "Gamme cœur de marque.",
  Entry: "Entrée de gamme.",
};

/** Angles par Style (tags uniquement). */
const STYLE_ANGLE: Record<string, string> = {
  Classic: "Angle patrimoine classique.",
  Timeless: "Angle intemporel.",
  Trendy: "Angle tendance.",
};

/**
 * Génère les suggestions retail à partir des tags (Produits, Matières, Motivations, Maison, Budget_Segment, Style).
 */
export function getRetailSuggestions(byFamily: TagsByFamily): RetailSuggestions {
  const produits = byFamily["Produits"] ?? [];
  const matieres = byFamily["Matières"] ?? [];
  const motivations = byFamily["Motivations"] ?? [];
  const maison = byFamily["Maison"] ?? [];
  const budget = byFamily["Budget_Segment"] ?? [];
  const style = byFamily["Style"] ?? [];

  const suggested_categories = [...new Set(produits)];
  for (const m of motivations) {
    const cat = MOTIVATION_TO_PRODUCT[m];
    if (cat && !suggested_categories.includes(cat)) suggested_categories.push(cat);
  }

  const suggested_materials = [...matieres];
  const suggested_house = [...maison];

  const angleParts: string[] = [];
  if (budget.length > 0) {
    const b = budget[0];
    if (BUDGET_ANGLE[b]) angleParts.push(BUDGET_ANGLE[b]);
  }
  if (style.length > 0) {
    const s = style[0];
    if (STYLE_ANGLE[s]) angleParts.push(STYLE_ANGLE[s]);
  }
  if (maison.length > 0) {
    angleParts.push(`Prioriser maison(s) : ${maison.join(", ")}.`);
  }
  const business_angle = angleParts.length > 0 ? angleParts.join(" ") : null;

  return {
    suggested_categories,
    suggested_materials,
    suggested_house,
    business_angle,
  };
}

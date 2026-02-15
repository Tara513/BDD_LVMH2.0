/**
 * Assistant Retail : synthèse business, niveau de priorité, next best action.
 * Uniquement basé sur les tags réels (note_tags). Aucune donnée inventée.
 */

export type TagsByFamily = Record<string, string[]>;

export type SynthèseBusiness = {
  motivationPrincipale: string | null;
  sensibilitéBudget: string | null;
  urgenceDétectée: string | null;
  typeAchat: string | null;
  niveauPriorité: "High" | "Medium" | "Low" | null;
};

/** Synthèse dérivée uniquement des tags. */
export function getSynthèseBusiness(byFamily: TagsByFamily): SynthèseBusiness {
  const motivations = byFamily["Motivations"] ?? [];
  const budget = byFamily["Budget_Segment"] ?? [];
  const urgence = byFamily["Urgence"] ?? [];
  const segment = byFamily["Client_Segment"] ?? [];
  const timing = byFamily["Timing"] ?? [];

  const motivationPrincipale = motivations[0] ?? null;
  const sensibilitéBudget = budget[0] ?? null;
  const urgenceDétectée = urgence[0] ?? null;
  const typeAchat = motivations.length ? motivations.join(", ") : null;

  const niveauPriorité = getPriorityLevel(byFamily);

  return {
    motivationPrincipale,
    sensibilitéBudget,
    urgenceDétectée,
    typeAchat,
    niveauPriorité,
  };
}

/**
 * Client Priority Level basé uniquement sur les tags (règles fixes).
 * - VIP + Budget élevé (VIC/Premium) + Urgent → High
 * - Budget moyen (Core/Premium) + Fixed Date (Timing 1-3 mois ou Urgence Planned) → Medium
 * - Long-term (> 6 mois) ou reste → Low
 */
export function getPriorityLevel(byFamily: TagsByFamily): "High" | "Medium" | "Low" | null {
  const segment = byFamily["Client_Segment"] ?? [];
  const budget = byFamily["Budget_Segment"] ?? [];
  const urgence = byFamily["Urgence"] ?? [];
  const timing = byFamily["Timing"] ?? [];

  const isVip = segment.includes("VIP") || segment.includes("High_Value");
  const isHighBudget = budget.includes("VIC") || budget.includes("Premium");
  const isUrgent = urgence.includes("Urgent");
  const isLongTerm = timing.includes("> 6 mois");
  const isFixedDate = timing.includes("1-3 mois") || timing.includes("3-6 mois") || urgence.includes("Planned");
  const isMediumBudget = budget.includes("Core") || budget.includes("Premium");

  const hasRelevant = segment.length > 0 || budget.length > 0 || urgence.length > 0 || timing.length > 0;
  if (!hasRelevant) return null;
  if (isVip && isHighBudget && isUrgent) return "High";
  if (isMediumBudget && isFixedDate) return "Medium";
  return "Low";
}

/**
 * Next Best Action : règles conditionnelles uniquement (tags réels).
 */
export function getNextBestActions(byFamily: TagsByFamily): string[] {
  const actions: string[] = [];
  const motivations = byFamily["Motivations"] ?? [];
  const budget = byFamily["Budget_Segment"] ?? [];
  const urgence = byFamily["Urgence"] ?? [];

  if (motivations.includes("Cadeau") && motivations.includes("Anniversaire")) {
    actions.push("Proposer article signature + emballage premium");
  }
  if (motivations.includes("Investissement") && budget.includes("VIC")) {
    actions.push("Proposer pièce iconique ou édition limitée");
  }
  if (urgence.includes("Urgent")) {
    actions.push("Vérifier stock immédiat");
  }
  if (motivations.includes("Voyage")) {
    actions.push("Orienter vers gamme voyage et bagagerie");
  }
  if ((byFamily["Client_Segment"] ?? []).includes("New")) {
    actions.push("Accueillir et présenter l’univers de la maison");
  }
  if (motivations.includes("Célébration")) {
    actions.push("Proposer cadeau de célébration signature");
  }

  return actions;
}

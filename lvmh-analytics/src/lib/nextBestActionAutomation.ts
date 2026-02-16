/**
 * Next Best Action – automatisation business.
 * Génère priority_level, activation_type et justification à partir des tags uniquement.
 * Aucune donnée inventée, taxonomie existante uniquement.
 */

export type TagsByFamily = Record<string, string[]>;

export type PriorityLevel = "High" | "Medium" | "Low";

export type ActivationType =
  | "Follow-Up"
  | "Appointment"
  | "Product Recommendation"
  | "Event Invitation"
  | "Immediate Follow-Up"
  | "Re-engagement Action";

export type AutomationRecommendation = {
  priority_level: PriorityLevel;
  activation_type: ActivationType;
  justification: string;
};

/** Règles de priorité (évaluées dans l'ordre, première correspondance gagnante). */
const PRIORITY_RULES: Array<{
  condition: (by: TagsByFamily) => boolean;
  level: PriorityLevel;
  reason: (by: TagsByFamily) => string;
}> = [
  {
    condition: (by) => {
      const segment = by["Client_Segment"] ?? [];
      const budget = by["Budget_Segment"] ?? [];
      const urgence = by["Urgence"] ?? [];
      const isVip = segment.includes("VIP") || segment.includes("High_Value");
      const isHighBudget = budget.includes("VIC") || budget.includes("Premium");
      return isVip && (isHighBudget || urgence.includes("Urgent"));
    },
    level: "High",
    reason: (by) => {
      const parts = [];
      const s = by["Client_Segment"] ?? [];
      const b = by["Budget_Segment"] ?? [];
      const u = by["Urgence"] ?? [];
      if (s.includes("VIP") || s.includes("High_Value")) parts.push("segment VIP/High Value");
      if (b.includes("VIC") || b.includes("Premium")) parts.push("budget élevé");
      if (u.includes("Urgent")) parts.push("urgence");
      return parts.length ? parts.join(", ") : "Client prioritaire";
    },
  },
  {
    condition: (by) => (by["Urgence"] ?? []).includes("Urgent"),
    level: "High",
    reason: () => "Urgence détectée",
  },
  {
    condition: (by) => {
      const segment = by["Client_Segment"] ?? [];
      return segment.includes("VIP") || segment.includes("High_Value");
    },
    level: "High",
    reason: () => "Client_Segment VIP ou High_Value",
  },
  {
    condition: (by) => {
      const budget = by["Budget_Segment"] ?? [];
      const timing = by["Timing"] ?? [];
      const urgence = by["Urgence"] ?? [];
      const isMedium = budget.includes("Core") || budget.includes("Premium");
      const fixedDate =
        timing.includes("1-3 mois") ||
        timing.includes("3-6 mois") ||
        (urgence ?? []).includes("Planned");
      return isMedium && fixedDate;
    },
    level: "Medium",
    reason: (by) => {
      const b = by["Budget_Segment"] ?? [];
      const t = by["Timing"] ?? [];
      const parts = [];
      if (b.length) parts.push(`Budget: ${b.join(", ")}`);
      if (t.length) parts.push(`Timing: ${t.join(", ")}`);
      return parts.length ? parts.join("; ") : "Projet à date fixe";
    },
  },
  {
    condition: (by) => {
      const hasAny =
        (by["Budget_Segment"] ?? []).length > 0 ||
        (by["Client_Segment"] ?? []).length > 0 ||
        (by["Urgence"] ?? []).length > 0 ||
        (by["Timing"] ?? []).length > 0 ||
        (by["Motivations"] ?? []).length > 0 ||
        (by["Frequency"] ?? []).length > 0;
      return hasAny;
    },
    level: "Low",
    reason: (by) => {
      const parts: string[] = [];
      if ((by["Timing"] ?? []).includes("> 6 mois")) parts.push("projet long terme");
      const tags = [
        ...(by["Budget_Segment"] ?? []),
        ...(by["Motivations"] ?? []),
        ...(by["Client_Segment"] ?? []),
      ];
      if (tags.length) parts.push(`tags: ${tags.slice(0, 3).join(", ")}`);
      return parts.length ? parts.join("; ") : "Tags insuffisants";
    },
  },
];

/** Règles d'activation (évaluées dans l'ordre). */
const ACTIVATION_RULES: Array<{
  condition: (by: TagsByFamily) => boolean;
  activation: ActivationType;
  label: string;
}> = [
  {
    condition: (by) => (by["Urgence"] ?? []).includes("Urgent"),
    activation: "Immediate Follow-Up",
    label: "Urgence Urgent",
  },
  {
    condition: (by) => {
      const s = by["Client_Segment"] ?? [];
      return s.includes("VIP") || s.includes("High_Value");
    },
    activation: "Appointment",
    label: "Client_Segment VIP ou High_Value",
  },
  {
    condition: (by) => (by["Motivations"] ?? []).includes("Investissement"),
    activation: "Product Recommendation",
    label: "Motivation Investissement — pièce iconique",
  },
  {
    condition: (by) => {
      const freq = by["Frequency"] ?? [];
      const budget = by["Budget_Segment"] ?? [];
      return (
        freq.includes("Rare") &&
        (budget.includes("Premium") || budget.includes("VIC"))
      );
    },
    activation: "Re-engagement Action",
    label: "Frequency Rare + Budget_Segment Premium/VIC",
  },
  {
    condition: (by) => {
      const m = by["Motivations"] ?? [];
      return m.includes("Cadeau") || m.includes("Anniversaire") || m.includes("Célébration");
    },
    activation: "Event Invitation",
    label: "Motivation cadeau ou célébration",
  },
  {
    condition: (by) => (by["Motivations"] ?? []).includes("Voyage"),
    activation: "Product Recommendation",
    label: "Motivation Voyage — gamme voyage",
  },
  {
    condition: (by) => (by["Client_Segment"] ?? []).includes("New"),
    activation: "Follow-Up",
    label: "Nouveau client — suivi découverte",
  },
  {
    condition: () => true,
    activation: "Follow-Up",
    label: "Suivi standard",
  },
];

/**
 * Génère la recommandation Next Best Action à partir des tags.
 * Utilise uniquement les familles: Budget_Segment, Client_Segment, Frequency,
 * Motivations, Urgence, Timing, Maison, Produits (et autres présentes en base).
 */
export function getAutomationRecommendation(
  byFamily: TagsByFamily
): AutomationRecommendation {
  let priority_level: PriorityLevel = "Low";
  let priorityReason = "Tags insuffisants";

  for (const rule of PRIORITY_RULES) {
    if (rule.condition(byFamily)) {
      priority_level = rule.level;
      priorityReason = rule.reason(byFamily);
      break;
    }
  }

  let activation_type: ActivationType = "Follow-Up";
  let activationLabel = "Suivi standard";

  for (const rule of ACTIVATION_RULES) {
    if (rule.condition(byFamily)) {
      activation_type = rule.activation;
      activationLabel = rule.label;
      break;
    }
  }

  const justification = [priorityReason, activationLabel].join(". ").trim();
  return {
    priority_level,
    activation_type,
    justification: justification || "Recommandation basée sur les tags extraits.",
  };
}

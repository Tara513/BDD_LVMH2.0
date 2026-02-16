/**
 * Filtres fiches clients vendeur.
 * Uniquement basé sur les tags réels (note_tags). Aucune donnée inventée.
 */

export type FilterState = {
  searchId: string;
  /** Pour chaque famille, liste de tags sélectionnés (vide = pas de filtre). */
  byFamily: Record<string, string[]>;
  /** Filtre recommandation : priorité (High, Medium, Low). */
  recommendationPriority: string;
  /** Filtre recommandation : type d'activation. */
  recommendationActivation: string;
};

/** Options pour le filtre Priorité (recommandation). */
export const RECOMMENDATION_PRIORITY_OPTIONS = [
  { value: "", label: "Toutes" },
  { value: "High", label: "Haute" },
  { value: "Medium", label: "Moyenne" },
  { value: "Low", label: "Basse" },
] as const;

/** Options pour le filtre Activation (recommandation). */
export const RECOMMENDATION_ACTIVATION_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "Follow-Up", label: "Follow-Up" },
  { value: "Appointment", label: "Rendez-vous" },
  { value: "Product Recommendation", label: "Recommandation produit" },
  { value: "Event Invitation", label: "Invitation événement" },
  { value: "Immediate Follow-Up", label: "Suivi immédiat" },
  { value: "Re-engagement Action", label: "Ré-engagement" },
] as const;

/** Labels courts pour l'UI (familles et valeurs réelles). */
export const FILTER_LABELS: Record<string, string> = {
  Budget_Segment: "Budget",
  Motivations: "Type d'achat",
  Client_Segment: "Statut client",
  Frequency: "Fréquence",
  Style: "Style",
  Urgence: "Urgence",
};

/** Ordre d'affichage des filtres. */
export const PREFERRED_FILTER_ORDER = [
  "Budget_Segment",
  "Motivations",
  "Client_Segment",
  "Urgence",
  "Frequency",
  "Style",
];

/** Options par défaut pour filtres principaux (toujours affichés, même sans tags en base). */
export const DEFAULT_FILTER_OPTIONS: Record<string, string[]> = {
  Budget_Segment: ["Entry", "Core", "Premium", "VIC"],
  Motivations: [
    "Cadeau",
    "Anniversaire",
    "Voyage",
    "Investissement",
    "Professionnel",
    "Célébration",
  ],
};

/** Libellés optionnels pour certaines valeurs (sinon on affiche le tag tel quel). */
export const TAG_LABELS: Record<string, string> = {
  New: "New Client",
  Regular: "Regular Client",
  Loyal: "Loyal Client",
  VIP: "VIP",
  High_Value: "High Value",
  Occasional: "Occasional",
  Rare: "Rare",
  Cadeau: "Cadeau",
  Anniversaire: "Anniversaire",
  Voyage: "Voyage",
  Investissement: "Investissement",
  Professionnel: "Professionnel",
  Célébration: "Célébration",
  Urgent: "Urgent",
  Planned: "Planned",
  Classic: "Classic",
  Timeless: "Timeless",
  Trendy: "Trendy",
  Core: "Core",
  Premium: "Premium",
  VIC: "VIC (25k+)",
  High: "Haute",
  Medium: "Moyenne",
  Low: "Basse",
};

export function getTagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag;
}

/** Parse searchParams en FilterState. */
export function parseFilterState(searchParams: Record<string, string | string[] | undefined>): FilterState {
  const byFamily: Record<string, string[]> = {};
  const families = [
    "Budget_Segment",
    "Motivations",
    "Client_Segment",
    "Frequency",
    "Style",
    "Urgence",
  ];
  for (const family of families) {
    const v = searchParams[family];
    if (typeof v === "string" && v.trim()) {
      byFamily[family] = v.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(v) && v.length) {
      byFamily[family] = v.map((s) => String(s).trim()).filter(Boolean);
    }
  }
  const searchId = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const recommendationPriority =
    typeof searchParams.recommendation_priority === "string"
      ? searchParams.recommendation_priority.trim()
      : "";
  const recommendationActivation =
    typeof searchParams.recommendation_activation === "string"
      ? searchParams.recommendation_activation.trim()
      : "";
  return {
    searchId,
    byFamily,
    recommendationPriority,
    recommendationActivation,
  };
}

/** Construit l'URL des filtres (sans page). */
export function buildFilterQuery(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.searchId) params.set("q", state.searchId);
  for (const [family, tags] of Object.entries(state.byFamily)) {
    if (tags.length) params.set(family, tags.join(","));
  }
  if (state.recommendationPriority) params.set("recommendation_priority", state.recommendationPriority);
  if (state.recommendationActivation) params.set("recommendation_activation", state.recommendationActivation);
  return params.toString();
}

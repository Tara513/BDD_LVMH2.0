/**
 * Taxonomie LVMH Mode & Maroquinerie (alignée sur LVMHGlobalAnalytics / taxonomy_config.json).
 */

export const MAISONS = [
  "Louis Vuitton",
  "Christian Dior",
  "Celine",
  "Fendi",
  "Loro Piana",
  "Loewe",
  "Givenchy",
  "Berluti",
  "Kenzo",
  "Rimowa",
  "Marc Jacobs",
  "Moynat",
  "Patou",
  "Emilio Pucci",
] as const;

export const BUDGET_SEGMENTS = {
  description: "Segments de budget (€) - LVMHGlobalAnalytics",
  bins: [0, 2500, 7500, 15000, 1000000],
  labels: ["Entry", "Core", "Premium", "VIC"] as const,
};

export const taxonomy = {
  maisons: MAISONS,
  budget_segments: BUDGET_SEGMENTS,
  rules: {
    Motivations: {
      Anniversaire: ["anniversaire", "birthday", "cumpleaños", "compleanno", "geburtstag"],
      Professionnel: ["pro", "business", "travail", "work", "office", "chantier", "board"],
      Voyage: ["voyage", "travel", "vacances", "trip", "trek", "reisen", "viaje"],
      Cadeau: ["cadeau", "gift", "regalo", "present", "geschenk"],
      Célébration: ["diplôme", "graduation", "mariage", "wedding", "anniversary"],
    },
    Produits: {
      Sac_Main: ["sac", "bag", "bolso", "borsa", "handbag", "tasche"],
      Sac_Travail: ["briefcase", "sac pro", "sac travail", "borsa lavoro", "business-reise"],
      Sac_Voyage: ["weekend", "travel bag", "keepall", "valise", "reisen"],
      Petite_Maroquinerie: ["portefeuille", "wallet", "pochette", "card holder", "portafoglio"],
      Sneakers: ["sneakers", "chaussures", "shoes", "souliers", "schuhe"],
    },
  },
} as const;

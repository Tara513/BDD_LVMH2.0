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

/** Midpoints (€) pour calcul budget moyen à partir des tags Budget_Segment */
export const BUDGET_MIDPOINTS: Record<string, number> = {
  Entry: 1250,
  Core: 5000,
  Premium: 11250,
  VIC: 100000,
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
      Investissement: ["investissement", "investment", "pièce", "keeper", "long terme"],
    },
    Produits: {
      Sac_Main: ["sac", "bag", "bolso", "borsa", "handbag", "tasche"],
      Sac_Travail: ["briefcase", "sac pro", "sac travail", "borsa lavoro", "business-reise"],
      Sac_Voyage: ["weekend", "travel bag", "keepall", "valise", "reisen"],
      Petite_Maroquinerie: ["portefeuille", "wallet", "pochette", "card holder", "portafoglio"],
      Sneakers: ["sneakers", "chaussures", "shoes", "souliers", "schuhe"],
      Botte: ["botte", "boot", "bota", "stivali", "boots"],
      Escarpin: ["escarpin", "heel", "tacón", "tacco", "talon"],
    },
    Client_Segment: {
      VIP: ["vip", "very important", "v.i.p", "client privilégié", "top client"],
      High_Value: ["gros budget", "high value", "haut de gamme", "premium client", "big spender"],
      Loyal: ["fidèle", "loyal", "regular", "habitué", "depuis des années"],
      Regular: ["client régulier", "regular", "récurrent"],
      New: ["nouveau client", "new client", "première visite", "découverte"],
    },
    Budget_Segment: {
      Entry: ["entry", "entrée", "premier achat", "petit budget", "moins de 2500"],
      Core: ["core", "2500", "7500", "milieu de gamme"],
      Premium: ["premium", "15000", "haut de gamme", "luxe"],
      VIC: ["vic", "very important client", "très gros budget", "100000"],
    },
    Urgence: {
      Urgent: ["urgent", "asap", "rapide", "tout de suite", "immédiat", "ce week-end"],
      Planned: ["prévu", "planned", "plus tard", "pour plus tard", "réfléchir"],
    },
    Age_Range: {
      "18-25": ["18", "20", "jeune", "étudiant", "millennial"],
      "26-35": ["26", "30", "35", "trentaine"],
      "36-45": ["36", "40", "45", "quarantaine"],
      "46-55": ["46", "50", "55", "cinquantaine"],
      "56+": ["56", "60", "senior", "retraite"],
    },
    Genre: {
      Femme: ["madame", "femme", "woman", "she", "elle", "donna"],
      Homme: ["monsieur", "homme", "man", "he", "il", "uomo"],
    },
    Style: {
      Trendy: ["tendance", "trendy", "actuel", "mode", "nouveauté", "last"],
      Timeless: ["intemporel", "timeless", "classique moderne", "iconic"],
      Classic: ["classic", "classique", "traditionnel", "heritage"],
    },
    Frequency: {
      Regular: ["régulier", "regular", "souvent", "plusieurs fois", "chaque saison"],
      Occasional: ["occasionnel", "occasional", "de temps en temps", "quelques fois"],
      Rare: ["rare", "rarement", "première fois", "exceptionnel"],
    },
    Maison: {
      "Louis Vuitton": ["louis vuitton", "vuitton", "lv ", " lv", "louis-vuitton"],
      "Christian Dior": ["dior", "christian dior", "lady dior", "miss dior"],
      Celine: ["celine", "céline"],
      Fendi: ["fendi"],
      "Loro Piana": ["loro piana", "loropiana"],
      Loewe: ["loewe"],
      Givenchy: ["givenchy"],
      Berluti: ["berluti"],
      Kenzo: ["kenzo"],
      Rimowa: ["rimowa"],
      "Marc Jacobs": ["marc jacobs", "marcjacobs"],
      Moynat: ["moynat"],
      Patou: ["patou", "jean patou"],
      "Emilio Pucci": ["pucci", "emilio pucci"],
    },
  },
} as const;

export type TaxonomyTag = { tag: string; tag_family: string; confidence: number };

/**
 * Applique les règles de la taxonomie sur un texte (mot-clés).
 * Retourne les tags détectés avec famille et confiance (1.0 si règle, 0.8 si Mistral).
 */
export function applyTaxonomyRules(noteText: string): TaxonomyTag[] {
  const text = noteText.toLowerCase();
  const tags: TaxonomyTag[] = [];
  const seen = new Set<string>();

  for (const [family, categories] of Object.entries(taxonomy.rules)) {
    for (const [label, keywords] of Object.entries(categories)) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          const key = `${family}:${label}`;
          if (!seen.has(key)) {
            seen.add(key);
            tags.push({ tag: label, tag_family: family, confidence: 1 });
          }
          break;
        }
      }
    }
  }
  return tags;
}

export function getMaisons(): readonly string[] {
  return taxonomy.maisons;
}

import type { ClientSummary, ClientDetail } from "@/types/client";
import type { Dataset } from "@/types/dataset";

export const mockDatasets: Dataset[] = [
  { id: "ds1", name: "LVMH_Realistic_Merged_CA001-100", row_count: 100, status: "analyzed", uploaded_at: null },
  { id: "ds2", name: "LVMH_Notes_CA101-400", row_count: 300, status: "tagged", uploaded_at: null },
];

export const mockClientSummaries: ClientSummary[] = [
  {
    id: "client-1",
    externalId: "CA_001",
    purchaseProject: "Cadeau anniversaire mari 50 ans",
    budgetRange: "3–4K€",
    tags: ["Anniversaire", "Sac_Voyage", "Client_VIP_Fidele"],
    timing: "Fin mars",
    language: "FR",
  },
  {
    id: "client-2",
    externalId: "CA_102",
    purchaseProject: "Travel bag Asie pour banque d’investissement",
    budgetRange: "≈5K€",
    tags: ["Professionnel", "Voyage", "Sac_Voyage"],
    timing: "Fin du mois",
    language: "EN",
  },
];

export const mockClientDetails: ClientDetail[] = [
  {
    id: "client-1",
    externalId: "CA_001",
    purchaseProject: "Cadeau anniversaire mari 50 ans",
    budgetRange: "3–4K€",
    tags: ["Anniversaire", "Sac_Voyage", "Client_VIP_Fidele"],
    timing: "Fin mars",
    language: "FR",
    noteText:
      "Rendez-vous Mme Laurent, avocate affaires 45 ans, cliente occasionnelle. Cherche cadeau anniversaire mari 50 ans fin mars...",
    maison: "Louis Vuitton",
    motivations: ["Anniversaire", "Cadeau"],
    products: ["Sac_Voyage", "Petite_Maroquinerie"],
    profileTags: ["Profession_Finance_Legal", "Client_VIP_Fidele"],
    styleTags: ["Voyage_Frequent", "Famille"],
    nextBestAction:
      "Proposer une sélection de sacs de voyage en cuir cognac + portefeuille coordonné, relance personnalisée mi-février.",
    metadata: {
      "Budget estimé": "3–4K€",
      Timing: "Anniversaire fin mars",
      Langue: "FR",
      "Canal relationnel": "Boutique Paris",
    },
  },
];


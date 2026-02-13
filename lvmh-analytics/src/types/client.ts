export type ClientSummary = {
  id: string;
  externalId: string;
  purchaseProject: string;
  budgetRange: string;
  tags: string[];
  timing: string;
  language: string;
};

export type ClientDetail = ClientSummary & {
  noteText: string;
  maison: string;
  motivations: string[];
  products: string[];
  profileTags: string[];
  styleTags: string[];
  nextBestAction: string;
  metadata: Record<string, string>;
};


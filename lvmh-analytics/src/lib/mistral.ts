/**
 * Client Mistral pour tagging automatique des notes.
 * Utiliser côté serveur uniquement (API route).
 */

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-small-latest";

export type MistralTag = { tag: string; tag_family: string; confidence: number };

const TAGGING_SYSTEM = `Tu es un assistant qui extrait des tags structurés à partir de notes de conversation client (luxe, maroquinerie).
Réponds UNIQUEMENT par un JSON valide, sans texte avant ou après, avec la forme :
{"tags": [{"tag": "NomTag", "tag_family": "Famille", "confidence": 0.9}]}
Familles et valeurs possibles (ne sors que celles que tu peux déduire du texte) :
- Motivations : Anniversaire, Voyage, Cadeau, Professionnel, Célébration, Investissement
- Produits : Sac_Main, Sac_Travail, Sac_Voyage, Petite_Maroquinerie, Sneakers, Botte, Escarpin
- Client_Segment : VIP, High_Value, Loyal, Regular, New (si le texte évoque le type de client)
- Budget_Segment : Entry, Core, Premium, VIC (si budget ou montant évoqué)
- Urgence : Urgent, Planned (si urgence d'achat)
- Age_Range : 18-25, 26-35, 36-45, 46-55, 56+ (si âge ou génération évoquée)
- Genre : Femme, Homme (si genre identifiable)
- Style : Trendy, Timeless, Classic (si préférence style évoquée)
- Frequency : Regular, Occasional, Rare (si fréquence d'achat évoquée)
- Maison : Louis Vuitton, Christian Dior, Celine, Fendi, Loro Piana, Loewe, Givenchy, Berluti, Kenzo, Rimowa, Marc Jacobs, Moynat, Patou, Emilio Pucci (marque / maison citée dans la note)
Ne invente pas de tags hors de ces listes. confidence entre 0 et 1.`;

export async function tagNoteWithMistral(
  noteText: string,
  apiKey: string
): Promise<MistralTag[]> {
  if (!apiKey) throw new Error("MISTRAL_API_KEY is required");

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: TAGGING_SYSTEM },
      {
        role: "user",
        content: `Extrais les tags pour cette note (réponds en JSON uniquement):\n\n${noteText.slice(0, 4000)}`,
      },
    ],
    temperature: 0.2,
    max_tokens: 512,
  };

  const res = await fetch(MISTRAL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return [];

  try {
    const parsed = JSON.parse(content) as { tags?: MistralTag[] };
    const tags = parsed.tags ?? [];
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

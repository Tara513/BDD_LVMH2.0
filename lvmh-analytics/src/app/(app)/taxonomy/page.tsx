"use client";

import { useMemo, useState } from "react";
import { taxonomy } from "@/lib/taxonomy";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { TagBadge } from "@/components/ui/tag-badge";

export default function TaxonomyPage() {
  const [search, setSearch] = useState("");

  const filteredRules = useMemo(() => {
    if (!search.trim()) return taxonomy.rules;
    const q = search.toLowerCase();
    const out: typeof taxonomy.rules = {};

    for (const [category, tags] of Object.entries(taxonomy.rules)) {
      const catResult: Record<string, string[]> = {};
      for (const [tagName, keywords] of Object.entries(tags)) {
        const matchTag = tagName.toLowerCase().includes(q);
        const matchKw = keywords.some((kw) => kw.toLowerCase().includes(q));
        if (matchTag || matchKw) {
          catResult[tagName] = keywords;
        }
      }
      if (Object.keys(catResult).length > 0) {
        out[category] = catResult;
      }
    }
    return out;
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Taxonomy</h1>

      <Card>
        <CardHeader
          title="Recherche dans la taxonomie"
          description="Visualisation hiérarchique des motivations, produits, profils et styles de vie."
        />
        <CardBody>
          <input
            type="text"
            placeholder="Rechercher un tag ou un mot-clé…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-600"
          />
        </CardBody>
      </Card>

      {Object.entries(filteredRules).map(([category, tags]) => (
        <Card key={category}>
          <CardHeader title={category} />
          <CardBody>
            {Object.entries(tags).map(([tagName, keywords]) => (
              <details
                key={tagName}
                className="group border-b border-neutral-900 py-2 last:border-b-0 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between text-xs text-neutral-100">
                  <span>{tagName}</span>
                  <span className="text-[10px] text-neutral-500 transition group-open:rotate-90">›</span>
                </summary>
                <div className="mt-2">
                  <div className="mb-1 text-[10px] text-neutral-500">Mots-clés reconnus :</div>
                  <div>
                    {keywords.map((kw) => (
                      <TagBadge key={kw} label={kw} />
                    ))}
                  </div>
                </div>
              </details>
            ))}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}


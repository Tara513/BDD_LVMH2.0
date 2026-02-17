"use client";

import { useMemo, useState } from "react";
import { taxonomy } from "@/lib/taxonomy";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { TagBadge } from "@/components/ui/tag-badge";

/** Liste plate de tous les tags (famille + nom) pour affichage "Tous les tags" */
function getAllTagsList(): Array<{ family: string; tag: string }> {
  const list: Array<{ family: string; tag: string }> = [];
  for (const [family, tags] of Object.entries(taxonomy.rules)) {
    for (const tag of Object.keys(tags)) {
      list.push({ family, tag });
    }
  }
  return list.sort((a, b) => a.family.localeCompare(b.family) || a.tag.localeCompare(b.tag));
}

export default function AdminTaxonomyPage() {
  const [search, setSearch] = useState("");

  const allTags = useMemo(() => getAllTagsList(), []);

  const filteredRules = useMemo(() => {
    if (!search.trim()) return taxonomy.rules;
    const q = search.toLowerCase();
    const out: Record<string, Record<string, string[]>> = {};

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

  const filteredAllTags = useMemo(() => {
    if (!search.trim()) return allTags;
    const q = search.toLowerCase();
    return allTags.filter(
      (t) =>
        t.family.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
    );
  }, [allTags, search]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Taxonomie & Tags</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Liste complète des tags et règles de la taxonomie LVMH (motivations, produits, segments, etc.).
        </p>
      </div>

      <input
        type="text"
        placeholder="Rechercher un tag, une famille ou un mot-clé…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
      />

      {/* Section : Tous les tags */}
      <Card>
        <CardHeader
          title="Tous les tags"
          description={`${filteredAllTags.length} tag(s) — famille · nom du tag`}
        />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {filteredAllTags.length === 0 ? (
              <span className="text-xs text-neutral-500">Aucun tag ne correspond à la recherche.</span>
            ) : (
              filteredAllTags.map(({ family, tag }) => (
                <span
                  key={`${family}-${tag}`}
                  className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200"
                >
                  <span className="text-neutral-500">{family}</span>
                  <span className="mx-1.5 text-neutral-600">·</span>
                  <span className="font-medium">{tag}</span>
                </span>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Section : Taxonomie détaillée (familles → tags → mots-clés) */}
      <div>
        <h2 className="mb-4 text-lg font-medium text-neutral-200">Taxonomie détaillée</h2>
        <div className="flex flex-col gap-6">
          {Object.entries(filteredRules).map(([category, tags]) => (
            <Card key={category}>
              <CardHeader title={category} />
              <CardBody>
                {Object.entries(tags).map(([tagName, keywords]) => (
                  <details
                    key={tagName}
                    className="group border-b border-neutral-900 py-3 last:border-b-0 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between text-sm text-neutral-100">
                      <span className="font-medium">{tagName}</span>
                      <span className="text-[10px] text-neutral-500 transition group-open:rotate-90">›</span>
                    </summary>
                    <div className="mt-3">
                      <div className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
                        Mots-clés reconnus
                      </div>
                      <div className="flex flex-wrap gap-1.5">
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
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState, useEffect } from "react";
import {
  parseFilterState,
  buildFilterQuery,
  FILTER_LABELS,
  PREFERRED_FILTER_ORDER,
  getTagLabel,
  RECOMMENDATION_PRIORITY_OPTIONS,
  RECOMMENDATION_ACTIVATION_OPTIONS,
  type FilterState,
} from "@/lib/sellerFilters";

type Props = {
  /** Familles présentes en base avec leurs valeurs (uniquement données réelles). */
  availableOptions: Record<string, string[]>;
};

export function SellerFilterBar({ availableOptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const state = parseFilterState(Object.fromEntries(searchParams.entries()));
  const [searchInput, setSearchInput] = useState(state.searchId);
  useEffect(() => setSearchInput(state.searchId), [state.searchId]);

  const updateUrl = useCallback(
    (newState: FilterState, page = 1) => {
      const q = buildFilterQuery(newState);
      const url = q ? `/dashboard/seller?${q}&page=${page}` : `/dashboard/seller?page=${page}`;
      startTransition(() => {
        router.push(url);
      });
    },
    [router]
  );

  const setFamily = useCallback(
    (family: string, tags: string[]) => {
      const byFamily = { ...state.byFamily };
      if (tags.length === 0) delete byFamily[family];
      else byFamily[family] = tags;
      updateUrl({ ...state, byFamily });
    },
    [state, updateUrl]
  );

  const setSearchId = (value: string) => {
    updateUrl({ ...state, searchId: value });
  };

  const reset = () => {
    router.push("/dashboard/seller?page=1");
  };

  const hasActiveFilters =
    state.searchId ||
    Object.values(state.byFamily).some((arr) => arr.length > 0) ||
    !!state.recommendationPriority ||
    !!state.recommendationActivation;

  const families = Object.keys(availableOptions)
    .filter((f) => FILTER_LABELS[f] && availableOptions[f].length > 0)
    .sort(
      (a, b) =>
        (PREFERRED_FILTER_ORDER.indexOf(a) === -1 ? 999 : PREFERRED_FILTER_ORDER.indexOf(a)) -
        (PREFERRED_FILTER_ORDER.indexOf(b) === -1 ? 999 : PREFERRED_FILTER_ORDER.indexOf(b))
    );

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Recherche par ID client */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-wider text-neutral-500">
            ID client
          </label>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => setSearchId(searchInput)}
            onKeyDown={(e) => e.key === "Enter" && setSearchId(searchInput)}
            placeholder="ex. CA_065"
            className="w-32 rounded-lg border border-neutral-700/80 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
          />
        </div>

        {/* Filtres recommandation */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">
            Reco. priorité
          </span>
          <select
            value={state.recommendationPriority ?? ""}
            onChange={(e) =>
              updateUrl({ ...state, recommendationPriority: e.target.value })
            }
            className="rounded-lg border border-neutral-700/80 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-neutral-600 focus:outline-none"
          >
            {RECOMMENDATION_PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">
            Reco. activation
          </span>
          <select
            value={state.recommendationActivation ?? ""}
            onChange={(e) =>
              updateUrl({ ...state, recommendationActivation: e.target.value })
            }
            className="rounded-lg border border-neutral-700/80 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-neutral-600 focus:outline-none min-w-[11rem]"
          >
            {RECOMMENDATION_ACTIVATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtres par famille (uniquement si la famille existe en base) */}
        {families.map((family) => (
          <div key={family} className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">
              {FILTER_LABELS[family]}
            </span>
            <select
              value={state.byFamily[family]?.[0] ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setFamily(family, v ? [v] : []);
              }}
              className="rounded-lg border border-neutral-700/80 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-neutral-600 focus:outline-none"
            >
              <option value="">Tous</option>
              {availableOptions[family].map((tag) => (
                <option key={tag} value={tag}>
                  {getTagLabel(tag)}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-neutral-700/80 px-2.5 py-1.5 text-[11px] text-neutral-500 transition-colors hover:border-neutral-600 hover:text-neutral-300"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {isPending && (
        <p className="mt-2 text-[10px] text-neutral-500">Mise à jour…</p>
      )}
    </div>
  );
}

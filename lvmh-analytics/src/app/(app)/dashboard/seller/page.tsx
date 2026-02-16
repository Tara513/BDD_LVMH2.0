import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getMockAuthFromRequest } from "@/lib/mock-auth";
import { FicheCard } from "@/components/seller/FicheCard";
import { SellerFilterBar } from "@/components/seller/SellerFilterBar";
import {
  parseFilterState,
  buildFilterQuery,
  FILTER_LABELS,
  DEFAULT_FILTER_OPTIONS,
} from "@/lib/sellerFilters";
import { getAutomationRecommendation } from "@/lib/nextBestActionAutomation";
import type { TagsByFamily } from "@/lib/nextBestActionAutomation";

const PAGE_SIZE = 24;

type NoteRow = {
  id: string;
  external_id: string | null;
  note_text: string;
  language: string | null;
  created_at: string;
};

type TagRow = { note_id: string; tag: string; tag_family: string };

/** Récupère les note_ids qui ont tous les tags requis (intersection par famille). */
async function getFilteredNoteIds(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase-server").createClient>>,
  byFamily: Record<string, string[]>
): Promise<string[] | null> {
  const entries = Object.entries(byFamily).filter(([, tags]) => tags.length > 0);
  if (entries.length === 0) return null;

  let ids: string[] | null = null;
  for (const [family, tags] of entries) {
    const { data } = await supabase
      .from("note_tags")
      .select("note_id")
      .eq("tag_family", family)
      .in("tag", tags);
    const set = new Set((data ?? []).map((r) => r.note_id));
    if (ids === null) ids = [...set];
    else ids = ids.filter((id) => set.has(id));
  }
  return ids;
}

/** Récupère les note_ids dont la recommandation correspond à priorité et/ou activation.
 * Utilise la table automation_recommendations, puis complète avec les fiches qui ont des tags
 * mais pas encore de ligne (recommandation calculée à la volée).
 */
async function getNoteIdsByRecommendation(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase-server").createClient>>,
  priority: string,
  activation: string
): Promise<string[] | null> {
  const p = priority?.trim() || "";
  const a = activation?.trim() || "";
  if (!p && !a) return null;

  const resultSet = new Set<string>();

  let query = supabase.from("automation_recommendations").select("note_id");
  if (p) query = query.eq("priority_level", p);
  if (a) query = query.eq("activation_type", a);
  const { data: tableRows } = await query;
  for (const r of tableRows ?? []) {
    resultSet.add((r as { note_id: string }).note_id);
  }

  const { data: tagRows } = await supabase
    .from("note_tags")
    .select("note_id, tag, tag_family");
  const byNoteId: Record<string, TagsByFamily> = {};
  for (const row of (tagRows ?? []) as { note_id: string; tag: string; tag_family: string }[]) {
    const nid = row.note_id;
    if (!byNoteId[nid]) byNoteId[nid] = {};
    if (!byNoteId[nid][row.tag_family]) byNoteId[nid][row.tag_family] = [];
    if (!byNoteId[nid][row.tag_family].includes(row.tag)) byNoteId[nid][row.tag_family].push(row.tag);
  }
  for (const [noteId, byFamily] of Object.entries(byNoteId)) {
    const rec = getAutomationRecommendation(byFamily);
    const matchPriority = !p || rec.priority_level === p;
    const matchActivation = !a || rec.activation_type === a;
    if (matchPriority && matchActivation) resultSet.add(noteId);
  }

  const ids = Array.from(resultSet);
  return ids.length > 0 ? ids : (p || a ? [] : null);
}

/** Options de filtres : familles et valeurs réellement présentes en base. */
async function getAvailableFilterOptions(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase-server").createClient>>
): Promise<Record<string, string[]>> {
  const { data } = await supabase.from("note_tags").select("tag_family, tag");
  const map: Record<string, Set<string>> = {};
  for (const row of data ?? []) {
    const r = row as { tag_family: string; tag: string };
    if (!FILTER_LABELS[r.tag_family]) continue;
    if (!map[r.tag_family]) map[r.tag_family] = new Set();
    map[r.tag_family].add(r.tag);
  }
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) {
    out[k] = Array.from(v).sort();
  }
  // Toujours afficher les 4 filtres principaux avec options par défaut (taxonomie)
  for (const [family, defaultOpts] of Object.entries(DEFAULT_FILTER_OPTIONS)) {
    const existing = out[family] ?? [];
    out[family] = Array.from(new Set([...existing, ...defaultOpts])).sort();
  }
  return out;
}

export default async function SellerFichesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const cookieStore = await cookies();
  const mockRole = getMockAuthFromRequest(
    cookieStore.get("lvmh_mock_auth")?.value,
    cookieStore.get("lvmh_mock_role")?.value
  );

  const supabase = await createClient();

  if (!mockRole) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
      redirect("/login");
    }
  }

  const params = await searchParams;
  const filterState = parseFilterState(params);
  const page = Math.max(1, parseInt(String(params.page || "1"), 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const [availableOptions, tagFilteredIds, recommendationFilteredIds] = await Promise.all([
    getAvailableFilterOptions(supabase),
    getFilteredNoteIds(supabase, filterState.byFamily),
    getNoteIdsByRecommendation(
      supabase,
      filterState.recommendationPriority ?? "",
      filterState.recommendationActivation ?? ""
    ),
  ]);

  let filteredIds: string[] | null = null;
  if (tagFilteredIds !== null && recommendationFilteredIds !== null) {
    const set = new Set(recommendationFilteredIds);
    filteredIds = tagFilteredIds.filter((id) => set.has(id));
  } else if (tagFilteredIds !== null) {
    filteredIds = tagFilteredIds;
  } else if (recommendationFilteredIds !== null) {
    filteredIds = recommendationFilteredIds;
  }

  let noteList: NoteRow[];
  let total: number;

  if (filteredIds !== null || filterState.searchId) {
    if (filteredIds !== null && filteredIds.length === 0) {
      noteList = [];
      total = 0;
    } else if (filteredIds === null && filterState.searchId) {
      const { data: pageData, count } = await supabase
        .from("client_notes")
        .select("id, external_id, note_text, language, created_at", { count: "exact" })
        .ilike("external_id", `%${filterState.searchId}%`)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      noteList = (pageData ?? []) as NoteRow[];
      total = count ?? 0;
    } else {
      let baseQuery = supabase
        .from("client_notes")
        .select("id, external_id, note_text, language, created_at")
        .order("created_at", { ascending: false });

      if (filteredIds !== null) {
        baseQuery = baseQuery.in("id", filteredIds);
      }
      if (filterState.searchId) {
        baseQuery = baseQuery.ilike("external_id", `%${filterState.searchId}%`);
      }

      const { data: all } = await baseQuery;
      const sorted = (all ?? []) as NoteRow[];
      total = sorted.length;
      noteList = sorted.slice(from, from + PAGE_SIZE);
    }
  } else {
    const { data: notes, error: notesError } = await supabase
      .from("client_notes")
      .select("id, external_id, note_text, language, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (notesError) {
      return (
        <div className="mx-auto max-w-6xl px-6 py-8">
          <p className="text-sm text-red-400">Erreur lors du chargement des fiches.</p>
        </div>
      );
    }

    noteList = (notes ?? []) as NoteRow[];
    const { count: totalCount } = await supabase
      .from("client_notes")
      .select("id", { count: "exact", head: true });
    total = totalCount ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const noteIds = noteList.map((n) => n.id);

  let tagsByNoteId: Record<string, TagRow[]> = {};
  if (noteIds.length > 0) {
    const { data: tags } = await supabase
      .from("note_tags")
      .select("note_id, tag, tag_family")
      .in("note_id", noteIds);
    const tagList = (tags ?? []) as TagRow[];
    for (const t of tagList) {
      if (!tagsByNoteId[t.note_id]) tagsByNoteId[t.note_id] = [];
      tagsByNoteId[t.note_id].push(t);
    }
  }

  const filterQuery = buildFilterQuery(filterState);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Fiches clients</h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          {total} fiche{total !== 1 ? "s" : ""} {filterQuery ? "correspondant aux filtres" : "au total"}
        </p>
      </div>

      <div className="mb-8">
        <SellerFilterBar availableOptions={availableOptions} />
      </div>

      {noteList.length === 0 ? (
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 px-6 py-12 text-center">
          <p className="text-sm text-neutral-400">
            Aucune fiche ne correspond aux critères.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {noteList.map((note) => {
            const tags = tagsByNoteId[note.id] ?? [];
            const byFamily = tags.reduce<Record<string, string[]>>((acc, t) => {
              if (!acc[t.tag_family]) acc[t.tag_family] = [];
              acc[t.tag_family].push(t.tag);
              return acc;
            }, {});

            return (
              <FicheCard
                key={note.id}
                noteId={note.id}
                externalId={note.external_id}
                noteText={note.note_text}
                language={note.language}
                tagsByFamily={byFamily}
              />
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={filterQuery ? `/dashboard/seller?${filterQuery}&page=${page - 1}` : `/dashboard/seller?page=${page - 1}`}
              className="rounded-lg border border-neutral-700/80 bg-neutral-900/50 px-4 py-2.5 text-xs text-neutral-400 transition-colors duration-300 ease-out hover:border-neutral-600 hover:bg-neutral-800/60 hover:text-neutral-200"
            >
              Précédent
            </Link>
          )}
          <span className="min-w-[6rem] text-center text-xs text-neutral-500">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={filterQuery ? `/dashboard/seller?${filterQuery}&page=${page + 1}` : `/dashboard/seller?page=${page + 1}`}
              className="rounded-lg border border-neutral-700/80 bg-neutral-900/50 px-4 py-2.5 text-xs text-neutral-400 transition-colors duration-300 ease-out hover:border-neutral-600 hover:bg-neutral-800/60 hover:text-neutral-200"
            >
              Suivant
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

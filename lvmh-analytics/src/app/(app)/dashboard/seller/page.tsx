import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getMockAuthFromRequest } from "@/lib/mock-auth";
import { FicheCard } from "@/components/seller/FicheCard";

const PAGE_SIZE = 24;

type NoteRow = {
  id: string;
  external_id: string | null;
  note_text: string;
  language: string | null;
  created_at: string;
};

type TagRow = { note_id: string; tag: string; tag_family: string };

export default async function SellerFichesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
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

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(String(pageParam || "1"), 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: notes, error: notesError } = await supabase
    .from("client_notes")
    .select("id, external_id, note_text, language, created_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (notesError) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-red-400">Erreur lors du chargement des fiches.</p>
      </div>
    );
  }

  const noteList = (notes || []) as NoteRow[];
  const noteIds = noteList.map((n) => n.id);

  let tagsByNoteId: Record<string, TagRow[]> = {};
  if (noteIds.length > 0) {
    const { data: tags } = await supabase
      .from("note_tags")
      .select("note_id, tag, tag_family")
      .in("note_id", noteIds);
    const tagList = (tags || []) as TagRow[];
    for (const t of tagList) {
      if (!tagsByNoteId[t.note_id]) tagsByNoteId[t.note_id] = [];
      tagsByNoteId[t.note_id].push(t);
    }
  }

  const { count: totalCount } = await supabase
    .from("client_notes")
    .select("id", { count: "exact", head: true });
  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Fiches clients</h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          {total} fiche{total !== 1 ? "s" : ""} au total
        </p>
      </div>

      {noteList.length === 0 ? (
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 px-6 py-12 text-center">
          <p className="text-sm text-neutral-400">Aucune fiche client pour le moment.</p>
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
              href={`/dashboard/seller?page=${page - 1}`}
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
              href={`/dashboard/seller?page=${page + 1}`}
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

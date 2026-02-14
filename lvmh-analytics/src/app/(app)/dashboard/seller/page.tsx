import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Card } from "@/components/ui/card";
import { getMockAuthFromRequest } from "@/lib/mock-auth";

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
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-neutral-50">Fiches clients</h1>
      <p className="mb-8 text-sm text-neutral-500">
        {total} fiche{total !== 1 ? "s" : ""} au total
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {noteList.map((note) => {
          const tags = tagsByNoteId[note.id] ?? [];
          const byFamily = tags.reduce<Record<string, string[]>>((acc, t) => {
            if (!acc[t.tag_family]) acc[t.tag_family] = [];
            acc[t.tag_family].push(t.tag);
            return acc;
          }, {});

          return (
            <Link key={note.id} href={`/dashboard/seller/client/${note.id}`}>
              <Card className="flex flex-col transition hover:border-neutral-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-neutral-400">
                    {note.external_id || "—"}
                  </span>
                {note.language && (
                  <span className="rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-500">
                    {note.language}
                  </span>
                )}
              </div>
              <p className="mb-3 line-clamp-4 text-sm text-neutral-300">
                {note.note_text || "—"}
              </p>
              <div className="mt-auto space-y-1.5 border-t border-neutral-800 pt-3">
                {Object.entries(byFamily).map(([family, values]) => (
                  <div key={family}>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      {family}
                    </span>
                    <p className="text-xs text-neutral-400">
                      {values.join(", ")}
                    </p>
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-neutral-600">Aucun tag</p>
                )}
              </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/dashboard/seller?page=${page - 1}`}
              className="rounded-full border border-neutral-800 px-4 py-2 text-xs text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-300"
            >
              Précédent
            </Link>
          )}
          <span className="px-3 text-xs text-neutral-500">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/dashboard/seller?page=${page + 1}`}
              className="rounded-full border border-neutral-800 px-4 py-2 text-xs text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-300"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

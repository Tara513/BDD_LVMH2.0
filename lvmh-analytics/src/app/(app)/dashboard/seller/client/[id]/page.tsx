import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Card } from "@/components/ui/card";
import { getMockAuthFromRequest } from "@/lib/mock-auth";
import {
  tagsByFamily,
  getRecommendations,
  getTagGroupsForAccordion,
  mostFrequentTag,
  type TagEntry,
  type TagsByFamily,
} from "@/lib/sellerFiche";

type NoteRow = {
  id: string;
  external_id: string | null;
  note_text: string;
  language: string | null;
  created_at: string;
};
type TagRow = { note_id: string; tag: string; tag_family: string };

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-neutral-600 bg-neutral-800 px-3 py-1 text-xs text-neutral-200">
      {children}
    </span>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
      {title}
    </h2>
  );
}

export default async function SellerClientFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const mockRole = getMockAuthFromRequest(
    cookieStore.get("lvmh_mock_auth")?.value,
    cookieStore.get("lvmh_mock_role")?.value
  );

  const supabase = await createClient();
  const { id } = await params;

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

  const { data: note, error: noteError } = await supabase
    .from("client_notes")
    .select("id, external_id, note_text, language, created_at")
    .eq("id", id)
    .single();

  if (noteError || !note) {
    notFound();
  }

  const { data: tagRows } = await supabase
    .from("note_tags")
    .select("note_id, tag, tag_family")
    .eq("note_id", id);

  const entries: TagEntry[] = ((tagRows || []) as TagRow[]).map((r) => ({
    tag: r.tag,
    tag_family: r.tag_family,
  }));
  const byFamily = tagsByFamily(entries);
  const recommendations = getRecommendations(byFamily);
  const tagGroups = getTagGroupsForAccordion(byFamily);

  const segment = byFamily["Client_Segment"] ?? [];
  const frequency = byFamily["Frequency"] ?? [];
  const budget = byFamily["Budget_Segment"] ?? [];
  const timing = byFamily["Timing"] ?? [];
  const urgence = byFamily["Urgence"] ?? [];
  const motivations = byFamily["Motivations"] ?? [];
  const mainMotivation = mostFrequentTag(entries, "Motivations");

  const hasProfil = (byFamily["Genre"]?.length ?? 0) > 0 || (byFamily["Age_Range"]?.length ?? 0) > 0;
  const hasProducts = (byFamily["Produits"]?.length ?? 0) > 0;
  const hasStyle = (byFamily["Style"]?.length ?? 0) > 0 || (byFamily["Matières"]?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 text-neutral-100">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/seller"
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Fiches clients
        </Link>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold text-white">
            {note.external_id || "Fiche client"}
          </span>
          {note.language && (
            <Badge>{note.language}</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {segment.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
          {frequency.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
          {budget.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
          {mainMotivation && (
            <Badge>{mainMotivation}</Badge>
          )}
          {timing.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
          {urgence.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </div>

      {hasProfil && (
        <Card className="mb-6 p-5">
          <SectionTitle title="Profil" />
          <dl className="space-y-2 text-sm text-neutral-200">
            {byFamily["Genre"]?.length ? (
              <div>
                <dt className="text-neutral-400">Genre</dt>
                <dd className="text-white">{byFamily["Genre"].join(", ")}</dd>
              </div>
            ) : null}
            {byFamily["Age_Range"]?.length ? (
              <div>
                <dt className="text-neutral-400">Tranche d’âge</dt>
                <dd className="text-white">{byFamily["Age_Range"].join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      )}

      <Card className="mb-6 p-5">
        <SectionTitle title="Projet d’achat" />
        <dl className="space-y-2 text-sm text-neutral-200">
          {motivations.length > 0 && (
            <div>
              <dt className="text-neutral-400">Motifs</dt>
              <dd className="text-white">{motivations.join(", ")}</dd>
            </div>
          )}
          {budget.length > 0 && (
            <div>
              <dt className="text-neutral-400">Budget</dt>
              <dd className="text-white">{budget.join(", ")}</dd>
            </div>
          )}
          {timing.length > 0 && (
            <div>
              <dt className="text-neutral-400">Timing</dt>
              <dd className="text-white">{timing.join(", ")}</dd>
            </div>
          )}
          {motivations.length === 0 && budget.length === 0 && timing.length === 0 && (
            <p className="text-neutral-400">Non renseigné</p>
          )}
        </dl>
      </Card>

      <Card className="mb-6 p-5">
        <SectionTitle title="Produits d’intérêt" />
        {hasProducts ? (
          <ul className="flex flex-wrap gap-2">
            {(byFamily["Produits"] ?? []).map((tag) => (
              <li key={tag}>
                <Badge>{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-neutral-400">Aucun tag produit.</p>
        )}
      </Card>

      <Card className="mb-6 p-5">
        <SectionTitle title="Style & préférences" />
        {hasStyle ? (
          <dl className="space-y-2 text-sm text-neutral-200">
            {byFamily["Style"]?.length ? (
              <div>
                <dt className="text-neutral-400">Style</dt>
                <dd className="text-white">{byFamily["Style"].join(", ")}</dd>
              </div>
            ) : null}
            {byFamily["Matières"]?.length ? (
              <div>
                <dt className="text-neutral-400">Matières</dt>
                <dd className="text-white">{byFamily["Matières"].join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-neutral-400">Non renseigné</p>
        )}
      </Card>

      {recommendations.length > 0 && (
        <Card className="mb-6 border-amber-900/40 bg-amber-950/20 p-5">
          <SectionTitle title="Recommandations" />
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-200">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-6 p-5">
        <SectionTitle title="Tags détaillés" />
        <div className="space-y-2">
          {tagGroups.map(({ groupLabel, families }) => (
            <details key={groupLabel} className="group rounded-lg border border-neutral-700">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-neutral-300 transition hover:text-white">
                {groupLabel}
              </summary>
              <div className="border-t border-neutral-700 px-3 py-2">
                {families.map((fam) => (
                  <div key={fam} className="mb-2 last:mb-0">
                    <span className="text-[10px] uppercase text-neutral-400">{fam}</span>
                    <p className="text-xs text-neutral-200">
                      {(byFamily[fam] ?? []).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle title="Note client" />
        <p className="whitespace-pre-wrap text-sm text-neutral-200">
          {note.note_text || "—"}
        </p>
      </Card>
    </div>
  );
}

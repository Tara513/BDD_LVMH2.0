import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Card } from "@/components/ui/card";
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
    <span className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
      {children}
    </span>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
      {title}
    </h2>
  );
}

export default async function SellerClientFichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;

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
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/seller"
          className="text-xs text-neutral-500 transition hover:text-neutral-300"
        >
          ← Fiches clients
        </Link>
      </div>

      {/* Header synthétique — uniquement ce qui est tagué */}
      <div className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-lg font-semibold text-neutral-50">
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

      {/* Section Profil — uniquement Identity (Genre, Age_Range) */}
      {hasProfil && (
        <Card className="mb-6 p-5">
          <SectionTitle title="Profil" />
          <dl className="space-y-2 text-sm">
            {byFamily["Genre"]?.length ? (
              <div>
                <dt className="text-neutral-500">Genre</dt>
                <dd className="text-neutral-300">{byFamily["Genre"].join(", ")}</dd>
              </div>
            ) : null}
            {byFamily["Age_Range"]?.length ? (
              <div>
                <dt className="text-neutral-500">Tranche d’âge</dt>
                <dd className="text-neutral-300">{byFamily["Age_Range"].join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      )}

      {/* Section Projet d’achat — Motivations, Budget, Timing */}
      <Card className="mb-6 p-5">
        <SectionTitle title="Projet d’achat" />
        <dl className="space-y-2 text-sm">
          {motivations.length > 0 && (
            <div>
              <dt className="text-neutral-500">Motifs</dt>
              <dd className="text-neutral-300">{motivations.join(", ")}</dd>
            </div>
          )}
          {budget.length > 0 && (
            <div>
              <dt className="text-neutral-500">Budget</dt>
              <dd className="text-neutral-300">{budget.join(", ")}</dd>
            </div>
          )}
          {timing.length > 0 && (
            <div>
              <dt className="text-neutral-500">Timing</dt>
              <dd className="text-neutral-300">{timing.join(", ")}</dd>
            </div>
          )}
          {motivations.length === 0 && budget.length === 0 && timing.length === 0 && (
            <p className="text-neutral-500">Non renseigné</p>
          )}
        </dl>
      </Card>

      {/* Section Produits d’intérêt — uniquement tags Produits */}
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
          <p className="text-sm text-neutral-500">Aucun tag produit.</p>
        )}
      </Card>

      {/* Section Style & préférences — Style, Matières */}
      <Card className="mb-6 p-5">
        <SectionTitle title="Style & préférences" />
        {hasStyle ? (
          <dl className="space-y-2 text-sm">
            {byFamily["Style"]?.length ? (
              <div>
                <dt className="text-neutral-500">Style</dt>
                <dd className="text-neutral-300">{byFamily["Style"].join(", ")}</dd>
              </div>
            ) : null}
            {byFamily["Matières"]?.length ? (
              <div>
                <dt className="text-neutral-500">Matières</dt>
                <dd className="text-neutral-300">{byFamily["Matières"].join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-neutral-500">Non renseigné</p>
        )}
      </Card>

      {/* Recommandations — règles uniquement */}
      {recommendations.length > 0 && (
        <Card className="mb-6 border-amber-900/40 bg-amber-950/20 p-5">
          <SectionTitle title="Recommandations" />
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-200/90">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Accordéon Tags détaillés */}
      <Card className="mb-6 p-5">
        <SectionTitle title="Tags détaillés" />
        <div className="space-y-2">
          {tagGroups.map(({ groupLabel, families }) => (
            <details key={groupLabel} className="group rounded-lg border border-neutral-800">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-neutral-400 transition hover:text-neutral-300">
                {groupLabel}
              </summary>
              <div className="border-t border-neutral-800 px-3 py-2">
                {families.map((fam) => (
                  <div key={fam} className="mb-2 last:mb-0">
                    <span className="text-[10px] uppercase text-neutral-500">{fam}</span>
                    <p className="text-xs text-neutral-300">
                      {(byFamily[fam] ?? []).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </Card>

      {/* Note brute (donnée réelle) */}
      <Card className="p-5">
        <SectionTitle title="Note client" />
        <p className="whitespace-pre-wrap text-sm text-neutral-400">
          {note.note_text || "—"}
        </p>
      </Card>
    </div>
  );
}

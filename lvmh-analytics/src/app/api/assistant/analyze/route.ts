import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { applyTaxonomyRules, type TaxonomyTag } from "@/lib/taxonomy";
import { tagNoteWithMistral } from "@/lib/mistral";
import {
  getSynthèseBusiness,
  getNextBestActions,
  getPriorityLevel,
  type TagsByFamily,
} from "@/lib/assistantRetail";

function getRoleFromRequest(request: NextRequest): "seller" | "admin" | null {
  const auth = request.cookies.get("lvmh_mock_auth")?.value;
  const role = request.cookies.get("lvmh_mock_role")?.value;
  if (auth !== "1" || !role) return null;
  if (role === "seller" || role === "admin") return role;
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const role = getRoleFromRequest(request);
    if (!role) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const noteId = typeof body.noteId === "string" ? body.noteId.trim() : "";
    if (!noteId) {
      return NextResponse.json(
        { error: "noteId requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: note, error: noteError } = await supabase
      .from("client_notes")
      .select("id, note_text")
      .eq("id", noteId)
      .single();

    if (noteError || !note) {
      return NextResponse.json(
        { error: "Fiche introuvable" },
        { status: 404 }
      );
    }

    const ruleTags = applyTaxonomyRules(note.note_text);
    let mistralTags: TaxonomyTag[] = [];
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (mistralKey) {
      try {
        mistralTags = await tagNoteWithMistral(note.note_text, mistralKey);
      } catch {
        // keep rule-based only
      }
    }

    const combined: TaxonomyTag[] = [...ruleTags];
    const seen = new Set(ruleTags.map((t) => `${t.tag_family}:${t.tag}`));
    for (const t of mistralTags) {
      if (!seen.has(`${t.tag_family}:${t.tag}`)) {
        seen.add(`${t.tag_family}:${t.tag}`);
        combined.push(t);
      }
    }

    const tagsToInsert = combined.map((t) => ({
      note_id: noteId,
      tag: t.tag,
      tag_family: t.tag_family,
      confidence: Number(t.confidence) || 0.9,
    }));

    if (tagsToInsert.length > 0) {
      await supabase.from("note_tags").delete().eq("note_id", noteId);
      await supabase.from("note_tags").insert(tagsToInsert);
    }

    const byFamily: TagsByFamily = {};
    for (const t of combined) {
      if (!byFamily[t.tag_family]) byFamily[t.tag_family] = [];
      if (!byFamily[t.tag_family].includes(t.tag)) byFamily[t.tag_family].push(t.tag);
    }

    const synthèse = getSynthèseBusiness(byFamily);
    const priorityLevel = getPriorityLevel(byFamily);
    const nextBestActions = getNextBestActions(byFamily);

    return NextResponse.json({
      tags: combined,
      byFamily,
      synthèse,
      priorityLevel,
      nextBestActions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

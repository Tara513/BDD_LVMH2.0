import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { cleanTranscription, basicCleanRow, applyRgpd } from "@/lib/cleaning";
import { applyTaxonomyRules, type TaxonomyTag } from "@/lib/taxonomy";
import { tagNoteWithMistral } from "@/lib/mistral";

const BATCH_SIZE = 50;
const MISTRAL_BATCH_SIZE = 10;

function getNoteText(row: Record<string, string>): string {
  const raw =
    row.note_text ?? row.Note ?? row.Transcription ?? row.transcription ?? "";
  return String(raw ?? "").trim();
}

function getRequiredColumns(rows: Record<string, string>[]): boolean {
  if (!rows.length) return false;
  const first = rows[0];
  const hasNote =
    "note_text" in first ||
    "Note" in first ||
    "Transcription" in first ||
    "transcription" in first;
  return hasNote;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string) || "upload.csv";

    if (!file || !file.size) {
      return NextResponse.json(
        { error: "Fichier CSV requis" },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data || [];
    if (!rows.length) {
      return NextResponse.json(
        { error: "Aucune ligne dans le CSV" },
        { status: 400 }
      );
    }

    if (!getRequiredColumns(rows)) {
      return NextResponse.json(
        { error: "Colonne requise manquante : note_text, Note ou Transcription" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const mistralKey = process.env.MISTRAL_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const datasetName = name.replace(/\.csv$/i, "") || "dataset";
    const { data: datasetRow, error: datasetError } = await supabase
      .from("datasets")
      .insert({
        name: datasetName,
        source: "csv_upload",
        row_count: rows.length,
        status: "processing",
      })
      .select("id")
      .single();

    if (datasetError || !datasetRow?.id) {
      return NextResponse.json(
        { error: datasetError?.message || "Création dataset impossible" },
        { status: 500 }
      );
    }

    const datasetId = datasetRow.id;

    const privacyConfig = {
      drop_fields: ["phone"],
      hash_fields: ["email"],
    };

    const notesToInsert: Array<{
      dataset_id: string;
      external_id: string | null;
      note_text: string;
      language: string | null;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cleaned = basicCleanRow(row as unknown as Record<string, unknown>);
      const rgpd = applyRgpd(cleaned, privacyConfig) as Record<string, unknown>;
      const rawText = getNoteText(row);
      const noteText = cleanTranscription(rawText);
      const externalId =
        (rgpd.ID as string) ?? (rgpd.id as string) ?? `row_${i + 1}`;
      const lang = (rgpd.Language as string) ?? (rgpd.language as string) ?? null;
      notesToInsert.push({
        dataset_id: datasetId,
        external_id: String(externalId),
        note_text: noteText,
        language: lang ? String(lang).slice(0, 10) : null,
      });
    }

    for (let i = 0; i < notesToInsert.length; i += BATCH_SIZE) {
      const batch = notesToInsert.slice(i, i + BATCH_SIZE);
      const { error: notesError } = await supabase
        .from("client_notes")
        .insert(batch)
        .select("id");
      if (notesError) {
        await supabase
          .from("datasets")
          .update({ status: "failed" })
          .eq("id", datasetId);
        return NextResponse.json(
          { error: `Insert client_notes: ${notesError.message}` },
          { status: 500 }
        );
      }
    }

    const { data: insertedNotes } = await supabase
      .from("client_notes")
      .select("id, note_text")
      .eq("dataset_id", datasetId)
      .order("created_at", { ascending: true });

    if (!insertedNotes?.length) {
      await supabase
        .from("datasets")
        .update({ status: "completed" })
        .eq("id", datasetId);
      return NextResponse.json({
        datasetId,
        status: "completed",
        totalNotes: 0,
        taggedCount: 0,
        taggingRate: 0,
        tagsPreview: [],
      });
    }

    const allTags: Array<{
      note_id: string;
      tag: string;
      tag_family: string;
      confidence: number;
    }> = [];

    for (let i = 0; i < insertedNotes.length; i++) {
      const note = insertedNotes[i];
      const ruleTags = applyTaxonomyRules(note.note_text);
      let mistralTags: TaxonomyTag[] = [];
      if (mistralKey && i < MISTRAL_BATCH_SIZE) {
        try {
          mistralTags = await tagNoteWithMistral(note.note_text, mistralKey);
        } catch {
          // ignore Mistral errors, keep rule-based tags
        }
      }
      const combined = [...ruleTags];
      const seen = new Set(ruleTags.map((t) => `${t.tag_family}:${t.tag}`));
      for (const t of mistralTags) {
        if (!seen.has(`${t.tag_family}:${t.tag}`)) {
          seen.add(`${t.tag_family}:${t.tag}`);
          combined.push(t);
        }
      }
      for (const t of combined) {
        allTags.push({
          note_id: note.id,
          tag: t.tag,
          tag_family: t.tag_family,
          confidence: Number(t.confidence) || 0.9,
        });
      }
    }

    for (let i = 0; i < allTags.length; i += BATCH_SIZE) {
      const batch = allTags.slice(i, i + BATCH_SIZE);
      const { error: tagsError } = await supabase.from("note_tags").insert(batch);
      if (tagsError) {
        await supabase
          .from("datasets")
          .update({ status: "failed" })
          .eq("id", datasetId);
        return NextResponse.json(
          { error: `Insert note_tags: ${tagsError.message}` },
          { status: 500 }
        );
      }
    }

    const tagCounts: Record<string, number> = {};
    const familyCounts: Record<string, number> = {};
    for (const t of allTags) {
      tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
      familyCounts[t.tag_family] = (familyCounts[t.tag_family] || 0) + 1;
    }

    await supabase.from("analysis_results").insert([
      {
        dataset_id: datasetId,
        metric: "tag_distribution",
        value: tagCounts,
      },
      {
        dataset_id: datasetId,
        metric: "tag_family_distribution",
        value: familyCounts,
      },
    ]);

    await supabase
      .from("datasets")
      .update({ status: "completed" })
      .eq("id", datasetId);

    const totalNotes = insertedNotes.length;
    const uniqueTagged = new Set(allTags.map((t) => t.note_id)).size;
    const taggingRate = totalNotes > 0 ? Math.round((uniqueTagged / totalNotes) * 100) : 0;
    const tagsPreview = Array.from(
      new Map(allTags.map((t) => [`${t.tag_family}:${t.tag}`, { tag: t.tag, tag_family: t.tag_family }])).values()
    ).slice(0, 30);

    return NextResponse.json({
      datasetId,
      status: "completed",
      totalNotes,
      taggedCount: uniqueTagged,
      taggingRate,
      tagsPreview,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

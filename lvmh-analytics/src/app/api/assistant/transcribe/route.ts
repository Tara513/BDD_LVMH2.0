import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { cleanTranscription } from "@/lib/cleaning";
import { cleanTranscriptWithMistral } from "@/lib/mistral";

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
    const rawText = typeof body.text === "string" ? body.text.trim() : "";
    if (!rawText) {
      return NextResponse.json(
        { error: "Texte de transcription requis" },
        { status: 400 }
      );
    }

    const cleaned = cleanTranscription(rawText);
    const mistralKey = process.env.MISTRAL_API_KEY;
    let noteText = cleaned;
    if (mistralKey && cleaned.length > 30) {
      try {
        noteText = await cleanTranscriptWithMistral(cleaned, mistralKey);
      } catch {
        noteText = cleaned;
      }
    }

    const supabase = await createClient();
    const externalId = `assistant_${Date.now()}`;

    const { data: note, error } = await supabase
      .from("client_notes")
      .insert({
        dataset_id: null,
        external_id: externalId,
        note_text: noteText,
        language: "FR",
      })
      .select("id, note_text, external_id")
      .single();

    if (error || !note) {
      return NextResponse.json(
        { error: error?.message ?? "Erreur lors de la sauvegarde" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      noteId: note.id,
      note_text: note.note_text,
      external_id: note.external_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

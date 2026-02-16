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

const MISTRAL_TRANSCRIPTION_URL = "https://api.mistral.ai/v1/audio/transcriptions";
const VOXTRAL_MODEL = "voxtral-mini-latest";

export async function POST(request: NextRequest) {
  try {
    const role = getRoleFromRequest(request);
    if (!role) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: "Fichier audio requis (champ 'audio')" },
        { status: 400 }
      );
    }

    const mistralKey = process.env.MISTRAL_API_KEY;
    if (!mistralKey) {
      return NextResponse.json(
        { error: "MISTRAL_API_KEY non configurée pour la transcription audio" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([buffer], { type: file.type || "audio/webm" });
    const mistralForm = new FormData();
    mistralForm.append("file", blob, file.name || "recording.webm");
    mistralForm.append("model", VOXTRAL_MODEL);
    mistralForm.append("language", "fr");

    const mistralRes = await fetch(MISTRAL_TRANSCRIPTION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralKey}`,
      },
      body: mistralForm,
    });

    if (!mistralRes.ok) {
      const errText = await mistralRes.text();
      console.error("Mistral transcription error:", mistralRes.status, errText);
      return NextResponse.json(
        { error: "Erreur transcription Mistral. Vérifiez le format audio (WebM/MP3)." },
        { status: 502 }
      );
    }

    const mistralData = (await mistralRes.json()) as { text?: string };
    const rawText = (mistralData.text ?? "").trim();
    if (!rawText) {
      return NextResponse.json(
        { error: "Aucune parole détectée dans l'audio." },
        { status: 400 }
      );
    }

    const cleaned = cleanTranscription(rawText);
    let noteText = cleaned;
    if (cleaned.length > 30) {
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

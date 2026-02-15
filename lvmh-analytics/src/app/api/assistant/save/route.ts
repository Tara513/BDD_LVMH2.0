import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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
    const externalId = typeof body.externalId === "string" ? body.externalId.trim() : null;

    if (!noteId) {
      return NextResponse.json(
        { error: "noteId requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const updates: { external_id?: string } = {};
    if (externalId) updates.external_id = externalId;

    const { error } = await supabase
      .from("client_notes")
      .update(updates)
      .eq("id", noteId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, noteId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

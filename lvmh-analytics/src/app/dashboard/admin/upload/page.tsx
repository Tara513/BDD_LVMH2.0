"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import Papa from "papaparse";

const REQUIRED_COLUMNS = ["note_text", "Note", "Transcription", "transcription"];
const PREVIEW_ROWS = 5;

function getNoteColumn(headers: string[]): string | null {
  return headers.find((h) =>
    REQUIRED_COLUMNS.includes(h.trim())
  ) ?? null;
}

function parseCsv(text: string): { rows: Record<string, string>[]; headers: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  const rows = parsed.data || [];
  const headers = parsed.meta.fields || [];
  return { rows, headers };
}

type AnalysisResult = {
  datasetId: string;
  totalNotes: number;
  taggedCount: number;
  taggingRate: number;
  tagsPreview: Array<{ tag: string; tag_family: string }>;
};

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setError(null);
    setStatus("idle");
    setPreview(null);
    setResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Seuls les fichiers CSV sont acceptés.");
      setFile(null);
      return;
    }
    setFile(f);
    setName(f.name.replace(/\.csv$/i, ""));
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { rows, headers } = parseCsv(text);
      if (!rows.length) {
        setError("Le fichier ne contient aucune ligne.");
        return;
      }
      const noteCol = getNoteColumn(headers);
      if (!noteCol) {
        setError("Colonne requise manquante : note_text, Note ou Transcription.");
        return;
      }
      setPreview({ headers, rows: rows.slice(0, PREVIEW_ROWS) });
    };
    reader.readAsText(f, "UTF-8");
  }, []);

  const launchAnalysis = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier CSV.");
      return;
    }
    setError(null);
    setResult(null);
    setStatus("uploading");
    setProgress("Envoi du fichier…");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", name || file.name);

      setProgress("Nettoyage RGPD et enregistrement…");
      const res = await fetch("/api/analyze-dataset", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Erreur ${res.status}`);
        setStatus("error");
        return;
      }

      setProgress("Tagging (taxonomie + Mistral)…");
      setProgress("Analyse terminée.");
      setStatus("done");
      setResult({
        datasetId: data.datasetId ?? "",
        totalNotes: data.totalNotes ?? 0,
        taggedCount: data.taggedCount ?? 0,
        taggingRate: data.taggingRate ?? 0,
        tagsPreview: data.tagsPreview ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto max-w-3xl px-8 py-12">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Upload & Analyse</h1>
        <p className="mb-8 text-sm text-neutral-500">
          Importez un CSV (colonne note_text, Note ou Transcription). Nettoyage RGPD, taxonomie et tagging Mistral.
        </p>

        <Card>
          <CardHeader
            title="Fichier CSV"
            description="Vérification des colonnes et aperçu des 5 premières lignes"
          />
          <CardBody className="space-y-6">
            <div>
              <label className="mb-2 block text-xs text-neutral-400">Fichier</label>
              <input
                type="file"
                accept=".csv"
                onChange={onFileChange}
                disabled={status === "uploading"}
                className="block w-full text-xs text-neutral-400 file:mr-4 file:rounded-full file:border-0 file:bg-neutral-800 file:px-4 file:py-2 file:text-neutral-200"
              />
            </div>

            {preview && (
              <div>
                <p className="mb-2 text-xs text-neutral-500">Aperçu ({preview.rows.length} lignes)</p>
                <div className="overflow-x-auto rounded-xl border border-neutral-800">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/50">
                        {preview.headers.slice(0, 4).map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium text-neutral-400">{h}</th>
                        ))}
                        {preview.headers.length > 4 && <th className="px-3 py-2 text-left text-neutral-500">…</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, i) => (
                        <tr key={i} className="border-b border-neutral-800/80">
                          {preview.headers.slice(0, 4).map((h) => (
                            <td key={h} className="max-w-[200px] truncate px-3 py-2 text-neutral-300">{row[h] ?? "—"}</td>
                          ))}
                          {preview.headers.length > 4 && <td className="px-3 py-2 text-neutral-500">…</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

            {status === "uploading" && (
              <div className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-3 text-xs text-neutral-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-neutral-500" />
                {progress}
              </div>
            )}

            <button
              type="button"
              onClick={launchAnalysis}
              disabled={!file || status === "uploading"}
              className="rounded-full bg-neutral-100 px-6 py-2.5 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "uploading" ? "Analyse en cours…" : "Lancer l'analyse"}
            </button>
          </CardBody>
        </Card>

        {result && status === "done" && (
          <>
            <div className="mt-8 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 px-6 py-4">
              <p className="text-sm font-medium text-emerald-200">Fichier analysé avec succès</p>
              <p className="mt-2 text-lg font-light text-neutral-100">
                {result.totalNotes} ligne{result.totalNotes > 1 ? "s" : ""} analysée{result.totalNotes > 1 ? "s" : ""}
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                Toutes les lignes du fichier ont été traitées : nettoyage RGPD, taxonomie et tags. Données enregistrées dans Supabase.
              </p>
              <a
                href={`/dashboard/admin/dashboard?dataset=${result.datasetId}`}
                className="mt-3 inline-block rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-200"
              >
                Voir le dashboard de ce fichier →
              </a>
            </div>
            <Card className="mt-6">
              <CardHeader title="Résumé de l'analyse" description="Résultat du pipeline (dataset, client_notes, note_tags)" />
              <CardBody className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] text-neutral-500">Lignes analysées</p>
                  <p className="text-2xl font-light text-neutral-50">{result.totalNotes}</p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500">Notes taguées</p>
                  <p className="text-2xl font-light text-neutral-50">{result.taggedCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500">Taux de tagging</p>
                  <p className="text-2xl font-light text-neutral-50">{result.taggingRate}%</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-[11px] text-neutral-500">Aperçu des tags générés</p>
                <div className="flex flex-wrap gap-2">
                  {result.tagsPreview.length === 0 ? (
                    <span className="text-xs text-neutral-500">Aucun tag</span>
                  ) : (
                    result.tagsPreview.map((t, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-neutral-700 bg-neutral-900/80 px-2.5 py-1 text-[11px] text-neutral-300"
                      >
                        {t.tag_family} · {t.tag}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";

type CsvRow = {
  [key: string]: string;
};

function cleanTranscription(text: string): string {
  if (!text) return "";

  const fillerPhrases = [
    "euh",
    "bah",
    "ben",
    "du coup",
    "en fait",
    "voilà",
    "quoi",
    "genre",
    "tu vois",
    "tu sais",
    "hein",
    "uh",
    "um",
    "you know",
    "i mean",
    "like",
    "kind of",
    "sort of",
    "basically",
    "so yeah",
    "allora",
    "diciamo",
    "tipo",
  ];

  let cleaned = text;
  for (const phrase of fillerPhrases) {
    const safe = phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const pattern = new RegExp(`\\b${safe}\\b`, "gi");
    cleaned = cleaned.replace(pattern, " ");
  }

  cleaned = cleaned.replace(/\s+/g, " ");
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, "$1");

  return cleaned.trim() || text;
}

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setStatus("");
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Choisis un fichier CSV d'abord.");
      return;
    }

    try {
      setStatus("Lecture du CSV...");

      const text = await file.text();
      const parsed = Papa.parse<CsvRow>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        // eslint-disable-next-line no-console
        console.error(parsed.errors);
        setStatus("Erreur de parsing CSV (détails dans la console du navigateur).");
        return;
      }

      const rows = parsed.data;

      setStatus("Création du dataset dans Supabase...");

      const { data: datasetData, error: datasetError } = await supabase
        .from("datasets")
        .insert({
          name: file.name,
          source: "web_upload",
          row_count: rows.length,
          status: "uploaded",
        })
        .select("id")
        .single();

      if (datasetError || !datasetData) {
        // eslint-disable-next-line no-console
        console.error("Dataset insert error:", datasetError);
        setStatus(
          `Erreur lors de la création du dataset : ${
            datasetError ? JSON.stringify(datasetError) : "réponse vide"
          }`,
        );
        return;
      }

      const datasetId = datasetData.id as string;

      setStatus("Insertion des transcriptions dans client_notes...");

      const notes = rows.map((row) => {
        const externalId = row["ID"] ?? row["id"] ?? "";
        const language = (row["Language"] ?? row["language"] ?? "").toUpperCase() || null;
        const transcriptionRaw = row["Transcription"] ?? row["transcription"] ?? "";
        const transcriptionClean = cleanTranscription(transcriptionRaw);

        return {
          dataset_id: datasetId,
          external_id: externalId,
          note_text: transcriptionClean,
          language,
        };
      });

      const { error: notesError } = await supabase.from("client_notes").insert(notes);

      if (notesError) {
        // eslint-disable-next-line no-console
        console.error("Notes insert error:", notesError);
        setStatus(
          `Erreur lors de l'insertion dans client_notes : ${
            notesError ? JSON.stringify(notesError) : "inconnue"
          }`,
        );
        return;
      }

      setStatus(`Import terminé : ${notes.length} lignes insérées pour le dataset ${datasetId}.`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      setStatus("Erreur inattendue pendant l'import (voir console).");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full border border-neutral-800 rounded-2xl p-6 bg-neutral-900/70 shadow-xl">
        <h1 className="text-2xl font-semibold mb-4">Analyse LVMH – Upload CSV</h1>
        <p className="text-sm text-neutral-300 mb-4">
          Sélectionne un fichier CSV (comme <code>LVMH_Realistic_Merged_CA001-100.csv</code>). Le contenu sera
          nettoyé et envoyé dans les tables <code>datasets</code> et <code>client_notes</code> de Supabase.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="mb-4 block w-full text-sm text-neutral-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500 file:text-black hover:file:bg-emerald-400"
        />

        <button
          type="button"
          onClick={handleUpload}
          className="w-full py-2.5 rounded-full bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
          disabled={!file}
        >
          Importer et analyser
        </button>

        {status && <p className="mt-4 text-sm text-neutral-200 whitespace-pre-line">{status}</p>}
      </div>
    </main>
  );
}


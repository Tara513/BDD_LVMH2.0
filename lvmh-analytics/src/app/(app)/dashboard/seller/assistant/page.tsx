"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  getSynthèseBusiness,
  getNextBestActions,
  getPriorityLevel,
  type SynthèseBusiness,
  type TagsByFamily,
} from "@/lib/assistantRetail";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

type SpeechRecognition = {
  start: () => void;
  stop: () => void;
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (e: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (e: { error: string }) => void;
};

interface SpeechRecognitionResultList {
  length: number;
  item(i: number): SpeechRecognitionResult;
  [i: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(i: number): SpeechRecognitionAlternative;
  [i: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export default function AssistantRetailPage() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [loadingTranscribe, setLoadingTranscribe] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [savedNoteText, setSavedNoteText] = useState("");
  const [analysis, setAnalysis] = useState<{
    byFamily: TagsByFamily;
    synthèse: SynthèseBusiness;
    priorityLevel: string | null;
    nextBestActions: string[];
  } | null>(null);
  const [saveExternalId, setSaveExternalId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProcessedIndexRef = useRef(0);

  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI() as SpeechRecognition;
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "fr-FR";
      recognitionRef.current.onresult = (e: SpeechRecognitionEvent) => {
        const r = e as unknown as { results: SpeechRecognitionResultList };
        const results = r.results;
        let newText = "";

        for (let i = lastProcessedIndexRef.current; i < results.length; i++) {
          const result = results[i];
          const transcriptStr = result[0]?.transcript?.trim();
          if (!transcriptStr) continue;

          if (result.isFinal) {
            newText = newText ? `${newText} ${transcriptStr}` : transcriptStr;
            lastProcessedIndexRef.current = i + 1;
          }
        }

        if (newText) {
          setTranscript((prev) => (prev ? `${prev} ${newText}` : newText).trim());
        }

        const lastIdx = results.length - 1;
        const lastResult = results[lastIdx];
        if (lastResult && !lastResult.isFinal) {
          setInterimTranscript(lastResult[0]?.transcript?.trim() ?? "");
        } else {
          setInterimTranscript("");
        }
      };
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  const startRecording = () => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    setSeconds(0);
    lastProcessedIndexRef.current = 0;
    setRecording(true);
    recognitionRef.current?.start();
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    setRecording(false);
    recognitionRef.current?.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTranscribe = async () => {
    const text = transcript.trim();
    if (!text) {
      setError("Aucune transcription à envoyer.");
      return;
    }
    setError(null);
    setLoadingTranscribe(true);
    try {
      const res = await fetch("/api/assistant/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur transcription");
      setNoteId(data.noteId);
      setSavedNoteText(data.note_text ?? "");
      setAnalysis(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoadingTranscribe(false);
    }
  };

  const handleAnalyze = async () => {
    if (!noteId) return;
    setError(null);
    setLoadingAnalyze(true);
    try {
      const res = await fetch("/api/assistant/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur analyse");
      setAnalysis({
        byFamily: data.byFamily ?? {},
        synthèse: data.synthèse ?? getSynthèseBusiness(data.byFamily ?? {}),
        priorityLevel: data.priorityLevel ?? getPriorityLevel(data.byFamily ?? {}),
        nextBestActions: data.nextBestActions ?? getNextBestActions(data.byFamily ?? {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const handleSave = async () => {
    if (!noteId) return;
    setError(null);
    setLoadingSave(true);
    try {
      const res = await fetch("/api/assistant/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, externalId: saveExternalId || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur sauvegarde");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoadingSave(false);
    }
  };

  const hasSpeechAPI = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-neutral-100">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-white">Assistant Retail</h1>
      <p className="mb-8 text-sm text-neutral-500">
        Enregistrez une conversation, transcrivez et analysez pour obtenir une synthèse exploitable.
      </p>

      {error && (
        <div className="mb-6 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Enregistrement */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Enregistrement
        </h2>
        {hasSpeechAPI ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {!recording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="rounded-lg bg-neutral-700 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-600"
                >
                  Démarrer enregistrement
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-lg bg-red-900/80 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-red-800"
                >
                  Arrêter
                </button>
              )}
              {recording && (
                <span className="text-sm text-neutral-400">
                  {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] text-neutral-500">
              La reconnaissance vocale s'affiche en direct. Cliquez sur « Arrêter » puis « Envoyer » pour transcrire et nettoyer.
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-400">
            Votre navigateur ne supporte pas la reconnaissance vocale. Saisissez ou collez le texte ci‑dessous.
          </p>
        )}

        <div className="mt-4">
          <label className="block text-[10px] uppercase tracking-wider text-neutral-500">
            Transcription
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcription ou texte de la conversation…"
            rows={6}
            className="mt-1.5 w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
          />
          {recording && interimTranscript && (
            <p className="mt-2 text-sm italic text-neutral-500">
              En cours : {interimTranscript}
            </p>
          )}
          <button
            type="button"
            onClick={handleTranscribe}
            disabled={loadingTranscribe || !transcript.trim()}
            className="mt-3 rounded-lg border border-neutral-600 bg-neutral-800/80 px-4 py-2 text-xs text-neutral-200 transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {loadingTranscribe ? "Transcription…" : "Envoyer et transcrire"}
          </button>
        </div>
      </Card>

      {/* Transcription sauvegardée */}
      {(savedNoteText || noteId) && (
        <Card className="mb-6 p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Transcription enregistrée
          </h2>
          <p className="whitespace-pre-wrap text-sm text-neutral-300">
            {savedNoteText || "—"}
          </p>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loadingAnalyze}
            className="mt-4 rounded-lg bg-amber-900/60 px-4 py-2 text-xs font-medium text-amber-200 transition hover:bg-amber-800/60 disabled:opacity-50"
          >
            {loadingAnalyze ? "Analyse en cours…" : "Analyser la conversation"}
          </button>
        </Card>
      )}

      {/* Résultats analyse */}
      {analysis && (
        <>
          <Card className="mb-6 p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Tags extraits
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(analysis.byFamily).map(([family, tags]) =>
                tags.map((tag) => (
                  <span
                    key={`${family}:${tag}`}
                    className="rounded-full border border-neutral-600 bg-neutral-800/80 px-2.5 py-1 text-[11px] text-neutral-200"
                  >
                    {family}: {tag}
                  </span>
                ))
              )}
              {Object.keys(analysis.byFamily).length === 0 && (
                <span className="text-sm text-neutral-500">Aucun tag extrait.</span>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Sauvegarder dans fiche client
            </h2>
            <p className="mb-3 text-xs text-neutral-500">
              Lier cette conversation à un client (ex. CA_065). Laissez vide pour garder l'ID actuel.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveExternalId}
                onChange={(e) => setSaveExternalId(e.target.value)}
                placeholder="ID client (ex. CA_065)"
                className="flex-1 rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={loadingSave}
                className="rounded-lg border border-neutral-600 bg-neutral-800/80 px-4 py-2 text-xs text-neutral-200 transition hover:bg-neutral-700 disabled:opacity-50"
              >
                {loadingSave ? "Enregistrement…" : "Sauvegarder"}
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

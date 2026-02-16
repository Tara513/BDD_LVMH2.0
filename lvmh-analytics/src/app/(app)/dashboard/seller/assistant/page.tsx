"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import {
  getSynthèseBusiness,
  getNextBestActions,
  getPriorityLevel,
  type SynthèseBusiness,
  type TagsByFamily,
} from "@/lib/assistantRetail";

export default function AssistantRetailPage() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [loadingTranscribe, setLoadingTranscribe] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [savedNoteText, setSavedNoteText] = useState("");
  const [analysis, setAnalysis] = useState<{
    byFamily: TagsByFamily;
    synthèse: SynthèseBusiness;
    priorityLevel: string | null;
    nextBestActions: string[];
    suggestions?: {
      suggested_categories: string[];
      suggested_materials: string[];
      suggested_house: string[];
      business_angle: string | null;
    };
  } | null>(null);
  const [saveExternalId, setSaveExternalId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimerAndStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopTimerAndStream();
  }, [stopTimerAndStream]);

  const startRecording = async () => {
    setError(null);
    setTranscript("");
    setSeconds(0);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        mediaRecorderRef.current = null;
        const chunks = chunksRef.current;
        if (chunks.length === 0) {
          setRecording(false);
          stopTimerAndStream();
          return;
        }
        const blob = new Blob(chunks, { type: mime });
        const file = new File([blob], "recording.webm", { type: blob.type });
        setLoadingAudio(true);
        try {
          const form = new FormData();
          form.append("audio", file);
          const res = await fetch("/api/assistant/transcribe-audio", {
            method: "POST",
            body: form,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Erreur transcription audio");
          setNoteId(data.noteId);
          setSavedNoteText(data.note_text ?? "");
          setAnalysis(null);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erreur transcription");
        } finally {
          setLoadingAudio(false);
        }
        setRecording(false);
        stopTimerAndStream();
      };
      recorder.start(2000);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Microphone inaccessible. Autorisez l'accès au micro."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    } else {
      setRecording(false);
      stopTimerAndStream();
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
        suggestions: data.suggestions ?? undefined,
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

  const hasMediaRecorder =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

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

      {/* Enregistrement (MediaRecorder + Mistral Voxtral) */}
      <Card className="mb-6 p-5">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Enregistrement
        </h2>
        {hasMediaRecorder ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {!recording && !loadingAudio && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="rounded-lg bg-neutral-700 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-neutral-600"
                >
                  Démarrer enregistrement
                </button>
              )}
              {(recording || loadingAudio) && (
                <button
                  type="button"
                  onClick={stopRecording}
                  disabled={loadingAudio}
                  className="rounded-lg bg-red-900/80 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:opacity-50"
                >
                  {loadingAudio ? "Transcription en cours…" : "Arrêter"}
                </button>
              )}
              {recording && (
                <span className="text-sm text-neutral-400">
                  {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
            <p className="mt-2 text-[10px] text-neutral-500">
              Enregistrement continu au micro (API MediaRecorder). À l&apos;arrêt, transcription automatique par Mistral Voxtral.
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-400">
            Micro ou MediaRecorder non disponible. Saisissez ou collez le texte ci‑dessous.
          </p>
        )}

        <div className="mt-4">
          <label className="block text-[10px] uppercase tracking-wider text-neutral-500">
            Ou saisir / coller le texte
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Transcription ou texte de la conversation…"
            rows={6}
            className="mt-1.5 w-full rounded-lg border border-neutral-700/80 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
          />
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

          {analysis.suggestions && (
            <Card className="mb-6 border-neutral-700/80 bg-neutral-900/40 p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Suggested Retail Strategy
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
                    Catégories suggérées
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.suggestions.suggested_categories.length > 0 ? (
                      analysis.suggestions.suggested_categories.map((c) => (
                        <span
                          key={c}
                          className="rounded border border-neutral-600 bg-neutral-800/80 px-2 py-1 text-[11px] text-neutral-200"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
                    Matières suggérées
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.suggestions.suggested_materials.length > 0 ? (
                      analysis.suggestions.suggested_materials.map((m) => (
                        <span
                          key={m}
                          className="rounded border border-neutral-600 bg-neutral-800/80 px-2 py-1 text-[11px] text-neutral-200"
                        >
                          {m}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
                    Maison prioritaire
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.suggestions.suggested_house.length > 0 ? (
                      analysis.suggestions.suggested_house.map((h) => (
                        <span
                          key={h}
                          className="rounded border border-amber-800/60 bg-amber-950/30 px-2 py-1 text-[11px] text-amber-200"
                        >
                          {h}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500">—</span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
                    Angle commercial
                  </p>
                  <p className="text-sm text-neutral-300">
                    {analysis.suggestions.business_angle || "—"}
                  </p>
                </div>
              </div>
            </Card>
          )}

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

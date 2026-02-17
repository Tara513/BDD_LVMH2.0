"use client";

import { useState, useCallback, useRef } from "react";
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
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((f: File | null) => {
    setError(null);
    setStatus("idle");
    setPreview(null);
    setResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setError("Please use a CSV file.");
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
        setError("The file is empty.");
        return;
      }
      const noteCol = getNoteColumn(headers);
      if (!noteCol) {
        setError("Required column not found.");
        return;
      }
      setPreview({ headers, rows: rows.slice(0, PREVIEW_ROWS) });
    };
    reader.readAsText(f, "UTF-8");
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0] ?? null);
  }, [processFile]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files?.[0] ?? null);
  }, [processFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const launchAnalysis = async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    setStatus("uploading");
    setProgress("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("name", name || file.name);

      const res = await fetch("/api/analyze-dataset", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("done");
      setResult({
        datasetId: data.datasetId ?? "",
        totalNotes: data.totalNotes ?? 0,
        taggedCount: data.taggedCount ?? 0,
        taggingRate: data.taggingRate ?? 0,
        tagsPreview: data.tagsPreview ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-[80vh] animate-in fade-in duration-500">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-3xl font-extralight tracking-tight text-neutral-50 md:text-4xl">
            Data Intelligence Studio
          </h1>
          <p className="mt-3 text-sm font-light tracking-wide text-neutral-500">
            Import and analyze client insights
          </p>
        </header>

        {/* Drop zone */}
        <div className="mb-10">
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={onFileChange}
            className="sr-only"
            aria-label="Select CSV file"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "uploading"}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`group relative flex w-full flex-col items-center justify-center rounded-lg border py-16 transition-all duration-300 ease-in-out disabled:pointer-events-none ${
              isDragOver
                ? "scale-[1.01] border-yellow-500/80 bg-neutral-900"
                : "border-neutral-800 bg-black hover:border-yellow-600/70 hover:bg-neutral-950"
            }`}
          >
            <svg
              className="mb-4 h-10 w-10 text-neutral-500 transition-colors group-hover:text-yellow-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-sm font-light tracking-wide text-neutral-400">
              Drag & Drop your CSV file
            </span>
            <span className="mt-1 text-xs text-neutral-600">
              or click to browse
            </span>
          </button>
        </div>

        {/* File state */}
        {file && (
          <div className="mb-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <svg className="h-4 w-4 shrink-0 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="truncate text-sm font-light text-neutral-300">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={removeFile}
                disabled={status === "uploading"}
                className="shrink-0 rounded p-1 text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-300 disabled:opacity-50"
                aria-label="Remove file"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Preview table */}
        {preview && (
          <div className="mb-10 animate-in fade-in duration-300">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                Data validated
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-800/80">
                    {preview.headers.slice(0, 4).map((h) => (
                      <th key={h} className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                        {h}
                      </th>
                    ))}
                    {preview.headers.length > 4 && (
                      <th className="px-4 py-3 text-[11px] text-neutral-600">—</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-b border-neutral-800/50 last:border-0">
                      {preview.headers.slice(0, 4).map((h) => (
                        <td key={h} className="max-w-[180px] truncate px-4 py-3 text-xs font-light text-neutral-400">
                          {row[h] ?? "—"}
                        </td>
                      ))}
                      {preview.headers.length > 4 && (
                        <td className="px-4 py-3 text-neutral-600">—</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 animate-in fade-in rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-xs font-light text-neutral-400">
            {error}
          </div>
        )}

        {/* Loading state */}
        {status === "uploading" && (
          <div className="mb-10 animate-in fade-in duration-300">
            <p className="mb-2 text-xs font-light text-neutral-500">Analyzing data…</p>
            <div className="h-0.5 w-full overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full w-1/3 rounded-full bg-yellow-600"
                style={{ animation: "upload-shimmer 1.8s ease-in-out infinite" }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        {status !== "uploading" && (
          <div className="animate-in fade-in duration-300">
            <button
              type="button"
              onClick={launchAnalysis}
              disabled={!file}
              className="w-full rounded-lg bg-neutral-200 py-4 text-sm font-medium tracking-wide text-neutral-900 shadow-sm transition-all duration-300 ease-in-out hover:bg-neutral-100 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400 disabled:hover:bg-neutral-700 disabled:shadow-none active:scale-[0.99]"
            >
              Start Analysis
            </button>
          </div>
        )}

        {/* Result */}
        {result && status === "done" && (
          <div className="mt-16 animate-in fade-in duration-500">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-6 py-8">
              <p className="text-sm font-light text-neutral-300">
                {result.totalNotes} line{result.totalNotes !== 1 ? "s" : ""} analyzed
              </p>
              <div className="mt-6 grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-600">Lines</p>
                  <p className="mt-0.5 text-2xl font-extralight text-neutral-100">{result.totalNotes}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-600">Tagged</p>
                  <p className="mt-0.5 text-2xl font-extralight text-neutral-100">{result.taggedCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-neutral-600">Rate</p>
                  <p className="mt-0.5 text-2xl font-extralight text-neutral-100">{result.taggingRate}%</p>
                </div>
              </div>
              {result.tagsPreview.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {result.tagsPreview.slice(0, 12).map((t, i) => (
                    <span
                      key={i}
                      className="rounded border border-neutral-700 bg-neutral-900 px-2 py-0.5 text-[10px] font-light text-neutral-500"
                    >
                      {t.tag_family} · {t.tag}
                    </span>
                  ))}
                </div>
              )}
              <a
                href={`/dashboard/admin/dashboard?dataset=${result.datasetId}`}
                className="mt-6 inline-block rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-light text-neutral-300 transition hover:bg-neutral-800 hover:text-neutral-200"
              >
                View dashboard →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

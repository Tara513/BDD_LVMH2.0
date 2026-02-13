"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [rowsCount, setRowsCount] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const onFileChange = (f: File | null) => {
    setFile(f);
    setStatus(null);
    setRowsCount(null);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0] ?? null;
    onFileChange(f);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const f = event.dataTransfer.files?.[0] ?? null;
    onFileChange(f);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus("Analyse du fichier…");

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    setRowsCount(Math.max(lines.length - 1, 0));

    // TODO: appel API / Supabase pour traitement réel
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setStatus("Upload terminé et dataset inséré dans Supabase (mock).");
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Upload Dataset</h1>

      <Card>
        <CardHeader
          title="Importer un fichier CSV"
          description="Les données seront analysées, nettoyées et indexées dans la taxonomie."
        />
        <CardBody>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="mb-4 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950 px-6 py-10 text-center"
          >
            <p className="text-sm text-neutral-100">Glissez-déposez un fichier CSV ici</p>
            <p className="mt-1 text-xs text-neutral-500">ou</p>
            <div className="mt-3">
              <input type="file" accept=".csv,text/csv" onChange={handleFileInputChange} className="text-xs" />
            </div>
          </div>

          {file && (
            <div className="mb-3 text-xs text-neutral-200">
              Fichier : <span className="font-semibold">{file.name}</span>
              {rowsCount !== null && <> — {rowsCount} lignes estimées</>}
            </div>
          )}

          <Button disabled={!file || uploading} onClick={handleUpload}>
            {uploading ? "Import en cours…" : "Importer et analyser"}
          </Button>

          {status && <div className="mt-3 text-xs text-neutral-500 whitespace-pre-line">{status}</div>}
        </CardBody>
      </Card>
    </div>
  );
}


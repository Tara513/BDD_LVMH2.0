"use client";

import { useState } from "react";
import { mockDatasets } from "@/lib/mock-data";

export const Header = () => {
  const [datasetId, setDatasetId] = useState<string | undefined>(mockDatasets[0]?.id);

  return (
    <header className="flex items-center justify-between border-b border-neutral-900 bg-neutral-950/90 px-8 py-3">
      <div>
        <label className="block text-[10px] uppercase tracking-wide text-neutral-500">Dataset</label>
        <select
          value={datasetId}
          onChange={(e) => setDatasetId(e.target.value)}
          className="mt-1 min-w-[260px] rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        >
          {mockDatasets.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.name} ({ds.row_count} lignes)
            </option>
          ))}
        </select>
      </div>

    </header>
  );
};


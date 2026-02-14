"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

export function FicheCard({
  noteId,
  externalId,
  noteText,
  language,
  tagsByFamily,
}: {
  noteId: string;
  externalId: string | null;
  noteText: string | null;
  language: string | null;
  tagsByFamily: Record<string, string[]>;
}) {
  const tagsList = Object.entries(tagsByFamily ?? {});
  const hasTags = tagsList.length > 0;
  const text = (noteText ?? "").trim() || "—";

  return (
    <Link href={`/dashboard/seller/client/${noteId}`} className="group block">
      <Card className="!p-2.5 overflow-hidden transition hover:border-neutral-600 hover:bg-neutral-900/80">
        {/* Ligne compacte par défaut */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="min-w-[4.5rem] shrink-0 font-medium text-neutral-400">
            {externalId ?? "—"}
          </span>
          {language && (
            <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
              {language}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-neutral-500">
            {text}
          </span>
        </div>

        {/* Détails au survol */}
        <div className="block max-h-0 overflow-hidden transition-[max-height] duration-200 ease-out group-hover:max-h-[200px]">
          <div className="border-t border-neutral-800 pt-2 mt-1.5 space-y-1.5">
            <p className="line-clamp-3 text-xs text-neutral-400">
              {text}
            </p>
            {hasTags && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                {tagsList.map(([family, values]) => (
                  <span key={family} className="text-neutral-500">
                    <span className="uppercase tracking-wider text-neutral-600">{family}:</span>{" "}
                    {(values ?? []).join(", ")}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

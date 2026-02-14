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
      <Card className="!p-3 overflow-hidden border-neutral-800/80 transition-all duration-300 ease-out hover:border-neutral-600 hover:bg-neutral-800/40 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        {/* Ligne compacte par défaut */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="min-w-[4.5rem] shrink-0 font-medium text-neutral-400">
            {externalId ?? "—"}
          </span>
          {language && (
            <span className="shrink-0 rounded-md bg-neutral-800/80 px-2 py-0.5 text-[10px] text-neutral-500">
              {language}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-neutral-500">
            {text}
          </span>
        </div>

        {/* Détails au survol — transition plus lente et douce */}
        <div
          className="block max-h-0 overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:max-h-[200px]"
          style={{ transitionProperty: "max-height" }}
        >
          <div className="border-t border-neutral-700/60 pt-3 mt-2 space-y-2">
            <p className="line-clamp-3 text-xs leading-relaxed text-neutral-400">
              {text}
            </p>
            {hasTags && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-neutral-500">
                {tagsList.map(([family, values]) => (
                  <span key={family}>
                    <span className="uppercase tracking-wider text-neutral-500">{family}:</span>{" "}
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

/**
 * Nettoyage RGPD et transcriptions – aligné sur csv_pipeline.py
 */

export type PrivacyConfig = {
  personal_fields?: string[];
  drop_fields?: string[];
  hash_fields?: string[];
};

const DEFAULT_PRIVACY: PrivacyConfig = {
  personal_fields: ["email", "name", "phone"],
  drop_fields: ["phone"],
  hash_fields: ["email"],
};

function sha256(text: string): string {
  const { createHash } = require("crypto");
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function applyRgpd(
  row: Record<string, unknown>,
  config: PrivacyConfig = DEFAULT_PRIVACY
): Record<string, unknown> {
  const drop = new Set(config.drop_fields ?? []);
  const hash = new Set(config.hash_fields ?? []);
  const out: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(row)) {
    if (drop.has(k)) continue;
    if (hash.has(k) && typeof v === "string") {
      out[k] = sha256(v);
      continue;
    }
    out[k] = v;
  }
  return out;
}

const FILLER_PHRASES = [
  "euh", "bah", "ben", "du coup", "en fait", "voilà", "quoi", "genre",
  "tu vois", "tu sais", "hein",
  "uh", "um", "you know", "i mean", "like", "kind of", "sort of",
  "basically", "so yeah",
  "allora", "diciamo", "tipo",
];

export function cleanTranscription(text: string, _language?: string | null): string {
  if (typeof text !== "string") return "";
  let cleaned = text;
  for (const phrase of FILLER_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    cleaned = cleaned.replace(re, " ");
  }
  cleaned = cleaned.replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
  return cleaned || text;
}

export function basicCleanRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v == null) continue;
    if (typeof v === "string") {
      const t = v.trim();
      if (t === "") continue;
      out[k] = t;
    } else {
      out[k] = v;
    }
  }
  return out;
}

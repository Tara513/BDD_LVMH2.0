"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChartCard } from "@/components/charts/ChartCard";
import { Card } from "@/components/ui/card";
import { MAISONS } from "@/lib/taxonomy";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = ["#f5f5f5", "#e5e5e5", "#a3a3a3", "#737373", "#525252", "#404040"];

type DatasetRow = { id: string; name: string; row_count: number | null; status: string | null };
type AnalysisRow = { metric: string; value: Record<string, number> };

export default function AnalyticsPage() {
  const [datasets, setDatasets] = useState<DatasetRow[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [maisonFilter, setMaisonFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalClients: number;
    taggedCount: number;
    tagDistribution: Record<string, number>;
    familyDistribution: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("datasets")
        .select("id, name, row_count, status")
        .order("uploaded_at", { ascending: false });
      setDatasets(data || []);
      if (data?.length && !selectedDatasetId) setSelectedDatasetId(data[0].id);
      setLoading(false);
    })();
  }, [selectedDatasetId]);

  useEffect(() => {
    if (!selectedDatasetId) {
      setStats(null);
      return;
    }

    let cancelled = false;

    async function run() {
      let notesQuery = supabase
        .from("client_notes")
        .select("id", { count: "exact" })
        .eq("dataset_id", selectedDatasetId!);
      if (maisonFilter) {
        notesQuery = notesQuery.ilike("note_text", `%${maisonFilter}%`);
      }
      const { data: notesList, count: totalClients } = await notesQuery;
      const ids = (notesList || []).map((n) => n.id);
      const total = totalClients ?? ids.length;

      let taggedCount = 0;
      if (ids.length) {
        const { data: tagged } = await supabase
          .from("note_tags")
          .select("note_id")
          .in("note_id", ids);
        const uniqueTagged = new Set((tagged || []).map((t) => t.note_id));
        taggedCount = uniqueTagged.size;
      }

      const { data: analysis } = await supabase
        .from("analysis_results")
        .select("metric, value")
        .eq("dataset_id", selectedDatasetId!);

      if (cancelled) return;

      const tagDist: Record<string, number> = {};
      const familyDist: Record<string, number> = {};
      for (const row of (analysis || []) as AnalysisRow[]) {
        if (row.metric === "tag_distribution" && typeof row.value === "object") {
          Object.assign(tagDist, row.value);
        }
        if (row.metric === "tag_family_distribution" && typeof row.value === "object") {
          Object.assign(familyDist, row.value);
        }
      }

      setStats({
        totalClients: total,
        taggedCount,
        tagDistribution: tagDist,
        familyDistribution: familyDist,
      });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedDatasetId, maisonFilter]);

  const completionPct =
    stats && stats.totalClients > 0
      ? Math.round((stats.taggedCount / stats.totalClients) * 100)
      : 0;

  const tagChartData = stats
    ? Object.entries(stats.tagDistribution)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    : [];
  const familyChartData = stats
    ? Object.entries(stats.familyDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const tooltipStyle = {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    border: "1px solid #262626",
    fontSize: 12,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <span className="text-xs text-neutral-500">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto max-w-7xl px-8 py-12">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mb-8 text-sm text-neutral-500">
          KPIs et répartitions par dataset. Filtre optionnel par maison.
        </p>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div>
            <label className="mb-1 block text-[11px] text-neutral-500">Dataset</label>
            <select
              value={selectedDatasetId ?? ""}
              onChange={(e) => setSelectedDatasetId(e.target.value || null)}
              className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            >
              {datasets.length === 0 && (
                <option value="">Aucun dataset</option>
              )}
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.row_count != null ? `(${d.row_count})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-neutral-500">Maison</label>
            <select
              value={maisonFilter}
              onChange={(e) => setMaisonFilter(e.target.value)}
              className="rounded-full border border-neutral-800 bg-neutral-950 px-4 py-2 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            >
              <option value="">Toutes</option>
              {MAISONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="text-[11px] text-neutral-500">Total clients</div>
            <div className="mt-1 text-2xl font-light text-neutral-50">
              {stats?.totalClients ?? "—"}
            </div>
          </Card>
          <Card>
            <div className="text-[11px] text-neutral-500">Budget moyen</div>
            <div className="mt-1 text-2xl font-light text-neutral-50">—</div>
          </Card>
          <Card>
            <div className="text-[11px] text-neutral-500">% VIP</div>
            <div className="mt-1 text-2xl font-light text-neutral-50">—</div>
          </Card>
          <Card>
            <div className="text-[11px] text-neutral-500">% complétion tagging</div>
            <div className="mt-1 text-2xl font-light text-neutral-50">
              {stats ? `${completionPct}%` : "—"}
            </div>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[2fr,1.5fr]">
          <ChartCard
            title="Répartition par tag"
            description="Top tags (taxonomie + Mistral)"
          >
            <div className="h-64 w-full">
              {tagChartData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={tagChartData} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" stroke="#737373" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#737373" width={70} fontSize={11} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="#e5e5e5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                  Aucune donnée de tags
                </div>
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Répartition par famille"
            description="Tag family (Motivations, Produits…)"
          >
            <div className="h-64 w-full">
              {familyChartData.length > 0 ? (
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={familyChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      label={({ name }) => name}
                    >
                      {familyChartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-neutral-500">
                  Aucune donnée
                </div>
              )}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

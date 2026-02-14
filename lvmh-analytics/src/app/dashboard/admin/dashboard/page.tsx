"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardStatsRpc } from "@/lib/dashboardStats";
import { deriveKpis } from "@/lib/dashboardStats";
import { AdminKpiCards } from "@/components/dashboard/AdminKpiCards";
import { AdminCharts } from "@/components/dashboard/AdminCharts";
import { getMaisons } from "@/lib/taxonomy";

function AdminDashboardContent() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedMaison, setSelectedMaison] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsRpc | null>(null);
  const [maisonEmptyFallback, setMaisonEmptyFallback] = useState<string | null>(null);
  const maisons = getMaisons();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("datasets")
        .select("id")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSelectedDatasetId(data?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (selectedDatasetId === null) {
      setStats(null);
      setMaisonEmptyFallback(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMaisonEmptyFallback(null);

    (async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_dataset_id: selectedDatasetId,
        p_maison_filter: selectedMaison || null,
      });
      if (cancelled) return;
      if (error) {
        setStats(null);
        setLoading(false);
        return;
      }
      const result = data as DashboardStatsRpc;
      if (selectedMaison && result.totalClients === 0) {
        setMaisonEmptyFallback(selectedMaison);
        const { data: fallback } = await supabase.rpc("get_dashboard_stats", {
          p_dataset_id: selectedDatasetId,
          p_maison_filter: null,
        });
        if (!cancelled && fallback) setStats(fallback as DashboardStatsRpc);
      } else {
        setStats(result);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDatasetId, selectedMaison]);

  const kpis = stats ? deriveKpis(stats) : null;
  const dist = stats?.tagDistribution ?? {};

  if (!selectedDatasetId) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mb-8 text-sm text-neutral-500">
            Aucun fichier analysé. Uploadez un CSV dans Upload & Analyse.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <span className="text-xs text-neutral-500">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-10 sm:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard Analytics Luxe
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Outil décisionnel pour direction, marketing et retail. Données Supabase.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-neutral-500">
              Filtrer par maison
            </label>
            <select
              value={selectedMaison ?? ""}
              onChange={(e) => setSelectedMaison(e.target.value || null)}
              className="min-w-[200px] rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            >
              <option value="">Toutes les maisons</option>
              {maisons.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500">
              {selectedMaison ? `Stats pour ${selectedMaison} uniquement` : "Tous les graphiques."}
            </p>
          </div>
        </div>

        {maisonEmptyFallback && (
          <div className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3">
            <p className="text-sm text-amber-200">
              Aucune note ne mentionne « {maisonEmptyFallback} » dans le dataset.
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Affichage : toutes les maisons. Réanalyser le fichier pour extraire les marques.
            </p>
          </div>
        )}

        {kpis && (
          <div className="mb-10">
            <AdminKpiCards kpis={kpis} />
          </div>
        )}

        <AdminCharts dist={dist} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <span className="text-xs text-neutral-500">Chargement…</span>
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}

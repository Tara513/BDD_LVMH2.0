"use client";

import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { DashboardStatsRpc } from "@/lib/dashboardStats";
import { deriveKpis } from "@/lib/dashboardStats";
import { AdminKpiCards } from "@/components/dashboard/AdminKpiCards";
import { AdminCharts } from "@/components/dashboard/AdminCharts";

function AdminDashboardContent() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStatsRpc | null>(null);

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
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats", {
        p_dataset_id: selectedDatasetId,
        p_maison_filter: null,
      });
      if (cancelled) return;
      if (error) {
        setStats(null);
        setLoading(false);
        return;
      }
      setStats(data as DashboardStatsRpc);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedDatasetId]);

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
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Analytics Luxe
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Outil décisionnel pour direction, marketing et retail. Données Supabase.
          </p>
        </div>

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

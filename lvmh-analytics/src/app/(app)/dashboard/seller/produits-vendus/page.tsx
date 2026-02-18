"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ChartCard } from "@/components/charts/ChartCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_STYLE } from "@/components/dashboard/chartsConfig";

const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

const PRODUCT_LABELS: Record<string, string> = {
  Sac_Main: "Sac à main",
  Sac_Travail: "Sac travail",
  Sac_Voyage: "Sac voyage",
  Petite_Maroquinerie: "Petite maroquinerie",
  Sneakers: "Sneakers",
  Botte: "Bottes",
  Escarpin: "Escarpins",
};

export default function SellerProduitsVendusPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    (async () => {
      const { data: datasetRow } = await supabase
        .from("datasets")
        .select("id")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!datasetRow?.id) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const { data: notes } = await supabase
        .from("client_notes")
        .select("id")
        .eq("dataset_id", datasetRow.id)
        .limit(5000);

      const noteIds = (notes ?? []).map((n) => n.id);
      if (noteIds.length === 0) {
        setChartData([]);
        setLoading(false);
        return;
      }

      const counts: Record<string, number> = {};
      const batchSize = 500;
      for (let i = 0; i < noteIds.length; i += batchSize) {
        const batch = noteIds.slice(i, i + batchSize);
        const { data: tags } = await supabase
          .from("note_tags")
          .select("tag")
          .eq("tag_family", "Produits")
          .in("note_id", batch);
        for (const row of tags ?? []) {
          const tag = (row as { tag: string }).tag;
          counts[tag] = (counts[tag] ?? 0) + 1;
        }
      }

      const data = Object.entries(counts)
        .map(([tag, count]) => ({
          name: PRODUCT_LABELS[tag] ?? tag,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);

      setChartData(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-xs text-neutral-500">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
          Produits les plus vendus
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Produits les plus demandés ou cités dans les notes clients (dernier fichier analysé).
        </p>
      </div>

      <ChartCard
        title="Produits les plus vendus (Fendi)"
        description="Classement par nombre de mentions dans les notes — dernier dataset"
      >
        {chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/30">
            <p className="text-center text-xs text-neutral-500">
              Aucune donnée. Importez et analysez un CSV dans la partie Admin.
            </p>
          </div>
        ) : (
          <div className="min-h-0 w-full overflow-visible" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 20, bottom: 80, left: 12 }}
                barCategoryGap="18%"
              >
                <XAxis
                  dataKey="name"
                  {...AXIS_STYLE}
                  angle={-35}
                  textAnchor="end"
                  height={72}
                  interval={0}
                />
                <YAxis {...AXIS_STYLE} width={32} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={BAR_RADIUS} minPointSize={4}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

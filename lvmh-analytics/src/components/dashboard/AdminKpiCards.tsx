"use client";

import { Card } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/dashboardStats";

export function AdminKpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">Total clients</p>
        <p className="mt-1.5 text-2xl font-light tabular-nums text-neutral-50">{kpis.totalClients}</p>
      </Card>
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">Budget moyen</p>
        <p className="mt-1.5 text-2xl font-light tabular-nums text-neutral-50">
          {kpis.budgetMoyen != null ? `${(kpis.budgetMoyen / 1000).toFixed(1)}k €` : "—"}
        </p>
        <p className="mt-0.5 text-[10px] text-neutral-500">par projet d&apos;achat</p>
      </Card>
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">Part VIC</p>
        <p className="mt-1.5 text-2xl font-light tabular-nums text-neutral-50">
          {kpis.vicPct != null ? `${kpis.vicPct}%` : "—"}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">Taux de tagging taxonomie</p>
        <p className="mt-1.5 text-2xl font-light tabular-nums text-neutral-50">{kpis.taggingRate}%</p>
      </Card>
    </div>
  );
}

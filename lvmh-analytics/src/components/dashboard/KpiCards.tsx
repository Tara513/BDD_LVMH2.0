"use client";

import { Card } from "@/components/ui/card";
import type { DashboardKpis } from "@/lib/dashboardStats";

const KPI_GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6";

function KpiCell({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | string | null;
  suffix?: string;
}) {
  const display = value == null ? "—" : `${value}${suffix}`;
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1.5 text-xl font-light tabular-nums text-neutral-50">{display}</p>
    </Card>
  );
}

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  return (
    <div className={KPI_GRID}>
      <KpiCell label="Total clients analysés" value={kpis.totalClients} />
      <KpiCell
        label="% VIP / High Value"
        value={kpis.vipHighValuePct}
        suffix="%"
      />
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">
          Budget moyen
        </p>
        <p className="mt-1.5 text-xl font-light tabular-nums text-neutral-50">
          {kpis.budgetMoyen != null ? `${kpis.budgetMoyen.toLocaleString("fr-FR")} €` : "—"}
        </p>
        <p className="mt-0.5 text-[10px] text-neutral-500">
          par projet d&apos;achat (préciser : an / mois / foyer)
        </p>
      </Card>
      <KpiCell
        label="% achats urgents"
        value={kpis.achatsUrgentsPct}
        suffix="%"
      />
      <KpiCell label="Taux de tagging complet" value={kpis.taggingRate} suffix="%" />
      <Card className="p-4">
        <p className="text-[11px] uppercase tracking-wider text-neutral-500">
          % Nouveaux vs Fidèles
        </p>
        {kpis.nouveauxVsFidelesPct ? (
          <p className="mt-1.5 text-lg font-light tabular-nums text-neutral-50">
            <span className="text-neutral-400">New </span>
            {kpis.nouveauxVsFidelesPct.nouveaux}%
            <span className="mx-1.5 text-neutral-600">/</span>
            <span className="text-neutral-400">Loyal </span>
            {kpis.nouveauxVsFidelesPct.fideles}%
          </p>
        ) : (
          <p className="mt-1.5 text-xl font-light text-neutral-500">—</p>
        )}
      </Card>
    </div>
  );
}

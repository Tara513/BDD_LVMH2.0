"use client";

import { ChartCard } from "@/components/charts/ChartCard";
import { Card } from "@/components/ui/card";
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

const COLORS = ["#f5f5f5", "#e5e5e5", "#a3a3a3", "#737373", "#404040"];

const purchaseProjectsData = [
  { project: "Anniversaire", count: 48 },
  { project: "Voyage", count: 36 },
  { project: "Cadeau famille", count: 28 },
  { project: "Professionnel", count: 22 },
];

const budgetDistributionData = [
  { name: "Entry", value: 40 },
  { name: "Core", value: 35 },
  { name: "Premium", value: 18 },
  { name: "VIC", value: 7 },
];

const timingDistributionData = [
  { timing: "0–1 mois", value: 45 },
  { timing: "1–3 mois", value: 32 },
  { timing: "3–6 mois", value: 15 },
  { timing: "> 6 mois", value: 8 },
];

const productCategoriesData = [
  { category: "Sacs", value: 60 },
  { category: "Petite maroquinerie", value: 25 },
  { category: "Voyage", value: 10 },
  { category: "Sneakers", value: 5 },
];

const materialsData = [
  { material: "Cuir lisse", value: 50 },
  { material: "Cuir grainé", value: 25 },
  { material: "Toile enduite", value: 15 },
  { material: "Exotiques", value: 10 },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-[11px] text-neutral-500">Total clients</div>
          <div className="mt-1 text-2xl">400</div>
        </Card>
        <Card>
          <div className="text-[11px] text-neutral-500">Budget moyen</div>
          <div className="mt-1 text-2xl">6.8K€</div>
        </Card>
        <Card>
          <div className="text-[11px] text-neutral-500">Part VIC</div>
          <div className="mt-1 text-2xl">7%</div>
        </Card>
        <Card>
          <div className="text-[11px] text-neutral-500">Taux de tagging taxonomie</div>
          <div className="mt-1 text-2xl">82%</div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1.5fr]">
        <ChartCard title="Top Purchase Projects" description="Répartition des projets d’achat majeurs">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={purchaseProjectsData}>
                <XAxis dataKey="project" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#050505",
                    borderRadius: 8,
                    border: "1px solid #262626",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="#f5f5f5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Budget Distribution" description="Entry / Core / Premium / VIC">
          <div className="h-80 w-full overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 24, right: 200, bottom: 24, left: 24 }}>
                <Pie
                  data={budgetDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="38%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={100}
                  label={({ name, percent }) => (percent >= 0.01 ? `${(percent * 100).toFixed(1)}%` : "")}
                  labelLine={false}
                >
                  {budgetDistributionData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={10}
                  iconType="square"
                  wrapperStyle={{ paddingLeft: 16 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Timing Distribution">
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <BarChart data={timingDistributionData}>
                <XAxis dataKey="timing" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#050505",
                    borderRadius: 8,
                    border: "1px solid #262626",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#f5f5f5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Top Product Categories">
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <BarChart data={productCategoriesData}>
                <XAxis dataKey="category" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#050505",
                    borderRadius: 8,
                    border: "1px solid #262626",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#e5e5e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Materials Preferences">
          <div className="h-56 w-full">
            <ResponsiveContainer>
              <BarChart data={materialsData}>
                <XAxis dataKey="material" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#050505",
                    borderRadius: 8,
                    border: "1px solid #262626",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#a3a3a3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}


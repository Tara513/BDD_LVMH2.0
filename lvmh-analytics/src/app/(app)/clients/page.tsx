"use client";

import { useRouter } from "next/navigation";
import { mockClientSummaries } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { TagBadge } from "@/components/ui/tag-badge";

export default function ClientsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Clients</h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-900 text-left text-[11px] text-neutral-500">
                <th className="px-2 py-2">Client ID</th>
                <th className="px-2 py-2">Purchase Project</th>
                <th className="px-2 py-2">Budget Range</th>
                <th className="px-2 py-2">Tags</th>
                <th className="px-2 py-2">Timing</th>
                <th className="px-2 py-2">Langue</th>
              </tr>
            </thead>
            <tbody>
              {mockClientSummaries.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer border-b border-neutral-900 hover:bg-neutral-900/60"
                >
                  <td className="px-2 py-2">{client.externalId}</td>
                  <td className="px-2 py-2">{client.purchaseProject}</td>
                  <td className="px-2 py-2">{client.budgetRange}</td>
                  <td className="px-2 py-2">
                    {client.tags.map((t) => (
                      <TagBadge key={t} label={t} />
                    ))}
                  </td>
                  <td className="px-2 py-2">{client.timing}</td>
                  <td className="px-2 py-2">{client.language}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}


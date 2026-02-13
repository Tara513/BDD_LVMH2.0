"use client";

import { useParams, useRouter } from "next/navigation";
import { mockClientDetails } from "@/lib/mock-data";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { TagBadge } from "@/components/ui/tag-badge";
import { Button } from "@/components/ui/button";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const client = mockClientDetails.find((c) => c.id === params.id);

  if (!client) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-300">Client introuvable.</p>
        <Button onClick={() => router.push("/clients")}>Retour à la liste</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Client {client.externalId}</h1>
        <Button onClick={() => router.push("/clients")}>Retour aux clients</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1.2fr]">
        <Card>
          <CardHeader title="Note complète" />
          <CardBody>
            <p className="text-sm leading-relaxed text-neutral-100">{client.noteText}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tags" />
          <CardBody>
            <div className="mb-2 text-[11px] text-neutral-500">Motivations</div>
            <div>
              {client.motivations.map((t) => (
                <TagBadge key={t} label={t} />
              ))}
            </div>

            <div className="mt-4 mb-2 text-[11px] text-neutral-500">Produits</div>
            <div>
              {client.products.map((t) => (
                <TagBadge key={t} label={t} />
              ))}
            </div>

            <div className="mt-4 mb-2 text-[11px] text-neutral-500">Profil</div>
            <div>
              {client.profileTags.map((t) => (
                <TagBadge key={t} label={t} />
              ))}
            </div>

            <div className="mt-4 mb-2 text-[11px] text-neutral-500">Style de vie</div>
            <div>
              {client.styleTags.map((t) => (
                <TagBadge key={t} label={t} />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader title="Next Best Action" />
          <CardBody>
            <p className="text-sm leading-relaxed text-neutral-100">{client.nextBestAction}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Métadonnées" />
          <CardBody>
            <dl className="text-xs text-neutral-100">
              <div className="mb-2">
                <dt className="text-[11px] text-neutral-500">Maison principale</dt>
                <dd>{client.maison}</dd>
              </div>
              {Object.entries(client.metadata).map(([k, v]) => (
                <div key={k} className="mb-2">
                  <dt className="text-[11px] text-neutral-500">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


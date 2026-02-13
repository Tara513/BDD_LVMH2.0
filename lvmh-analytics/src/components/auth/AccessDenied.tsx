"use client";

import Link from "next/link";

export const AccessDenied = ({ message }: { message?: string }) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-900 bg-neutral-950 px-8 py-10 text-center">
        <div className="mb-4 text-4xl">🔒</div>
        <h1 className="mb-2 text-xl font-semibold text-neutral-50">Accès refusé</h1>
        <p className="mb-6 text-sm text-neutral-400">
          {message ?? "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-full bg-neutral-100 px-6 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-200"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
};

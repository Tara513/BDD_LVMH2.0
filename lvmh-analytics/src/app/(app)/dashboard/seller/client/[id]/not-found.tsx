import Link from "next/link";

export default function SellerClientNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-center">
      <h1 className="mb-2 text-lg font-semibold text-neutral-200">Fiche introuvable</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Ce client n’existe pas ou vous n’avez pas accès à cette fiche.
      </p>
      <Link
        href="/dashboard/seller"
        className="rounded-full border border-neutral-700 px-4 py-2 text-xs text-neutral-400 transition hover:bg-neutral-900 hover:text-neutral-300"
      >
        Retour aux fiches clients
      </Link>
    </div>
  );
}

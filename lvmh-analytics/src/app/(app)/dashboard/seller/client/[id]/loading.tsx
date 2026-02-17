export default function SellerClientFicheLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-neutral-800" />
      <div className="mb-8 h-10 w-48 animate-pulse rounded bg-neutral-800" />
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl border border-neutral-900 bg-neutral-900" />
        ))}
      </div>
    </div>
  );
}

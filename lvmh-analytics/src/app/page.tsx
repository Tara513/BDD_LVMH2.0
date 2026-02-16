import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
          LVMH Analytics
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          Mode & Maroquinerie – Tableau de bord et analyse des transcriptions
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/dashboard"
            className="block rounded-2xl p-8 bg-gray-800/70 border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800 transition-all duration-200 group"
          >
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
              Dashboard
            </h2>
            <p className="text-sm text-gray-400">
              Visualiser les données, motivations par maison, répartition des budgets et produits.
            </p>
          </Link>

          <Link
            href="/analyze"
            className="block rounded-2xl p-8 bg-gray-800/70 border border-gray-700 hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-200 group"
          >
            <div className="text-3xl mb-3">📁</div>
            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Importer un CSV
            </h2>
            <p className="text-sm text-gray-400">
              Charger un fichier CSV pour l’analyser et l’envoyer vers Supabase.
            </p>
          </Link>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          Utilise la taxonomie LVMH : Motivations, Produits, Segments de budget (Entry, Core, Premium, VIC).
        </p>
      </div>
    </div>
  );
}

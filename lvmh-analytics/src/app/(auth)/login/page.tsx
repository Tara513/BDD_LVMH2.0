"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setMockAuth, checkAccessCode } from "@/lib/mock-auth";

type LoginRole = "admin" | "seller";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<LoginRole>("seller");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!code.trim()) {
        setError("Veuillez entrer le code d'accès.");
        setSubmitting(false);
        return;
      }

      if (!checkAccessCode(role, code.trim())) {
        setError("Code incorrect pour ce rôle.");
        setSubmitting(false);
        return;
      }

      setMockAuth(role);
      router.push(role === "seller" ? "/dashboard/seller" : "/dashboard/admin/upload");
      router.refresh();
    } catch (err) {
      setError("Une erreur inattendue s'est produite.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-900 bg-neutral-950 px-8 py-10 shadow-lg">
        <div className="mb-6">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400">FENDI</div>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-50">Sign in</h1>
          <p className="mt-2 text-xs text-neutral-500">Choisissez votre accès et entrez le code.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs text-neutral-400">Accès</label>
            <div className="flex gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={role === "seller"}
                  onChange={() => setRole("seller")}
                  disabled={submitting}
                  className="border-neutral-600 bg-neutral-900 text-neutral-100 focus:ring-neutral-500"
                />
                <span className="text-xs text-neutral-300">Vendeur</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === "admin"}
                  onChange={() => setRole("admin")}
                  disabled={submitting}
                  className="border-neutral-600 bg-neutral-900 text-neutral-100 focus:ring-neutral-500"
                />
                <span className="text-xs text-neutral-300">Admin</span>
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-400">Code d&apos;accès</label>
            <input
              type="password"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
              placeholder="Entrez le code"
              className="w-full rounded-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:cursor-default disabled:opacity-50"
          >
            {submitting ? "Connexion..." : "Accéder à l'app"}
          </button>

          {error && (
            <div className="mt-2 rounded-full border border-red-900 bg-red-950 px-3 py-2 text-[11px] text-red-300">
              {error}
            </div>
          )}

          <p className="mt-4 text-center text-[10px] text-neutral-600">
            Codes : Admin → admin1 &nbsp;·&nbsp; Vendeur → vendeur1
          </p>
        </form>
      </div>
    </div>
  );
}

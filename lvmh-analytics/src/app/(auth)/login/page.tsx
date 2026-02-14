"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { UserRole } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRedirectPath = (role: UserRole): string => {
    switch (role) {
      case "admin":
        return "/dashboard/admin";
      case "analyst":
        return "/dashboard/analytics";
      case "seller":
        return "/dashboard/seller";
      default:
        return "/dashboard/analytics";
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Étape 1: Authentification Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.session) {
        setError(authError?.message ?? "Impossible de se connecter.");
        setSubmitting(false);
        return;
      }

      // Étape 2: Récupérer l'utilisateur via getUser()
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Erreur lors de la récupération de l'utilisateur.");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      // Étape 3: Récupérer le profil dans la table profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Étape 4: Si pas de profil → afficher message d'erreur
      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError("Votre compte n'a pas été configuré. Veuillez contacter l'administrateur.");
        setSubmitting(false);
        return;
      }

      // Étape 5: Vérifier le champ role et rediriger
      const role = profile.role as UserRole;

      if (!role || !["admin", "analyst", "seller"].includes(role)) {
        await supabase.auth.signOut();
        setError("Rôle utilisateur invalide. Veuillez contacter l'administrateur.");
        setSubmitting(false);
        return;
      }

      // Rediriger selon le rôle
      const redirectPath = getRedirectPath(role);
      router.push(redirectPath);
      router.refresh();
    } catch (err) {
      setError("Une erreur inattendue s'est produite.");
      await supabase.auth.signOut();
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-900 bg-neutral-950 px-8 py-10 shadow-lg">
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.35em] text-neutral-500">LVMH</div>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-50">Sign in</h1>
          <p className="mt-2 text-xs text-neutral-500">Accédez au module d&apos;analyse clients &amp; taxonomie.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-neutral-400">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              className="w-full rounded-full border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-200 disabled:cursor-default disabled:opacity-50"
          >
            {submitting ? "Connexion..." : "Sign in"}
          </button>

          {error && (
            <div className="mt-2 rounded-full border border-red-900 bg-red-950 px-3 py-2 text-[11px] text-red-300">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

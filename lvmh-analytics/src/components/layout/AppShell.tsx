"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

function getRedirectPath(role: string | null): string {
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
}

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { session, loading, role, profile } = useSupabaseAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!session || !profile)) {
      router.push("/login");
    }
  }, [loading, session, profile, router]);

  // Vendeur sur /dashboard → rediriger une seule fois vers la liste des fiches (évite boucle de rendu)
  useEffect(() => {
    if (loading || !role || pathname !== "/dashboard") return;
    if (role === "seller") {
      router.replace("/dashboard/seller");
    }
  }, [loading, role, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100">
        <span className="text-xs text-neutral-500">Chargement…</span>
      </div>
    );
  }

  if (!session || !profile) {
    return null;
  }

  // Protection basée sur les rôles pour les dashboards
  if (pathname?.startsWith("/dashboard/admin")) {
    if (role !== "admin") {
      const redirectPath = getRedirectPath(role);
      router.push(redirectPath);
      return null;
    }
  }

  if (pathname?.startsWith("/dashboard/analytics")) {
    if (role !== "analyst" && role !== "admin") {
      const redirectPath = getRedirectPath(role);
      router.push(redirectPath);
      return null;
    }
  }

  if (pathname?.startsWith("/dashboard/seller")) {
    if (role !== "seller" && role !== "admin") {
      const redirectPath = getRedirectPath(role);
      router.push(redirectPath);
      return null;
    }
  }

  // Pendant la redirection vendeur /dashboard → /dashboard/seller, afficher le chargement au lieu de null
  if (pathname === "/dashboard" && role === "seller") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100">
        <span className="text-xs text-neutral-500">Redirection…</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-50">
      <Sidebar role={role ?? "analyst"} />
      <div className="ml-60 flex min-h-screen flex-1 flex-col border-l border-neutral-900">
        <Header />
        <main className="flex-1 bg-neutral-950 px-8 py-6 text-neutral-100">{children}</main>
      </div>
    </div>
  );
};

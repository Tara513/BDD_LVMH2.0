"use client";

import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const FENDI_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#000"><rect x="5" y="5" width="14" height="90"/><rect x="5" y="5" width="50" height="14"/><rect x="5" y="43" width="38" height="14"/><rect x="81" y="5" width="14" height="90"/><rect x="45" y="81" width="50" height="14"/><rect x="57" y="43" width="38" height="14"/></g></svg>`)}`;

function getRedirectPath(role: string | null): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin/upload";
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
    <div className="flex min-h-screen text-neutral-50">
      <Sidebar role={role ?? "analyst"} />
      <div
        className="ml-60 flex min-h-screen flex-1 flex-col border-l border-neutral-900"
        style={{
          backgroundColor: "#171717",
          backgroundImage: `url(${FENDI_LOGO_SVG})`,
          backgroundRepeat: "repeat",
          backgroundSize: "100px",
          backgroundPosition: "0 0",
        }}
      >
        <Header />
        <main className="flex-1 px-8 py-6 text-neutral-100">{children}</main>
      </div>
    </div>
  );
};

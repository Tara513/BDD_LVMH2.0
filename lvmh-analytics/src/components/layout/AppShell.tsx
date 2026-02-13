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

  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-50">
      <Sidebar role={role ?? "analyst"} />
      <div className="flex flex-1 flex-col border-l border-neutral-900">
        <Header />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
};

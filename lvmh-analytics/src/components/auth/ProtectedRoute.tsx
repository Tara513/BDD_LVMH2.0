"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import type { UserRole } from "@/types/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
};

export const ProtectedRoute = ({ children, allowedRoles, fallbackPath = "/dashboard" }: ProtectedRouteProps) => {
  const { session, loading, role } = useSupabaseAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100">
        <span className="text-xs text-neutral-500">Chargement…</span>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    router.push(fallbackPath);
    return null;
  }

  return <>{children}</>;
};

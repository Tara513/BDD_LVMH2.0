"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { hasMockAuthCookie, clearMockAuth } from "@/lib/mock-auth";
import type { UserRole } from "@/types/auth";

const NAV_ITEMS_BY_ROLE: Record<UserRole, Array<{ href: string; label: string }>> = {
  seller: [
    { href: "/dashboard/seller", label: "Dashboard" },
  ],
  analyst: [
    { href: "/dashboard/analytics", label: "Dashboard" },
  ],
  admin: [
    { href: "/dashboard/admin/upload", label: "Upload & Analyse" },
    { href: "/dashboard/admin/dashboard", label: "Dashboard" },
  ],
};

export const Sidebar = ({ role }: { role: UserRole }) => {
  const pathname = usePathname();
  const navItems = NAV_ITEMS_BY_ROLE[role] ?? NAV_ITEMS_BY_ROLE.analyst;

  const handleLogout = async () => {
    if (hasMockAuthCookie()) {
      clearMockAuth();
      window.location.href = "/login";
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <aside className="flex w-60 flex-col border-r border-neutral-900 bg-neutral-950 px-6 py-6">
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.35em] text-neutral-500">LVMH</div>
        <div className="mt-2 text-xs text-neutral-500">Client Analytics Suite</div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-xs ${
                active ? "bg-neutral-900 text-neutral-50" : "text-neutral-400 hover:bg-neutral-900/70"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 rounded-full border border-neutral-800 px-3 py-2 text-[11px] text-neutral-400 hover:bg-neutral-900"
      >
        Logout
      </button>
    </aside>
  );
};

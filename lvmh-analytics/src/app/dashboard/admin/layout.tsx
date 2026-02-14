"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-neutral-950 text-neutral-50">
      <Sidebar role="admin" />
      <div className="ml-60 flex min-h-screen flex-1 flex-col border-l border-neutral-900">
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

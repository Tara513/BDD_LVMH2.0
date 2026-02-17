"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

const FENDI_LOGO_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#000"><rect x="5" y="5" width="14" height="90"/><rect x="5" y="5" width="50" height="14"/><rect x="5" y="43" width="38" height="14"/><rect x="81" y="5" width="14" height="90"/><rect x="45" y="81" width="50" height="14"/><rect x="57" y="43" width="38" height="14"/></g></svg>`)}`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen text-neutral-50">
      <Sidebar role="admin" />
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
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}

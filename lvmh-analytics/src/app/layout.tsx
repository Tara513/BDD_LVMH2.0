import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LVMH Analytics",
  description: "LVMH-style client analytics tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-950 text-neutral-50 min-h-screen">{children}</body>
    </html>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function AnalyticsDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "analyst" && profile.role !== "admin")) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <div className="mx-auto max-w-7xl px-8 py-12">
        <h1 className="mb-8 text-3xl font-semibold">Dashboard Analytics</h1>
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-8">
          <p className="text-sm text-neutral-400">Bienvenue sur le tableau de bord analytics.</p>
        </div>
      </div>
    </div>
  );
}

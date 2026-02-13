import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { UserRole } from "@/types/auth";

async function getRedirectPath(role: UserRole): Promise<string> {
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!profile) {
    redirect("/login");
  }

  const role = profile.role as UserRole;

  return <>{children}</>;
}

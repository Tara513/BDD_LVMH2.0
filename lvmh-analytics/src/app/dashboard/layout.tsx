import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import type { UserRole } from "@/types/auth";

const MOCK_AUTH_COOKIE = "lvmh_mock_auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const mockAuth = cookieStore.get(MOCK_AUTH_COOKIE)?.value === "1";

  if (mockAuth) {
    return <>{children}</>;
  }

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

  return <>{children}</>;
}

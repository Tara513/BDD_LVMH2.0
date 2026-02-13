import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/types/auth";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Route login : rediriger si déjà connecté avec profil valide
  if (pathname.startsWith("/login")) {
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role) {
        const role = profile.role as UserRole;
        const redirectPath = getRedirectPath(role);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
    return response;
  }

  // Routes protégées : rediriger vers login si non connecté
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Vérifier que le profil existe
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  // Si pas de profil → déconnecter et rediriger vers login
  if (profileError || !profile) {
    await supabase.auth.signOut();
    response.cookies.delete("lvmh_user_session");
    response.cookies.delete("lvmh_user_role");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = profile.role as UserRole;

  // Stocker le rôle dans les cookies pour les composants clients
  response.cookies.set("lvmh_user_role", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Protection basée sur les rôles pour les dashboards
  if (pathname.startsWith("/dashboard/admin")) {
    if (role !== "admin") {
      const redirectPath = getRedirectPath(role);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  if (pathname.startsWith("/dashboard/analytics")) {
    if (role !== "analyst" && role !== "admin") {
      const redirectPath = getRedirectPath(role);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  if (pathname.startsWith("/dashboard/seller")) {
    if (role !== "seller" && role !== "admin") {
      const redirectPath = getRedirectPath(role);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  return response;
}

function getRedirectPath(role: UserRole): string {
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

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
  ],
};

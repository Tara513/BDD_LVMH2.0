import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MOCK_AUTH_COOKIE = "lvmh_mock_auth";
const MOCK_ROLE_COOKIE = "lvmh_mock_role";

type Role = "admin" | "analyst" | "seller";

function getRole(request: NextRequest): Role | null {
  const auth = request.cookies.get(MOCK_AUTH_COOKIE)?.value;
  const role = request.cookies.get(MOCK_ROLE_COOKIE)?.value as Role | undefined;
  if (auth !== "1" || !role) return null;
  if (role === "admin" || role === "analyst" || role === "seller") return role;
  return null;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/login")) {
    const role = getRole(request);
    if (role) {
      const redirect =
        role === "admin"
          ? "/dashboard/admin/upload"
          : role === "analyst"
            ? "/dashboard/analytics"
            : "/dashboard/seller";
      return NextResponse.redirect(new URL(redirect, request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/taxonomy") ||
    pathname.startsWith("/clients")
  ) {
    const role = getRole(request);
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname === "/dashboard" && role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin/upload", request.url));
    }

    if (pathname.startsWith("/dashboard/admin")) {
      if (role !== "admin") {
        const to =
          role === "analyst"
            ? "/dashboard/analytics"
            : "/dashboard/seller";
        return NextResponse.redirect(new URL(to, request.url));
      }
    }

    if (pathname.startsWith("/dashboard/analytics")) {
      if (role !== "admin" && role !== "analyst") {
        return NextResponse.redirect(new URL("/dashboard/seller", request.url));
      }
    }

    if (pathname.startsWith("/dashboard/seller")) {
      if (role !== "admin" && role !== "seller") {
        return NextResponse.redirect(new URL("/dashboard/analytics", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/upload/:path*", "/taxonomy/:path*", "/clients/:path*"],
};

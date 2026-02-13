import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware simplifié : pas d'auth Supabase côté edge.
 * Toutes les routes sont accessibles pour le dashboard et l'analyse (taxonomie LVMH).
 * Pour réactiver l'auth plus tard, réinstaller @supabase/ssr et restaurer la logique.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

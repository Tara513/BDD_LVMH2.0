/**
 * Auth factice : accès par rôle (Admin / Vendeur) + code.
 * À remplacer par la vraie auth Supabase plus tard.
 */

const MOCK_AUTH_COOKIE = "lvmh_mock_auth";
const MOCK_ROLE_COOKIE = "lvmh_mock_role";
const COOKIE_MAX_AGE_DAYS = 7;

/** Codes d'accès par rôle (à modifier selon tes besoins) */
export const ACCESS_CODES: Record<"admin" | "seller", string> = {
  admin: "admin1",
  seller: "vendeur1",
};

export type UserRole = "admin" | "analyst" | "seller";

export function checkAccessCode(role: "admin" | "seller", code: string): boolean {
  return code.trim().toLowerCase() === ACCESS_CODES[role].toLowerCase();
}

export function setMockAuth(role: UserRole = "analyst") {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${MOCK_AUTH_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `${MOCK_ROLE_COOKIE}=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearMockAuth() {
  if (typeof document === "undefined") return;
  document.cookie = `${MOCK_AUTH_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${MOCK_ROLE_COOKIE}=; path=/; max-age=0`;
}

export function getMockRoleFromCookie(): UserRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${MOCK_ROLE_COOKIE}=([^;]+)`));
  const role = match?.[2];
  if (role === "admin" || role === "analyst" || role === "seller") return role;
  return null;
}

export function hasMockAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${MOCK_AUTH_COOKIE}=1`);
}

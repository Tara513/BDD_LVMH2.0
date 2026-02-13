import { cookies } from "next/headers";
import { createClient } from "./supabase-server";
import type { UserSessionData } from "@/types/auth";

const SESSION_COOKIE_NAME = "lvmh_user_session";
const ROLE_COOKIE_NAME = "lvmh_user_role";
const HOUSE_ID_COOKIE_NAME = "lvmh_house_id";

/**
 * Store user session data in secure HTTP-only cookies
 */
export async function setUserSessionData(data: UserSessionData) {
  const cookieStore = cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, data.userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  cookieStore.set(ROLE_COOKIE_NAME, data.role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  if (data.houseId) {
    cookieStore.set(HOUSE_ID_COOKIE_NAME, data.houseId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }
}

/**
 * Clear user session cookies
 */
export async function clearUserSessionData() {
  const cookieStore = cookies();
  
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(ROLE_COOKIE_NAME);
  cookieStore.delete(HOUSE_ID_COOKIE_NAME);
}

/**
 * Get user session data from cookies (server-side only)
 */
export async function getUserSessionData(): Promise<UserSessionData | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const role = cookieStore.get(ROLE_COOKIE_NAME)?.value as UserSessionData["role"] | undefined;
  const houseId = cookieStore.get(HOUSE_ID_COOKIE_NAME)?.value;

  if (!userId || !role) {
    return null;
  }

  return {
    userId,
    role,
    houseId: houseId || null,
  };
}

/**
 * Fetch and validate user profile from database
 */
export async function fetchAndValidateProfile(userId: string) {
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, house_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return { profile: null, error: error?.message || "Profile not found" };
  }

  return { profile, error: null };
}

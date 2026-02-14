"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { hasMockAuthCookie, getMockRoleFromCookie } from "@/lib/mock-auth";
import type { UserRole, UserProfile } from "@/types/auth";

export function useSupabaseAuth() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<
    Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] | object | null
  >(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [houseId, setHouseId] = useState<string | null>(null);

  const applyMockAuth = () => {
    const mockRole = getMockRoleFromCookie();
    if (mockRole) {
      setSession({});
      setProfile({ id: "mock", role: mockRole });
      setRole(mockRole);
      setHouseId(null);
    }
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setRole(data.role as UserRole);
        setHouseId(data.house_id || null);
      } else {
        await supabase.auth.signOut();
        setRole(null);
        setProfile(null);
        setHouseId(null);
      }
    } catch (error) {
      await supabase.auth.signOut();
      setRole(null);
      setProfile(null);
      setHouseId(null);
    }
  };

  useEffect(() => {
    if (hasMockAuthCookie()) {
      applyMockAuth();
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const currentSession = data.session ?? null;
      setSession(currentSession);
      if (currentSession?.user?.id) {
        fetchProfile(currentSession.user.id);
      } else {
        setRole(null);
        setProfile(null);
        setHouseId(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (hasMockAuthCookie()) {
        applyMockAuth();
        return;
      }
      setSession(newSession);
      if (newSession?.user?.id) {
        await fetchProfile(newSession.user.id);
      } else {
        setRole(null);
        setProfile(null);
        setHouseId(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, role, profile, houseId };
}

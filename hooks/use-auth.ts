"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import { logger } from "@/lib/logger";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    logger.error("[use-auth] Failed to fetch profile:", error.message);
    return null;
  }
  return data;
}

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading, clearAuth } =
    useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Initial hydration — always validate against server
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const p = await fetchProfile(data.user.id);
        setProfile(p);
      } else {
        clearAuth();
      }
      setLoading(false);
    });

    // Keep profile in sync with auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const p = await fetchProfile(session.user.id);
        setProfile(p);
      } else {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile, setLoading, clearAuth]);

  return {
    profile,
    isLoading,
    isAuthenticated: !!profile,
    role: profile?.role ?? null,
    isAdmin: profile?.role === "admin",
    isManager: profile?.role === "manager" || profile?.role === "admin",
  };
}

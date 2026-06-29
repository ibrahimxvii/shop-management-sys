import { createClient } from "@/lib/supabase/server";
import type { LoginHistoryEntry } from "@/types/settings";

export const securityService = {
  async getLoginHistory(
    userId: string,
    limit = 20
  ): Promise<LoginHistoryEntry[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("login_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as LoginHistoryEntry[];
  },

  async recordLogin(
    userId: string,
    status: "success" | "failed",
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    const supabase = await createClient();
    await supabase.from("login_history").insert({
      user_id: userId,
      status,
      user_agent: userAgent ?? null,
      ip_address: ipAddress ?? null,
    });
  },

  async logoutAllDevices(): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw new Error(error.message);
  },
};

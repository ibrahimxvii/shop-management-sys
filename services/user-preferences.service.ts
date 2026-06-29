import { createClient } from "@/lib/supabase/server";
import type { UserPreferences } from "@/types/settings";

type PrefsUpsert = Partial<
  Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at">
>;

export const userPreferencesService = {
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return (data as UserPreferences) ?? null;
  },

  async upsertPreferences(
    userId: string,
    prefs: PrefsUpsert
  ): Promise<UserPreferences> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as UserPreferences;
  },
};

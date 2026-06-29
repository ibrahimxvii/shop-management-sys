import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { ProfileUpdateValues } from "@/lib/validations/profile";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const profileService = {
  async getProfile(userId: string): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateProfile(userId: string, updates: ProfileUpdateValues): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: updates.full_name,
        avatar_url: updates.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },
};

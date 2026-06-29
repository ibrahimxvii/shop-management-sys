import { createClient } from "@/lib/supabase/server";
import type { ShopSettings } from "@/types/settings";

export const settingsService = {
  async getSettings(): Promise<ShopSettings> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .single();
    if (error) throw new Error(error.message);
    return data as ShopSettings;
  },

  async updateSettings(
    id: string,
    updates: Partial<Omit<ShopSettings, "id" | "created_at" | "updated_at">>
  ): Promise<ShopSettings> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ShopSettings;
  },
};

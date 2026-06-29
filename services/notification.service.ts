import { createClient } from "@/lib/supabase/server";
import type { Notification, NotificationFilters } from "@/types/notifications";

export const notificationService = {
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filters?.read !== undefined) {
      query = query.eq("read", filters.read);
    }
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit ?? 20) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Notification[];
  },

  async getUnreadCount(): Promise<number> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) return 0;
    return count ?? 0;
  },

  async markAsRead(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async markAllAsRead(): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) throw new Error(error.message);
  },

  async deleteNotification(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
  },

  async deleteAllRead(): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("read", true);
    if (error) throw new Error(error.message);
  },
};

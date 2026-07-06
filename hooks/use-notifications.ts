"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getNotificationsAction,
  getUnreadCountAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
  deleteAllReadNotificationsAction,
} from "@/app/actions/notification.actions";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth.store";
import type { NotificationFilters } from "@/types/notifications";
import type { Database } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

const KEYS = {
  all: ["notifications"] as const,
  list: (filters?: NotificationFilters) => ["notifications", "list", filters] as const,
  unread: () => ["notifications", "unread"] as const,
};

export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: async () => {
      const result = await getNotificationsAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to load notifications");
      return result.data ?? [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute for new notifications
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unread(),
    queryFn: async () => {
      const result = await getUnreadCountAction();
      return result.data ?? 0;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await markNotificationReadAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to mark as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.success) throw new Error(result.error ?? "Failed to mark all as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
      toast.success("All notifications marked as read");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteNotificationAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete notification");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

/**
 * Realtime push on top of the existing 60s poll in useNotifications/
 * useUnreadCount (kept as a fallback in case a socket drops). RLS already
 * scopes notifications to `auth.uid() = user_id`, so no new access-control
 * surface is introduced by subscribing.
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (!profile) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          const notification = payload.new as NotificationRow;
          queryClient.invalidateQueries({ queryKey: KEYS.all });
          toast(notification.title, { description: notification.message });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, queryClient]);
}

export function useDeleteAllReadNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await deleteAllReadNotificationsAction();
      if (!result.success) throw new Error(result.error ?? "Failed to delete read notifications");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Read notifications cleared");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

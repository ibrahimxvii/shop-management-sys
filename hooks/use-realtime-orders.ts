"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to order INSERT/UPDATE events. Invalidates the TanStack Query
 * caches that read from `orders` (the /orders list + POS screens) AND calls
 * router.refresh() — the dashboard/analytics pages are Server Components
 * with no client-side query cache, so a live update there can only come
 * from a server-render refresh.
 */
export function useRealtimeOrders() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, router]);
}

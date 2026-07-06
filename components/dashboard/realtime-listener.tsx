"use client";

import { useRealtimeOrders } from "@/hooks/use-realtime-orders";
import { useRealtimeNotifications } from "@/hooks/use-notifications";

/**
 * No visible UI — mounts the order/notification realtime subscriptions for
 * the lifetime of the dashboard layout. Rendered once in the layout so
 * every dashboard page benefits without each page wiring it up itself.
 */
export function RealtimeListener() {
  useRealtimeOrders();
  useRealtimeNotifications();
  return null;
}

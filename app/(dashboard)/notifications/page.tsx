"use client";

import { useState } from "react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/notification-item";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllReadNotifications,
} from "@/hooks/use-notifications";
import type { NotificationType } from "@/types/notifications";
import { Bell, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterType = "all" | NotificationType;

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Orders", value: "new_order" },
  { label: "Cancelled", value: "cancelled_order" },
  { label: "Refunds", value: "refund_request" },
  { label: "Low Stock", value: "low_stock" },
  { label: "System", value: "system" },
];

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const { data: notifications = [], isLoading } = useNotifications({
    type: typeFilter === "all" ? undefined : typeFilter,
    read: readFilter === "all" ? undefined : readFilter === "read",
    limit: 100,
  });

  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();
  const { mutate: deleteOne } = useDeleteNotification();
  const { mutate: deleteAllRead, isPending: deletingAll } = useDeleteAllReadNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Notifications" }]} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllRead()}
                disabled={markingAll}
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAllRead()}
              disabled={deletingAll}
              className="text-muted-foreground"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Clear read
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          {(["all", "unread", "read"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setReadFilter(opt)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                readFilter === opt
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <Bell className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No notifications found.</p>
        </div>
      ) : (
        <div className="rounded-xl border divide-y">
          {notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={!n.read ? markRead : undefined}
              onDelete={deleteOne}
            />
          ))}
        </div>
      )}
    </div>
  );
}

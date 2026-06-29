"use client";

import { cn, formatRelativeTime } from "@/lib/utils";
import type { Notification } from "@/types/notifications";
import {
  AlertTriangle,
  ShoppingCart,
  XCircle,
  RotateCcw,
  Bell,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG = {
  low_stock: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  new_order: {
    icon: ShoppingCart,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  cancelled_order: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  refund_request: {
    icon: RotateCcw,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  system: {
    icon: Bell,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  compact,
}: NotificationItemProps) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.system;
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "group flex gap-3 rounded-lg p-3 transition-colors",
        notification.read ? "opacity-60" : "bg-primary/3",
        compact ? "hover:bg-accent" : "hover:bg-muted/50"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          cfg.bg
        )}
      >
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p
            className={cn(
              "text-sm leading-snug",
              notification.read ? "font-normal" : "font-semibold"
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          {formatRelativeTime(notification.created_at)}
        </p>
      </div>

      {/* Actions */}
      {!compact && (
        <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!notification.read && onMarkRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onMarkRead(notification.id)}
              title="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(notification.id)}
              title="Delete"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

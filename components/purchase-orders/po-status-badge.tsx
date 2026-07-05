import { cn } from "@/lib/utils";
import type { PurchaseOrderStatus } from "@/types/purchase-orders";

const PO_STATUS_CONFIG: Record<PurchaseOrderStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  received: {
    label: "Received",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400",
  },
};

interface PoStatusBadgeProps {
  status: PurchaseOrderStatus;
  className?: string;
}

export function PoStatusBadge({ status, className }: PoStatusBadgeProps) {
  const config = PO_STATUS_CONFIG[status] ?? { label: status, className: "" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

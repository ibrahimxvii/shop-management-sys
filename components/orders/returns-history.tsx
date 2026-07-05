"use client";

import { Undo2 } from "lucide-react";
import { useOrderReturns } from "@/hooks/use-orders";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReturnsHistoryProps {
  orderId: string;
}

export function ReturnsHistory({ orderId }: ReturnsHistoryProps) {
  const { data: returns = [] } = useOrderReturns(orderId);

  if (returns.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <Undo2 className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold text-sm">Returns & Refunds</h2>
      </div>
      <div className="divide-y">
        {returns.map((r) => (
          <div key={r.id} className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{formatDate(r.created_at)}</p>
              <span className="text-sm font-semibold text-destructive">
                −{formatCurrency(r.refund_amount)}
              </span>
            </div>
            <ul className="space-y-1">
              {r.items.map((item) => (
                <li key={item.id} className="text-sm">
                  {item.quantity} × {item.product?.name ?? "Deleted product"}
                </li>
              ))}
            </ul>
            {r.reason && <p className="text-xs text-muted-foreground italic">{r.reason}</p>}
            <p className="text-xs text-muted-foreground capitalize">
              Refunded via {r.refund_method.replace("_", " ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

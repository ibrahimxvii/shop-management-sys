"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOrderReturns, useProcessReturn } from "@/hooks/use-orders";
import { formatCurrency } from "@/lib/utils";
import type { OrderWithRelations } from "@/types/orders";

interface ReturnDialogProps {
  order: OrderWithRelations;
  trigger: React.ReactNode;
}

export function ReturnDialog({ order, trigger }: ReturnDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState("");
  const [refundMethod, setRefundMethod] = React.useState(order.payment_method);

  const { data: returns = [] } = useOrderReturns(order.id);
  const processReturn = useProcessReturn();

  const returnedByItem = React.useMemo(() => {
    const map: Record<string, number> = {};
    returns.forEach((r) => {
      r.items.forEach((ri) => {
        map[ri.order_item_id] = (map[ri.order_item_id] ?? 0) + ri.quantity;
      });
    });
    return map;
  }, [returns]);

  const returnableItems = order.items
    .map((item) => {
      const alreadyReturned = returnedByItem[item.id] ?? 0;
      const remaining = item.quantity - alreadyReturned;
      const unitRefund = item.total_price / item.quantity;
      return { item, alreadyReturned, remaining, unitRefund };
    })
    .filter((row) => row.remaining > 0);

  const refundTotal = returnableItems.reduce((sum, row) => {
    const qty = quantities[row.item.id] ?? 0;
    return sum + qty * row.unitRefund;
  }, 0);

  const hasSelection = Object.values(quantities).some((q) => q > 0);

  const handleQuantityChange = (orderItemId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(value, max));
    setQuantities((prev) => ({ ...prev, [orderItemId]: clamped }));
  };

  const handleSubmit = async () => {
    const items = returnableItems
      .map((row) => ({ order_item_id: row.item.id, quantity: quantities[row.item.id] ?? 0 }))
      .filter((i) => i.quantity > 0);

    if (items.length === 0) return;

    const result = await processReturn.mutateAsync({
      order_id: order.id,
      items,
      reason: reason || undefined,
      refund_method: refundMethod,
    });

    if (result?.id) {
      setOpen(false);
      setQuantities({});
      setReason("");
      router.refresh();
    }
  };

  return (
    <>
      {React.cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
        onClick: () => setOpen(true),
      })}
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Process Return"
        description="Select items and quantities being returned. Stock will be restocked and a refund recorded."
        size="lg"
      >
        <div className="space-y-4">
          {returnableItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              All items on this order have already been fully returned.
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {returnableItems.map(({ item, alreadyReturned, remaining, unitRefund }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product?.name ?? "Deleted product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ordered {item.quantity}
                      {alreadyReturned > 0 && ` · Returned ${alreadyReturned}`} · {formatCurrency(unitRefund)} each
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max={remaining}
                    value={quantities[item.id] ?? 0}
                    onChange={(e) =>
                      handleQuantityChange(item.id, Number(e.target.value) || 0, remaining)
                    }
                    className="h-8 w-20 text-sm text-right"
                  />
                </div>
              ))}
            </div>
          )}

          {returnableItems.length > 0 && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Refund Method</Label>
                <Select
                  value={refundMethod}
                  onValueChange={(v) => setRefundMethod(v as typeof refundMethod)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Why is this being returned?"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2.5">
                <span className="text-sm font-medium">Refund Total</span>
                <span className="text-base font-semibold">{formatCurrency(refundTotal)}</span>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!hasSelection || processReturn.isPending}
                  isLoading={processReturn.isPending}
                  loadingText="Processing…"
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Process Return
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

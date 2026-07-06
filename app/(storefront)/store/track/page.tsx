"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { storefrontTrackOrderSchema, type StorefrontTrackOrderValues } from "@/lib/validations/storefront";
import { useTrackStorefrontOrder } from "@/hooks/use-storefront";
import { formatCurrency } from "@/lib/utils";
import type { StorefrontOrderStatus } from "@/types/storefront";

function TrackOrderForm() {
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<StorefrontOrderStatus | null>(null);
  const trackOrder = useTrackStorefrontOrder();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StorefrontTrackOrderValues>({
    resolver: zodResolver(storefrontTrackOrderSchema),
    defaultValues: {
      orderNumber: searchParams.get("orderNumber") ?? "",
      phone: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setOrder(null);
    try {
      const result = await trackOrder.mutateAsync(values);
      setOrder(result);
    } catch {
      // error surfaced via trackOrder.error below
    }
  });

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <PackageSearch className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Track Your Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your order number and the phone number you used at checkout.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="orderNumber">Order Number</Label>
          <Input id="orderNumber" placeholder="ORD-20260706-0001" {...register("orderNumber")} />
          {errors.orderNumber && <p className="text-xs text-destructive">{errors.orderNumber.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <Button type="submit" className="w-full" isLoading={trackOrder.isPending}>
          Track Order
        </Button>
        {trackOrder.isError && (
          <p className="text-center text-sm text-destructive">
            {trackOrder.error instanceof Error ? trackOrder.error.message : "Order not found"}
          </p>
        )}
      </form>

      {order && (
        <div className="rounded-xl border bg-card p-6 shadow-card space-y-6">
          <OrderTimeline status={order.status} />
          <div className="space-y-2 border-t pt-4">
            {(order.items ?? []).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="tabular-nums">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.grand_total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoreTrackPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>}>
      <TrackOrderForm />
    </Suspense>
  );
}

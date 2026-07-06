import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { storefrontService } from "@/services/storefront.service";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ phone?: string }>;
}

export default async function OrderConfirmationPage({ params, searchParams }: Props) {
  const { orderNumber } = await params;
  const { phone } = await searchParams;

  if (!phone) notFound();
  const order = await storefrontService.trackOrder(orderNumber, phone);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-xl space-y-6 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Order Placed!</h1>
        <p className="mt-1 text-muted-foreground">
          Order <span className="font-mono font-medium text-foreground">{order.order_number}</span> has been received.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card text-left space-y-6">
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

      <div className="flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/store/products">Continue Shopping</Link>
        </Button>
        <Button asChild>
          <Link href={`/store/track?orderNumber=${order.order_number}`}>Track This Order</Link>
        </Button>
      </div>
    </div>
  );
}

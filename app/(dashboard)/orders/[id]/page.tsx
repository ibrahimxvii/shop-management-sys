import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil, FileText, ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import { OrderStatusUpdater } from "@/components/orders/order-status-updater";
import { orderService } from "@/services/order.service";

export const metadata: Metadata = {
  title: "Order Details",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await orderService.getOrderById(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <Breadcrumb
            items={[
              { label: "Orders", href: "/orders" },
              { label: order.order_number },
            ]}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {order.order_number}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}/invoice`}>
              <FileText className="mr-2 h-4 w-4" />
              Invoice
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/orders/${order.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: items + notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-sm">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Unit Price</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Disc %</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.product?.name ?? "Deleted product"}</p>
                        {item.product?.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-right">
                        {item.discount_percent > 0 ? `${item.discount_percent}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t px-5 py-4">
              <div className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span className="text-destructive">−{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                {order.tax_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span>+{formatCurrency(order.tax_amount)}</span>
                  </div>
                )}
                {order.shipping_amount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>+{formatCurrency(order.shipping_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Grand Total</span>
                  <span>{formatCurrency(order.grand_total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-card shadow-card p-5">
              <h2 className="font-semibold text-sm mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right: customer + payment info */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border bg-card shadow-card p-5">
            <h2 className="font-semibold text-sm mb-3">Customer</h2>
            {order.customer ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.customer.full_name}</p>
                {order.customer.email && (
                  <p className="text-muted-foreground">{order.customer.email}</p>
                )}
                {order.customer.phone && (
                  <p className="text-muted-foreground">{order.customer.phone}</p>
                )}
                {(order.customer.address || order.customer.city) && (
                  <div className="pt-1 text-muted-foreground">
                    {order.customer.address && <p>{order.customer.address}</p>}
                    {[order.customer.city, order.customer.state, order.customer.postal_code]
                      .filter(Boolean)
                      .join(", ") && (
                      <p>
                        {[order.customer.city, order.customer.state, order.customer.postal_code]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                    {order.customer.country && <p>{order.customer.country}</p>}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Walk-in / No customer</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="rounded-xl border bg-card shadow-card p-5">
            <h2 className="font-semibold text-sm mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">
                  {order.payment_method.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <PaymentStatusBadge status={order.payment_status} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{formatCurrency(order.grand_total)}</span>
              </div>
            </div>
          </div>

          {/* Back button */}
          <Button variant="outline" className="w-full" asChild>
            <Link href="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

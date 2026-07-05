"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Printer, ArrowLeft, Download, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";
import { formatCurrency } from "@/lib/utils";
import type { OrderWithRelations } from "@/types/orders";
import type { ShopSettings } from "@/types/settings";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface InvoiceViewProps {
  order: OrderWithRelations;
  settings: ShopSettings | null;
}

export function InvoiceView({ order, settings }: InvoiceViewProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = React.useState(false);
  const shopName = settings?.shop_name ?? "ShopFlow";
  const shopAddressParts = [settings?.shop_address, settings?.shop_city, settings?.shop_country].filter(
    Boolean
  );

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const [{ pdf }, { InvoicePdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./invoice-pdf"),
      ]);
      const blob = await pdf(<InvoicePdf order={order} settings={settings} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order.order_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      {/* Print controls — hidden in print */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orders/${order.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Order
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pos">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Invoice — this is what prints */}
      <div className="mx-auto max-w-3xl rounded-xl border bg-white p-8 shadow-lg print:shadow-none print:border-none print:rounded-none print:max-w-none print:p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            {settings?.shop_logo_url && (
              <div className="relative h-12 w-12 mb-2">
                <Image
                  src={settings.shop_logo_url}
                  alt={shopName}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{shopName}</h1>
            {shopAddressParts.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">{shopAddressParts.join(", ")}</p>
            )}
            {settings?.shop_phone && <p className="text-sm text-gray-500">{settings.shop_phone}</p>}
            {settings?.shop_email && <p className="text-sm text-gray-500">{settings.shop_email}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
            <p className="font-mono text-base font-semibold text-gray-700 mt-1">
              {order.order_number}
            </p>
            <p className="text-sm text-gray-500">Date: {formatDate(order.created_at)}</p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Customer + Payment Info */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Bill To
            </p>
            {order.customer ? (
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-semibold text-gray-900">{order.customer.full_name}</p>
                {order.customer.email && <p>{order.customer.email}</p>}
                {order.customer.phone && <p>{order.customer.phone}</p>}
                {order.customer.address && <p>{order.customer.address}</p>}
                {[order.customer.city, order.customer.state, order.customer.postal_code]
                  .filter(Boolean)
                  .join(", ")}
                {order.customer.country && <p>{order.customer.country}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Walk-in Customer</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              Payment Details
            </p>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Method:</span>
                <span className="capitalize font-medium">
                  {order.payment_method.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status:</span>
                <PaymentStatusBadge status={order.payment_status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Order Status:</span>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Items Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-left font-semibold text-gray-700">Product</th>
              <th className="pb-2 text-right font-semibold text-gray-700">Qty</th>
              <th className="pb-2 text-right font-semibold text-gray-700">Unit Price</th>
              <th className="pb-2 text-right font-semibold text-gray-700">Disc %</th>
              <th className="pb-2 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2.5">
                  <p className="font-medium text-gray-900">
                    {item.product?.name ?? "Deleted product"}
                  </p>
                  {item.product?.sku && (
                    <p className="text-xs text-gray-400">SKU: {item.product.sku}</p>
                  )}
                </td>
                <td className="py-2.5 text-right text-gray-700">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-700">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="py-2.5 text-right text-gray-500">
                  {item.discount_percent > 0 ? `${item.discount_percent}%` : "—"}
                </td>
                <td className="py-2.5 text-right font-semibold text-gray-900">
                  {formatCurrency(item.total_price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>−{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            {order.tax_amount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>+{formatCurrency(order.tax_amount)}</span>
              </div>
            )}
            {order.shipping_amount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>+{formatCurrency(order.shipping_amount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base text-gray-900">
              <span>Grand Total</span>
              <span>{formatCurrency(order.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <>
            <Separator className="my-6" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                Notes
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
            </div>
          </>
        )}

        {/* Footer */}
        <Separator className="my-6" />
        <div className="text-center text-xs text-gray-400">
          <p>Thank you for your business!</p>
          <p className="mt-1">Generated by ShopFlow · {formatDate(new Date().toISOString())}</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:shadow-none, .print\\:shadow-none * { visibility: visible; }
          .print\\:shadow-none { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </>
  );
}

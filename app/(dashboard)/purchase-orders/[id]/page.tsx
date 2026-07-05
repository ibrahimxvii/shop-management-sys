import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PoStatusBadge } from "@/components/purchase-orders/po-status-badge";
import { PoActions } from "@/components/purchase-orders/po-actions";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PoDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PoDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const po = await purchaseOrderService.getPurchaseOrderById(id);
  return { title: po?.po_number ?? "Purchase Order" };
}

export default async function PoDetailPage({ params }: PoDetailPageProps) {
  const { id } = await params;
  const po = await purchaseOrderService.getPurchaseOrderById(id);
  if (!po) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <Breadcrumb
            items={[
              { label: "Purchase Orders", href: "/purchase-orders" },
              { label: po.po_number },
            ]}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight font-mono">{po.po_number}</h1>
            <PoStatusBadge status={po.status} />
          </div>
          <p className="text-sm text-muted-foreground">{formatDate(po.created_at)}</p>
        </div>

        <PoActions poId={po.id} poNumber={po.po_number} status={po.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-sm">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Product</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Unit Cost</th>
                    <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-3">
                        <p className="font-medium">{item.product?.name ?? "Deleted product"}</p>
                        {item.product?.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.unit_cost)}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(item.total_cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t px-5 py-4">
              <div className="ml-auto max-w-xs flex justify-between font-semibold text-base">
                <span>Total Cost</span>
                <span>{formatCurrency(po.total_amount)}</span>
              </div>
            </div>
          </div>

          {po.notes && (
            <div className="rounded-xl border bg-card shadow-card p-5">
              <h2 className="font-semibold text-sm mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-card shadow-card p-5">
            <h2 className="font-semibold text-sm mb-3">Supplier</h2>
            {po.supplier ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium">{po.supplier.name}</p>
                {po.supplier.contact_name && (
                  <p className="text-muted-foreground">{po.supplier.contact_name}</p>
                )}
                {po.supplier.email && <p className="text-muted-foreground">{po.supplier.email}</p>}
                {po.supplier.phone && <p className="text-muted-foreground">{po.supplier.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Supplier deleted</p>
            )}
          </div>

          {po.received_at && (
            <div className="rounded-xl border bg-card shadow-card p-5">
              <h2 className="font-semibold text-sm mb-2">Received</h2>
              <p className="text-sm text-muted-foreground">{formatDate(po.received_at)}</p>
            </div>
          )}

          <Separator />

          <Button variant="outline" className="w-full" asChild>
            <Link href="/purchase-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Purchase Orders
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

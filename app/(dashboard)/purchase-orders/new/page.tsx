import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PurchaseOrderForm } from "@/components/purchase-orders/purchase-order-form";

export const metadata: Metadata = {
  title: "New Purchase Order",
};

export default function NewPurchaseOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb
          items={[
            { label: "Purchase Orders", href: "/purchase-orders" },
            { label: "New Purchase Order" },
          ]}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Purchase Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Order stock from a supplier
          </p>
        </div>
      </div>

      <PurchaseOrderForm />
    </div>
  );
}

import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PurchaseOrderTableShell } from "@/components/purchase-orders/purchase-order-table-shell";

export const metadata: Metadata = {
  title: "Purchase Orders",
};

export default function PurchaseOrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Purchase Orders" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Order stock from suppliers and receive it into inventory
          </p>
        </div>
      </div>

      <PurchaseOrderTableShell />
    </div>
  );
}

import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { OrderTableShell } from "@/components/orders/order-table-shell";

export const metadata: Metadata = {
  title: "Orders",
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Orders" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage customer orders and track fulfillment
          </p>
        </div>
      </div>

      <OrderTableShell />
    </div>
  );
}

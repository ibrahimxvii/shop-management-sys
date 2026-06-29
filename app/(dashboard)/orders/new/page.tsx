import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { OrderForm } from "@/components/orders/order-form";

export const metadata: Metadata = {
  title: "New Order",
};

export default function NewOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb
          items={[
            { label: "Orders", href: "/orders" },
            { label: "New Order" },
          ]}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new customer order
          </p>
        </div>
      </div>

      <OrderForm />
    </div>
  );
}

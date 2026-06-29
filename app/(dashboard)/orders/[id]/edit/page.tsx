import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { OrderForm } from "@/components/orders/order-form";
import { orderService } from "@/services/order.service";

export const metadata: Metadata = {
  title: "Edit Order",
};

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;
  const order = await orderService.getOrderById(id);
  if (!order) notFound();

  if (order.status === "cancelled" || order.status === "refunded") {
    return (
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: "Orders", href: "/orders" },
            { label: order.order_number, href: `/orders/${order.id}` },
            { label: "Edit" },
          ]}
        />
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="font-medium">Cannot Edit {order.status} Order</p>
          <p className="text-sm text-muted-foreground mt-1">
            Orders that are cancelled or refunded cannot be edited.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb
          items={[
            { label: "Orders", href: "/orders" },
            { label: order.order_number, href: `/orders/${order.id}` },
            { label: "Edit" },
          ]}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {order.order_number}
          </p>
        </div>
      </div>

      <OrderForm order={order} />
    </div>
  );
}

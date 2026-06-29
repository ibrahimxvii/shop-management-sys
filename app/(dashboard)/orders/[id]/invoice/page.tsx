import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { orderService } from "@/services/order.service";
import { InvoiceView } from "@/components/orders/invoice-view";

export const metadata: Metadata = {
  title: "Invoice",
};

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const order = await orderService.getOrderById(id);
  if (!order) notFound();

  return <InvoiceView order={order} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, DollarSign, Calendar, User, MapPin, Phone, Mail } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { customerService } from "@/services/customer.service";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const customer = await customerService.getCustomerById(id);
  return { title: customer ? customer.full_name : "Customer" };
}

const ORDER_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  confirmed: "outline",
  processing: "outline",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "secondary",
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const customer = await customerService.getCustomerById(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb
          items={[
            { label: "Customers", href: "/customers" },
            { label: customer.full_name },
          ]}
        />
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/customers">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{customer.full_name}</h1>
          <Badge variant={customer.status === "active" ? "default" : "secondary"} className="capitalize">
            {customer.status ?? "active"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-xl font-semibold">{customer.total_orders.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Spending</p>
              <p className="text-xl font-semibold">{formatCurrency(customer.total_spending)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Order</p>
              <p className="text-xl font-semibold">
                {customer.last_order_date ? formatDate(customer.last_order_date) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal Info */}
        <div className="rounded-xl border bg-card p-5 shadow-card space-y-4">
          <h2 className="text-base font-semibold">Personal Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <User className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p>{customer.full_name}</p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p>{customer.email}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p>{customer.phone}</p>
                </div>
              </div>
            )}
            {(customer.city || customer.state || customer.country) && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Location</p>
                  <p>{[customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(", ")}</p>
                </div>
              </div>
            )}
            {customer.notes && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs mb-1">Notes</p>
                <p className="text-sm">{customer.notes}</p>
              </div>
            )}
            <div className="border-t pt-3">
              <p className="text-muted-foreground text-xs">Customer since</p>
              <p>{formatDate(customer.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-base font-semibold">Order History</h2>
          </div>
          {/* Orders come from the nested select - cast to access */}
          {(() => {
            const orders = ((customer as unknown) as { orders?: Array<{
              id: string;
              order_number?: string;
              status: string;
              payment_status: string;
              grand_total: number;
              created_at: string;
            }> }).orders ?? [];

            if (orders.length === 0) {
              return (
                <div className="py-12 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">No orders yet</p>
                </div>
              );
            }

            const sorted = [...orders].sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((order) => (
                      <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/orders/${order.id}`} className="font-medium hover:underline text-primary">
                            #{order.order_number ?? order.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={ORDER_STATUS_VARIANT[order.status] ?? "secondary"} className="capitalize">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {order.payment_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{formatCurrency(order.grand_total)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

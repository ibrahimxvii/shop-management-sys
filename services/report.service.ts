import { createClient } from "@/lib/supabase/server";
import type {
  SalesReportRow,
  InventoryReportRow,
  OrdersReportRow,
  CustomerReportRow,
  ReportPeriod,
} from "@/types/analytics";

function groupByToPg(period: ReportPeriod): string {
  const map: Record<ReportPeriod, string> = {
    daily: "day",
    weekly: "week",
    monthly: "month",
    yearly: "year",
  };
  return map[period];
}

export const reportService = {
  async getSalesReport(
    from: Date,
    to: Date,
    period: ReportPeriod
  ): Promise<SalesReportRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_sales_report", {
      p_from: from.toISOString(),
      p_to: to.toISOString(),
      p_group_by: groupByToPg(period),
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as SalesReportRow[];
  },

  async getInventoryReport(): Promise<InventoryReportRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, quantity, low_stock_limit, selling_price, status, categories(name)")
      .eq("status", "active")
      .order("quantity", { ascending: true });

    if (error) throw new Error(error.message);

    return ((data ?? []) as Array<{
      id: string;
      name: string;
      sku: string | null;
      quantity: number;
      low_stock_limit: number;
      selling_price: number;
      status: string;
      categories: { name: string } | null;
    }>).map((p) => ({
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      category: p.categories?.name ?? null,
      current_stock: p.quantity,
      low_stock_limit: p.low_stock_limit,
      stock_status:
        p.quantity === 0
          ? "out_of_stock"
          : p.quantity <= p.low_stock_limit
          ? "low_stock"
          : "in_stock",
      selling_price: p.selling_price,
      inventory_value: p.selling_price * p.quantity,
    }));
  },

  async getOrdersReport(from: Date, to: Date): Promise<OrdersReportRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("status, grand_total")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString());

    if (error) throw new Error(error.message);

    const orders = (data ?? []) as Array<{ status: string; grand_total: number }>;
    const grouped = new Map<string, { count: number; revenue: number }>();

    for (const o of orders) {
      const existing = grouped.get(o.status) ?? { count: 0, revenue: 0 };
      grouped.set(o.status, {
        count: existing.count + 1,
        revenue: existing.revenue + o.grand_total,
      });
    }

    const total = orders.length;
    return Array.from(grouped.entries()).map(([status, vals]) => ({
      status,
      count: vals.count,
      revenue: vals.revenue,
      percentage: total > 0 ? (vals.count / total) * 100 : 0,
    }));
  },

  async getCustomersReport(from: Date, to: Date): Promise<CustomerReportRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .select(`
        id, full_name, email, created_at,
        orders(id, grand_total, created_at, status)
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const fromMs = from.getTime();
    const toMs = to.getTime();

    return ((data ?? []) as Array<{
      id: string;
      full_name: string;
      email: string | null;
      created_at: string;
      orders: Array<{ id: string; grand_total: number; created_at: string; status: string }>;
    }>).map((c) => {
      const rangeOrders = c.orders.filter((o) => {
        const t = new Date(o.created_at).getTime();
        return t >= fromMs && t <= toMs && !["cancelled", "refunded"].includes(o.status);
      });
      const allValidOrders = c.orders.filter(
        (o) => !["cancelled", "refunded"].includes(o.status)
      );
      const totalSpending = rangeOrders.reduce((s, o) => s + o.grand_total, 0);
      const orderDates = c.orders
        .map((o) => o.created_at)
        .sort();

      return {
        customer_id: c.id,
        customer_name: c.full_name,
        email: c.email,
        joined: c.created_at,
        total_orders: rangeOrders.length,
        total_spending: totalSpending,
        last_order_date: orderDates[orderDates.length - 1] ?? null,
        is_returning: allValidOrders.length > 1,
      };
    }).filter((c) => c.total_orders > 0);
  },
};

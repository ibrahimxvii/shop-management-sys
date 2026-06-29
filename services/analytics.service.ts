import { createClient } from "@/lib/supabase/server";
import type {
  AnalyticsData,
  AnalyticsOverview,
  MonthlyRevenue,
  WeeklySales,
  BestSellingProduct,
  TopCategory,
  TopCustomer,
} from "@/types/analytics";

export const analyticsService = {
  async getAnalytics(): Promise<AnalyticsData> {
    const supabase = await createClient();

    const [
      { data: orderStats },
      { data: monthlyData },
      { data: weeklyData },
      { data: bestSellers },
      { data: topCats },
      { data: topCusts },
      { count: totalCustomers },
      { count: totalProducts },
      { data: allProducts },
    ] = await Promise.all([
      supabase.rpc("get_order_stats"),
      supabase.rpc("get_monthly_revenue", { months_back: 12 }),
      supabase.rpc("get_weekly_sales", { weeks_back: 12 }),
      supabase.rpc("get_best_selling_products", { p_limit: 10 }),
      supabase.rpc("get_top_categories", { p_limit: 8 }),
      supabase.rpc("get_top_customers", { p_limit: 10 }),
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("products")
        .select("quantity, low_stock_limit, selling_price, status"),
    ]);

    const stats = (orderStats as {
      total_orders: number;
      pending_orders: number;
      completed_orders: number;
      total_revenue: number;
    } | null) ?? {
      total_orders: 0,
      pending_orders: 0,
      completed_orders: 0,
      total_revenue: 0,
    };

    const products = (allProducts ?? []) as Array<{
      quantity: number;
      low_stock_limit: number;
      selling_price: number;
      status: string;
    }>;

    const activeProducts = products.filter((p) => p.status === "active");
    const lowStockCount = activeProducts.filter(
      (p) => p.quantity > 0 && p.quantity <= p.low_stock_limit
    ).length;
    const outOfStockCount = activeProducts.filter((p) => p.quantity === 0).length;
    const totalInventoryValue = activeProducts.reduce(
      (sum, p) => sum + p.selling_price * p.quantity,
      0
    );

    const overview: AnalyticsOverview = {
      totalRevenue: stats.total_revenue,
      totalOrders: stats.total_orders,
      totalCustomers: totalCustomers ?? 0,
      totalProducts: totalProducts ?? 0,
      lowStockCount,
      outOfStockCount,
      avgOrderValue:
        stats.total_orders > 0 ? stats.total_revenue / stats.total_orders : 0,
      totalInventoryValue,
    };

    return {
      overview,
      monthlyRevenue: (monthlyData ?? []) as MonthlyRevenue[],
      weeklySales: (weeklyData ?? []) as WeeklySales[],
      bestSellingProducts: (bestSellers ?? []) as BestSellingProduct[],
      topCategories: (topCats ?? []) as TopCategory[],
      topCustomers: (topCusts ?? []) as TopCustomer[],
    };
  },
};

import { createClient } from "@/lib/supabase/server";
import { forecastRevenue, type DailyDataPoint } from "@/lib/forecasting";
import { computeBusinessHealthScore } from "@/lib/business-health";
import { detectRevenueLeaks } from "@/lib/revenue-leak";
import { generateExecutiveSummary } from "@/lib/executive-summary";
import type {
  InsightsData,
  ProductVelocity,
  StockAgingRow,
  ProductGrowthRow,
  CategoryGrowthRow,
  TopBrand,
  ProfitEstimation,
  ProfitEstimationByCategory,
  SalesHeatmapCell,
} from "@/types/insights";
import type { SalesReportRow } from "@/types/analytics";

const DAY_MS = 24 * 60 * 60 * 1000;
const REORDER_LEAD_TIME_DAYS = 14;
const DEAD_STOCK_THRESHOLD_DAYS = 60;

function isoDate(date: Date): string {
  return date.toISOString();
}

export const insightsService = {
  async getInsights(): Promise<InsightsData> {
    const supabase = await createClient();
    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * DAY_MS);
    const previousPeriodStart = new Date(now.getTime() - 60 * DAY_MS);
    const forecastWindowStart = new Date(now.getTime() - 90 * DAY_MS);

    const [
      { data: velocityData },
      { data: agingData },
      { data: productGrowthData },
      { data: categoryGrowthData },
      { data: topBrandsData },
      { data: profitData },
      { data: profitByCategoryData },
      { data: heatmapData },
      { data: dailySeriesData },
      { data: currentPeriodReport },
      { data: previousPeriodReport },
      { count: totalOrders },
      { count: deliveredOrders },
      { count: cancelledOrders },
      { data: activeProductStockData },
    ] = await Promise.all([
      supabase.rpc("get_product_sales_velocity", { p_days_back: 30 }),
      supabase.rpc("get_stock_aging", { p_limit: 50 }),
      supabase.rpc("get_product_growth", {
        p_current_from: isoDate(periodStart),
        p_current_to: isoDate(now),
        p_previous_from: isoDate(previousPeriodStart),
        p_previous_to: isoDate(periodStart),
        p_limit: 10,
      }),
      supabase.rpc("get_category_growth", {
        p_current_from: isoDate(periodStart),
        p_current_to: isoDate(now),
        p_previous_from: isoDate(previousPeriodStart),
        p_previous_to: isoDate(periodStart),
      }),
      supabase.rpc("get_top_brands", { p_limit: 8 }),
      supabase.rpc("get_profit_estimation", {
        p_from: isoDate(periodStart),
        p_to: isoDate(now),
      }),
      supabase.rpc("get_profit_estimation_by_category", {
        p_from: isoDate(periodStart),
        p_to: isoDate(now),
      }),
      supabase.rpc("get_sales_heatmap", { p_days_back: 90 }),
      supabase.rpc("get_sales_report", {
        p_from: isoDate(forecastWindowStart),
        p_to: isoDate(now),
        p_group_by: "day",
      }),
      supabase.rpc("get_sales_report", {
        p_from: isoDate(periodStart),
        p_to: isoDate(now),
        p_group_by: "month",
      }),
      supabase.rpc("get_sales_report", {
        p_from: isoDate(previousPeriodStart),
        p_to: isoDate(periodStart),
        p_group_by: "month",
      }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "delivered"),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
      supabase.from("products").select("quantity, low_stock_limit").eq("status", "active"),
    ]);

    // PostgREST can't compare two columns to each other, so low/out-of-stock
    // counts are computed here in JS (same approach as analytics.service.ts).
    const activeProductStock = (activeProductStockData ?? []) as Array<{
      quantity: number;
      low_stock_limit: number;
    }>;
    const totalActiveProducts = activeProductStock.length;
    const outOfStockCount = activeProductStock.filter((p) => p.quantity === 0).length;
    const lowStockCount = activeProductStock.filter(
      (p) => p.quantity > 0 && p.quantity <= p.low_stock_limit
    ).length;

    const velocity = (velocityData ?? []) as unknown as ProductVelocity[];
    const aging = (agingData ?? []) as unknown as StockAgingRow[];
    const productGrowth = (productGrowthData ?? []) as unknown as ProductGrowthRow[];
    const categoryGrowth = (categoryGrowthData ?? []) as unknown as CategoryGrowthRow[];
    const topBrands = (topBrandsData ?? []) as unknown as TopBrand[];
    const profitEstimation = ((profitData as unknown as ProfitEstimation[] | null)?.[0] ?? {
      total_revenue: 0,
      total_cost_estimate: 0,
      estimated_profit: 0,
      estimated_margin_percent: 0,
    }) as ProfitEstimation;
    const profitByCategory = (profitByCategoryData ?? []) as unknown as ProfitEstimationByCategory[];
    const salesHeatmap = (heatmapData ?? []) as unknown as SalesHeatmapCell[];

    const dailySeries = (dailySeriesData ?? []) as unknown as SalesReportRow[];
    const currentReport = (currentPeriodReport ?? []) as unknown as SalesReportRow[];
    const previousReport = (previousPeriodReport ?? []) as unknown as SalesReportRow[];

    const reorderSuggestions = velocity
      .filter((v) => v.days_until_stockout !== null && v.days_until_stockout <= REORDER_LEAD_TIME_DAYS)
      .sort((a, b) => (a.days_until_stockout ?? 0) - (b.days_until_stockout ?? 0));

    const deadStock = aging.filter((row) => row.days_since_last_sale >= DEAD_STOCK_THRESHOLD_DAYS);

    const series: DailyDataPoint[] = dailySeries.map((row) => ({
      date: row.period_start.slice(0, 10),
      value: row.revenue,
    }));
    const forecast = forecastRevenue(series, 7);

    const sumRevenue = (rows: SalesReportRow[]) => rows.reduce((sum, r) => sum + r.revenue, 0);
    const sumOrders = (rows: SalesReportRow[]) => rows.reduce((sum, r) => sum + r.orders, 0);
    const sumCancelled = (rows: SalesReportRow[]) => rows.reduce((sum, r) => sum + r.cancelled_orders, 0);
    const sumRefunded = (rows: SalesReportRow[]) => rows.reduce((sum, r) => sum + r.refunded_orders, 0);
    const avgOrderValue = (rows: SalesReportRow[]) => {
      const orders = sumOrders(rows);
      return orders > 0 ? sumRevenue(rows) / orders : 0;
    };

    const currentRevenue = sumRevenue(currentReport);
    const previousRevenue = sumRevenue(previousReport);
    const revenueGrowthPercent =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : null;

    const businessHealth = computeBusinessHealthScore({
      currentPeriodRevenue: currentRevenue,
      previousPeriodRevenue: previousRevenue,
      outOfStockCount,
      lowStockCount,
      totalActiveProducts,
      deliveredOrders: deliveredOrders ?? 0,
      totalOrders: totalOrders ?? 0,
      cancelledOrders: cancelledOrders ?? 0,
    });

    const revenueLeaks = detectRevenueLeaks({
      recentCancelledOrders: sumCancelled(currentReport),
      recentRefundedOrders: sumRefunded(currentReport),
      recentTotalOrders: sumOrders(currentReport),
      priorCancelledOrders: sumCancelled(previousReport),
      priorRefundedOrders: sumRefunded(previousReport),
      priorTotalOrders: sumOrders(previousReport),
      recentAvgOrderValue: avgOrderValue(currentReport),
      priorAvgOrderValue: avgOrderValue(previousReport),
    });

    const topGrowingCategory = categoryGrowth.find((c) => c.growth_percent !== null && c.growth_percent > 0);
    const aovTrendPercent =
      avgOrderValue(previousReport) > 0
        ? ((avgOrderValue(currentReport) - avgOrderValue(previousReport)) / avgOrderValue(previousReport)) * 100
        : null;

    const executiveSummary = generateExecutiveSummary({
      revenueGrowthPercent,
      topGrowingCategory: topGrowingCategory
        ? { name: topGrowingCategory.category_name, growthPercent: topGrowingCategory.growth_percent as number }
        : null,
      reorderCount: reorderSuggestions.length,
      deadStockCount: deadStock.length,
      cancellationTrendUp: revenueLeaks.some((f) => f.type === "cancellation_rate_up"),
      aovTrendPercent,
    });

    // Anchor product for the "customers who bought X also bought" panel —
    // the highest-velocity product in the last 30 days.
    const topSeller = [...velocity].sort((a, b) => b.units_sold - a.units_sold)[0];
    let coPurchaseAnchor: InsightsData["coPurchaseAnchor"] = null;
    let coPurchaseSuggestions: InsightsData["coPurchaseSuggestions"] = [];
    if (topSeller && topSeller.units_sold > 0) {
      const { data: fbtData } = await supabase.rpc("get_frequently_bought_together", {
        p_product_id: topSeller.product_id,
        p_limit: 5,
      });
      coPurchaseAnchor = { productId: topSeller.product_id, productName: topSeller.product_name };
      coPurchaseSuggestions = (fbtData ?? []) as unknown as InsightsData["coPurchaseSuggestions"];
    }

    return {
      executiveSummary,
      businessHealth,
      forecast,
      reorderSuggestions,
      deadStock,
      stockAging: aging,
      coPurchaseAnchor,
      coPurchaseSuggestions,
      productGrowth,
      categoryGrowth,
      topBrands,
      profitEstimation,
      profitByCategory,
      revenueLeaks,
      salesHeatmap,
    };
  },

  async getFrequentlyBoughtTogether(productId: string, limit = 5) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_frequently_bought_together", {
      p_product_id: productId,
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

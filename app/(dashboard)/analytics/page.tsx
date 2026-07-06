import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { analyticsService } from "@/services/analytics.service";
import { insightsService } from "@/services/insights.service";
import { AnalyticsStatCards } from "@/components/analytics/analytics-stat-cards";
import { BestSellersTable } from "@/components/analytics/best-sellers-table";
import { TopCustomersTable } from "@/components/analytics/top-customers-table";
import { LineChart } from "@/components/analytics/line-chart";
import { BarChart } from "@/components/analytics/bar-chart";
import { DonutChart } from "@/components/analytics/donut-chart";
import { InsightsTab } from "@/components/analytics/insights-tab";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExportMenu } from "@/components/ui/export-menu";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const DONUT_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(271, 91%, 65%)",
  "hsl(186, 100%, 42%)",
  "hsl(330, 81%, 60%)",
  "hsl(25, 95%, 53%)",
];

async function AnalyticsContent() {
  const analytics = await analyticsService.getAnalytics();
  const {
    overview,
    monthlyRevenue,
    weeklySales,
    bestSellingProducts,
    topCategories,
    topCustomers,
  } = analytics;

  const revenueChartData = monthlyRevenue.map((m) => ({
    label: m.period_label,
    value: m.revenue,
  }));

  const weeklySalesData = weeklySales.map((w) => ({
    label: w.period_label,
    value: w.order_count,
  }));

  const donutData = topCategories.map((c, i) => ({
    label: c.category_name,
    value: c.total_revenue,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <AnalyticsStatCards overview={overview} />

      {/* Revenue + Category Breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="elevated" padding="default" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={revenueChartData}
              height={220}
              format="currency"
              showArea
            />
          </CardContent>
        </Card>

        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <DonutChart
              data={donutData}
              size={180}
              thickness={36}
              format="currency"
            />
          </CardContent>
        </Card>
      </div>

      {/* Weekly Orders + Category List */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Weekly Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={weeklySalesData}
              height={200}
              unit="orders"
            />
          </CardContent>
        </Card>

        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topCategories.map((cat, i) => {
                  const pct =
                    overview.totalRevenue > 0
                      ? (cat.total_revenue / overview.totalRevenue) * 100
                      : 0;
                  return (
                    <div key={cat.category_id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                            }}
                          />
                          <span className="truncate">{cat.category_name}</span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(cat.total_revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best Sellers + Top Customers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="elevated" padding="default">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Best Selling Products</CardTitle>
            <ExportMenu
              filename="best-selling-products"
              disabled={bestSellingProducts.length === 0}
              getRows={() =>
                bestSellingProducts.map((p) => ({
                  Product: p.product_name,
                  SKU: p.sku ?? "",
                  Category: p.category_name ?? "",
                  "Units Sold": p.total_quantity,
                  Revenue: p.total_revenue,
                  Orders: p.order_count,
                }))
              }
            />
          </CardHeader>
          <CardContent>
            <BestSellersTable products={bestSellingProducts} />
          </CardContent>
        </Card>

        <Card variant="elevated" padding="default">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Customers</CardTitle>
            <ExportMenu
              filename="top-customers"
              disabled={topCustomers.length === 0}
              getRows={() =>
                topCustomers.map((c) => ({
                  Customer: c.customer_name,
                  Email: c.email ?? "",
                  Orders: c.total_orders,
                  "Total Spending": c.total_spending,
                  "Last Order": c.last_order_date ?? "",
                }))
              }
            />
          </CardHeader>
          <CardContent>
            <TopCustomersTable customers={topCustomers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function InsightsContent() {
  const insights = await insightsService.getInsights();
  return <InsightsTab insights={insights} />;
}

const LOADING_FALLBACK = (
  <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
    Loading...
  </div>
);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Analytics" }]} />
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Store performance overview and key metrics.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Suspense fallback={LOADING_FALLBACK}>
            <AnalyticsContent />
          </Suspense>
        </TabsContent>

        <TabsContent value="insights">
          <Suspense fallback={LOADING_FALLBACK}>
            <InsightsContent />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

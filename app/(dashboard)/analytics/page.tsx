import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { analyticsService } from "@/services/analytics.service";
import { AnalyticsStatCards } from "@/components/analytics/analytics-stat-cards";
import { BestSellersTable } from "@/components/analytics/best-sellers-table";
import { TopCustomersTable } from "@/components/analytics/top-customers-table";
import { LineChart } from "@/components/analytics/line-chart";
import { BarChart } from "@/components/analytics/bar-chart";
import { DonutChart } from "@/components/analytics/donut-chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
              formatValue={(v) => formatCurrency(v)}
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
              formatValue={(v) => formatCurrency(v)}
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
              formatValue={(v) => `${v} orders`}
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
          <CardHeader>
            <CardTitle>Best Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <BestSellersTable products={bestSellingProducts} />
          </CardContent>
        </Card>

        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <TopCustomersTable customers={topCustomers} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading analytics...
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}

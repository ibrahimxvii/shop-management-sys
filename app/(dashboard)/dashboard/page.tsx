import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  UserCog,
  AlertTriangle,
  DollarSign,
  Tags,
  PackageX,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
} from "lucide-react";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status-badge";
import type { OrderStatus, PaymentStatus } from "@/types/orders";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentProducts } from "@/components/dashboard/recent-products";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { LowStockList } from "@/components/dashboard/low-stock-list";
import { LineChart } from "@/components/analytics/line-chart";
import { BestSellersTable } from "@/components/analytics/best-sellers-table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { productService } from "@/services/product.service";
import { analyticsService } from "@/services/analytics.service";
import { cn, formatCurrency as fmtCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  stock_in: TrendingUp,
  stock_out: TrendingDown,
  adjustment: SlidersHorizontal,
  initial: SlidersHorizontal,
};

const ACTION_COLORS: Record<string, string> = {
  stock_in: "text-emerald-600",
  stock_out: "text-rose-600",
  adjustment: "text-blue-600",
  initial: "text-muted-foreground",
};

export default async function DashboardPage() {
  let stats;
  let analytics;
  try {
    [stats, analytics] = await Promise.all([
      productService.getDashboardStats(),
      analyticsService.getAnalytics().catch(() => null),
    ]);
  } catch {
    stats = null;
    analytics = null;
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <Breadcrumb items={[{ label: "Dashboard" }]} />
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Dashboard" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your business overview at a glance
          </p>
        </div>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          description={`${stats.activeProducts} active`}
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(stats.totalInventoryValue)}
          description="at selling price"
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockCount}
          description={stats.lowStockCount > 0 ? "Needs attention" : "All stocked up"}
          icon={AlertTriangle}
          variant={stats.lowStockCount > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStockCount}
          description={stats.outOfStockCount > 0 ? "Zero quantity" : "All items available"}
          icon={PackageX}
          variant={stats.outOfStockCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          description={`${stats.pendingOrders} pending`}
          icon={ShoppingCart}
          variant="primary"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description={`${stats.completedOrders} delivered`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          description="in database"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          description={`${stats.totalBrands} brands`}
          icon={Tags}
          variant="default"
        />
        <StatCard
          title="Active Employees"
          value={stats.activeEmployees.toLocaleString()}
          description="team members"
          icon={UserCog}
          variant="default"
        />
      </div>

      {/* Revenue Trend + Best Sellers */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="elevated" padding="default" className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Revenue Trend (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart
                data={analytics.monthlyRevenue.map((m) => ({
                  label: m.period_label,
                  value: m.revenue,
                }))}
                height={180}
                formatValue={(v) => fmtCurrency(v)}
                showArea
              />
            </CardContent>
          </Card>
          <Card variant="elevated" padding="default">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Best Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <BestSellersTable products={analytics.bestSellingProducts.slice(0, 5)} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewChart
            data={stats.dailyProducts}
            title="Products Added"
            description="New products added over the last 30 days"
          />
        </div>
        <div>
          <LowStockList products={stats.lowStockProducts} />
        </div>
      </div>

      {/* Recent products + Recent inventory activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentProducts products={stats.recentProducts} />
        </div>
        <div>
          {/* Recent inventory activity */}
          <div className="rounded-xl border bg-card p-5 shadow-card h-full">
            <h3 className="font-semibold text-sm mb-4">Recent Stock Activity</h3>
            {stats.recentInventoryActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <SlidersHorizontal className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No stock movements yet</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Activity appears here after inventory updates
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {stats.recentInventoryActivity.map((entry) => {
                  const Icon = ACTION_ICONS[entry.action] ?? SlidersHorizontal;
                  const colorClass = ACTION_COLORS[entry.action] ?? "text-muted-foreground";
                  const isPositive = entry.quantity_change > 0;

                  return (
                    <li key={entry.id} className="flex items-start gap-3">
                      <div className={cn("mt-0.5 flex-shrink-0", colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">
                          {entry.product?.name ?? "Unknown product"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.action.replace("_", " ")} •{" "}
                          <span className={cn(
                            "font-medium",
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {isPositive ? "+" : ""}{entry.quantity_change}
                          </span>{" "}
                          → {entry.updated_quantity} units
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-sm">Recent Orders</h3>
          <Link
            href="/orders"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No orders yet</p>
            <Link href="/orders/new" className="text-xs text-primary mt-1 hover:underline">
              Create your first order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Order #</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {order.customer?.full_name ?? "Walk-in"}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatusBadge status={order.payment_status as PaymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-xs">
                      {formatCurrency(order.grand_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <QuickActions />
    </div>
  );
}

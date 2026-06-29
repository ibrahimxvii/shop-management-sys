import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsOverview } from "@/types/analytics";
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Layers,
} from "lucide-react";

interface Props {
  overview: AnalyticsOverview;
}

export function AnalyticsStatCards({ overview }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(overview.totalRevenue)}
        icon={DollarSign}
        variant="primary"
      />
      <StatCard
        title="Total Orders"
        value={overview.totalOrders.toLocaleString()}
        icon={ShoppingCart}
      />
      <StatCard
        title="Total Customers"
        value={overview.totalCustomers.toLocaleString()}
        icon={Users}
      />
      <StatCard
        title="Total Products"
        value={overview.totalProducts.toLocaleString()}
        icon={Package}
      />
      <StatCard
        title="Avg Order Value"
        value={formatCurrency(overview.avgOrderValue)}
        icon={TrendingUp}
        variant="success"
      />
      <StatCard
        title="Inventory Value"
        value={formatCurrency(overview.totalInventoryValue)}
        icon={Layers}
      />
      <StatCard
        title="Low Stock"
        value={String(overview.lowStockCount)}
        icon={AlertTriangle}
        variant={overview.lowStockCount > 0 ? "warning" : "default"}
      />
      <StatCard
        title="Out of Stock"
        value={String(overview.outOfStockCount)}
        icon={XCircle}
        variant={overview.outOfStockCount > 0 ? "destructive" : "default"}
      />
    </div>
  );
}

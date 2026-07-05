"use client";

import { AlertTriangle, PackageX, DollarSign, Boxes } from "lucide-react";
import { useInventoryStats } from "@/hooks/use-inventory";
import { useInventoryProducts } from "@/hooks/use-inventory";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency as formatCurrencyFull } from "@/lib/utils";

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs ${(n / 1_000).toFixed(1)}K`;
  return formatCurrencyFull(n);
}

interface StatItem {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  variant: "default" | "warning" | "danger" | "success";
}

const VARIANT_STYLES: Record<StatItem["variant"], string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
};

export function InventoryStatsBar() {
  const { data: stats, isLoading: statsLoading } = useInventoryStats();
  const { data: products = [], isLoading: productsLoading } = useInventoryProducts();

  const isLoading = statsLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const statItems: StatItem[] = [
    {
      title: "Total Products",
      value: products.length,
      description: "in inventory",
      icon: Boxes,
      variant: "default",
    },
    {
      title: "Low Stock",
      value: stats?.low_stock_count ?? 0,
      description: "need restocking",
      icon: AlertTriangle,
      variant: stats?.low_stock_count ? "warning" : "default",
    },
    {
      title: "Out of Stock",
      value: stats?.out_of_stock_count ?? 0,
      description: "zero quantity",
      icon: PackageX,
      variant: stats?.out_of_stock_count ? "danger" : "default",
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats?.total_inventory_value ?? 0),
      description: "at selling price",
      icon: DollarSign,
      variant: "success",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="rounded-xl border bg-card p-4 shadow-card flex items-start gap-3"
          >
            <div className={cn("rounded-lg p-2 flex-shrink-0", VARIANT_STYLES[stat.variant])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{stat.title}</p>
              <p className="text-xl font-bold leading-tight mt-0.5">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

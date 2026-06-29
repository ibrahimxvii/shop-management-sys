import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  className?: string;
}

const variantConfig = {
  default: {
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  warning: {
    iconBg: "bg-warning/15",
    iconColor: "text-warning-foreground",
  },
  destructive: {
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const config = variantConfig[variant];
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <Card
      className={cn(
        "p-6 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            "flex-shrink-0 rounded-xl p-2.5",
            config.iconBg
          )}
          aria-hidden="true"
        >
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
      </div>

      {(description || trend) && (
        <div className="flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center font-medium",
                isPositiveTrend ? "text-success" : "text-destructive"
              )}
            >
              {isPositiveTrend ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
          {(description || trend?.label) && (
            <span className="text-muted-foreground">
              {description ?? trend?.label}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

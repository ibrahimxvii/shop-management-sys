"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSalesReportAction } from "@/app/actions/report.actions";
import { LineChart } from "@/components/analytics/line-chart";
import { ExportMenu } from "@/components/ui/export-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReportPeriod } from "@/types/analytics";

const RANGES = [
  { label: "7D", days: 7, groupBy: "day" as ReportPeriod },
  { label: "30D", days: 30, groupBy: "day" as ReportPeriod },
  { label: "90D", days: 90, groupBy: "week" as ReportPeriod },
  { label: "1Y", days: 365, groupBy: "month" as ReportPeriod },
];

export function DateRangeSalesChart() {
  const [selected, setSelected] = useState(RANGES[1]);

  const { data, isLoading } = useQuery({
    queryKey: ["sales-report-chart", selected.days, selected.groupBy],
    queryFn: async () => {
      const to = new Date();
      const from = new Date(to.getTime() - selected.days * 24 * 60 * 60 * 1000);
      const result = await getSalesReportAction(from.toISOString(), to.toISOString(), selected.groupBy);
      if (!result.success) throw new Error(result.error ?? "Failed to load sales report");
      return result.data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const chartData = (data ?? []).map((row) => ({ label: row.period_label, value: row.revenue }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {RANGES.map((range) => (
            <Button
              key={range.label}
              size="sm"
              variant={range.label === selected.label ? "default" : "outline"}
              className={cn("h-7 px-2.5 text-xs")}
              onClick={() => setSelected(range)}
            >
              {range.label}
            </Button>
          ))}
        </div>
        <ExportMenu
          filename="sales-trend"
          disabled={!data || data.length === 0}
          getRows={() =>
            (data ?? []).map((row) => ({
              Period: row.period_label,
              Revenue: row.revenue,
              Orders: row.orders,
              "Avg Order Value": row.avg_order_value,
              Cancelled: row.cancelled_orders,
              Refunded: row.refunded_orders,
            }))
          }
        />
      </div>
      {isLoading ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : (
        <LineChart data={chartData} height={220} format="currency" showArea />
      )}
    </div>
  );
}

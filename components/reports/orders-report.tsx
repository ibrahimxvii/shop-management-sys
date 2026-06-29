"use client";

import { useState, useTransition } from "react";
import { getOrdersReportAction } from "@/app/actions/report.actions";
import type { OrdersReportRow } from "@/types/analytics";
import { DateRangePicker } from "./date-range-picker";
import { ExportButtons, downloadCsv, downloadExcel } from "./export-buttons";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(38, 92%, 50%)",
  processing: "hsl(221, 83%, 53%)",
  shipped: "hsl(271, 91%, 65%)",
  delivered: "hsl(142, 71%, 45%)",
  completed: "hsl(142, 71%, 45%)",
  cancelled: "hsl(0, 84%, 60%)",
  refunded: "hsl(25, 95%, 53%)",
};

export function OrdersReport() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<OrdersReportRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const result = await getOrdersReportAction(from, to);
      if (!result.success) {
        toast.error(result.error ?? "Failed to load orders report");
        return;
      }
      setRows(result.data ?? []);
      setHasLoaded(true);
    });
  }

  const totalOrders = rows.reduce((s, r) => s + r.count, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
        />
        <Button size="sm" onClick={load} disabled={isPending}>
          {isPending ? "Loading..." : "Run Report"}
        </Button>
        {rows.length > 0 && (
          <ExportButtons
            onExportCsv={() =>
              downloadCsv(
                rows.map((r) => ({
                  Status: r.status,
                  Count: r.count,
                  Revenue: r.revenue,
                  "Percentage (%)": r.percentage.toFixed(1),
                })),
                "orders-report"
              )
            }
            onExportExcel={() =>
              downloadExcel(
                rows.map((r) => ({
                  Status: r.status,
                  Count: r.count,
                  Revenue: r.revenue,
                  "Percentage (%)": r.percentage.toFixed(1),
                })),
                "orders-report"
              )
            }
            onPrint={() => window.print()}
          />
        )}
      </div>

      {!hasLoaded ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a date range and click Run Report.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No orders in the selected range.
        </p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-lg font-semibold">{totalOrders.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-semibold">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Statuses</p>
              <p className="text-lg font-semibold">{rows.length}</p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: STATUS_COLORS[r.status] ?? "hsl(221, 83%, 53%)",
                      }}
                    />
                    <span className="capitalize font-medium">{r.status}</span>
                    <span className="text-muted-foreground text-xs">
                      ({r.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 tabular-nums text-xs">
                    <span>{r.count} orders</span>
                    <span className="font-medium">{formatCurrency(r.revenue)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.percentage}%`,
                      backgroundColor: STATUS_COLORS[r.status] ?? "hsl(221, 83%, 53%)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

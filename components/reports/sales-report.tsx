"use client";

import { useState, useTransition } from "react";
import { getSalesReportAction } from "@/app/actions/report.actions";
import type { SalesReportRow, ReportPeriod } from "@/types/analytics";
import { DateRangePicker } from "./date-range-picker";
import { ExportButtons, downloadCsv, downloadExcel } from "./export-buttons";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const PERIODS: { label: string; value: ReportPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function defaultTo() {
  return new Date().toISOString().split("T")[0];
}

export function SalesReport() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [period, setPeriod] = useState<ReportPeriod>("daily");
  const [rows, setRows] = useState<SalesReportRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const result = await getSalesReportAction(from, to, period);
      if (!result.success) {
        toast.error(result.error ?? "Failed to load sales report");
        return;
      }
      setRows(result.data ?? []);
      setHasLoaded(true);
    });
  }

  function toExportRows() {
    return rows.map((r) => ({
      Period: r.period_label,
      Orders: r.orders,
      Revenue: r.revenue,
      "Avg Order Value": r.avg_order_value,
      "Cancelled Orders": r.cancelled_orders,
      "Refunded Orders": r.refunded_orders,
    }));
  }

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <DateRangePicker
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
        />

        <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={load} disabled={isPending}>
          {isPending ? "Loading..." : "Run Report"}
        </Button>

        {rows.length > 0 && (
          <ExportButtons
            onExportCsv={() => downloadCsv(toExportRows(), `sales-report-${from}-${to}`)}
            onExportExcel={() => downloadExcel(toExportRows(), `sales-report-${from}-${to}`)}
            onPrint={() => window.print()}
            disabled={isPending}
          />
        )}
      </div>

      {/* Summary */}
      {hasLoaded && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Revenue", value: formatCurrency(totalRevenue) },
            { label: "Total Orders", value: totalOrders.toLocaleString() },
            {
              label: "Avg Order Value",
              value: formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0),
            },
            {
              label: "Periods",
              value: rows.length.toLocaleString(),
            },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {hasLoaded && rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No sales data for the selected range.
        </p>
      ) : hasLoaded ? (
        <div className="rounded-lg border overflow-auto print:overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Period</th>
                <th className="px-4 py-2.5 text-right font-medium">Orders</th>
                <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                <th className="px-4 py-2.5 text-right font-medium">Avg Value</th>
                <th className="px-4 py-2.5 text-right font-medium">Cancelled</th>
                <th className="px-4 py-2.5 text-right font-medium">Refunded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{r.period_label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.orders}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatCurrency(r.revenue)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatCurrency(r.avg_order_value)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-destructive">
                    {r.cancelled_orders}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-warning">
                    {r.refunded_orders}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/40 font-semibold">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{totalOrders}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(totalRevenue)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-destructive">
                  {rows.reduce((s, r) => s + r.cancelled_orders, 0)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {rows.reduce((s, r) => s + r.refunded_orders, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a date range and click Run Report.
          </p>
        </div>
      )}
    </div>
  );
}

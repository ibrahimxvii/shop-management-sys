"use client";

import { useState, useTransition } from "react";
import { getCustomersReportAction } from "@/app/actions/report.actions";
import type { CustomerReportRow } from "@/types/analytics";
import { DateRangePicker } from "./date-range-picker";
import { ExportButtons, downloadCsv, downloadExcel } from "./export-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

export function CustomersReport() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState<CustomerReportRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const result = await getCustomersReportAction(from, to);
      if (!result.success) {
        toast.error(result.error ?? "Failed to load customers report");
        return;
      }
      setRows(result.data ?? []);
      setHasLoaded(true);
    });
  }

  const returning = rows.filter((r) => r.is_returning).length;
  const newCustomers = rows.filter((r) => !r.is_returning).length;
  const totalRevenue = rows.reduce((s, r) => s + r.total_spending, 0);

  function toExportRows() {
    return rows.map((r) => ({
      Name: r.customer_name,
      Email: r.email ?? "",
      "Joined": formatDate(r.joined),
      "Total Orders": r.total_orders,
      "Total Spending": r.total_spending,
      "Last Order": r.last_order_date ? formatDate(r.last_order_date) : "",
      Type: r.is_returning ? "Returning" : "New",
    }));
  }

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
            onExportCsv={() => downloadCsv(toExportRows(), "customers-report")}
            onExportExcel={() => downloadExcel(toExportRows(), "customers-report")}
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
          No customer activity in the selected range.
        </p>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Active Customers", value: rows.length },
              { label: "New Customers", value: newCustomers },
              { label: "Returning", value: returning },
              { label: "Total Revenue", value: formatCurrency(totalRevenue) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 text-left font-medium">Customer</th>
                  <th className="px-4 py-2.5 text-left font-medium">Type</th>
                  <th className="px-4 py-2.5 text-right font-medium">Orders</th>
                  <th className="px-4 py-2.5 text-right font-medium">Spending</th>
                  <th className="px-4 py-2.5 text-left font-medium">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.customer_id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{r.customer_name}</p>
                      {r.email && (
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={r.is_returning ? "secondary" : "default"}>
                        {r.is_returning ? "Returning" : "New"}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.total_orders}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {formatCurrency(r.total_spending)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.last_order_date ? formatDate(r.last_order_date) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

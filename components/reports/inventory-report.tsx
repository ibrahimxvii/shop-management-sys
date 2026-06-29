"use client";

import { useState, useTransition } from "react";
import { getInventoryReportAction } from "@/app/actions/report.actions";
import type { InventoryReportRow } from "@/types/analytics";
import { ExportButtons, downloadCsv, downloadExcel } from "./export-buttons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type BadgeVariant = "default" | "secondary" | "destructive" | "warning" | "success" | "outline" | "info" | "ghost";

const STATUS_BADGE: Record<
  InventoryReportRow["stock_status"],
  { label: string; variant: BadgeVariant }
> = {
  in_stock: { label: "In Stock", variant: "success" },
  low_stock: { label: "Low Stock", variant: "warning" },
  out_of_stock: { label: "Out of Stock", variant: "destructive" },
};

export function InventoryReport() {
  const [rows, setRows] = useState<InventoryReportRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [filter, setFilter] = useState<InventoryReportRow["stock_status"] | "all">("all");
  const [isPending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const result = await getInventoryReportAction();
      if (!result.success) {
        toast.error(result.error ?? "Failed to load inventory report");
        return;
      }
      setRows(result.data ?? []);
      setHasLoaded(true);
    });
  }

  const filtered =
    filter === "all" ? rows : rows.filter((r) => r.stock_status === filter);

  const totalValue = rows.reduce((s, r) => s + r.inventory_value, 0);
  const lowCount = rows.filter((r) => r.stock_status === "low_stock").length;
  const outCount = rows.filter((r) => r.stock_status === "out_of_stock").length;

  function toExportRows() {
    return filtered.map((r) => ({
      Product: r.product_name,
      SKU: r.sku ?? "",
      Category: r.category ?? "",
      "Current Stock": r.current_stock,
      "Low Stock Limit": r.low_stock_limit,
      "Status": r.stock_status,
      "Selling Price": r.selling_price,
      "Inventory Value": r.inventory_value,
    }));
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={load} disabled={isPending}>
          {isPending ? "Loading..." : "Run Report"}
        </Button>

        {hasLoaded && (
          <>
            <div className="flex items-center gap-1 rounded-md border bg-background p-0.5">
              {(
                [
                  { label: "All", value: "all" },
                  { label: "In Stock", value: "in_stock" },
                  { label: "Low Stock", value: "low_stock" },
                  { label: "Out of Stock", value: "out_of_stock" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    filter === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <ExportButtons
              onExportCsv={() =>
                downloadCsv(toExportRows(), "inventory-report")
              }
              onExportExcel={() =>
                downloadExcel(toExportRows(), "inventory-report")
              }
              onPrint={() => window.print()}
            />
          </>
        )}
      </div>

      {/* Summary */}
      {hasLoaded && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Products", value: rows.length },
            { label: "Total Value", value: formatCurrency(totalValue) },
            { label: "Low Stock", value: lowCount },
            { label: "Out of Stock", value: outCount },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {!hasLoaded ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Click Run Report to load inventory data.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No products found.
        </p>
      ) : (
        <div className="rounded-lg border overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Product</th>
                <th className="px-4 py-2.5 text-left font-medium">SKU</th>
                <th className="px-4 py-2.5 text-left font-medium">Category</th>
                <th className="px-4 py-2.5 text-right font-medium">Stock</th>
                <th className="px-4 py-2.5 text-right font-medium">Min Stock</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Price</th>
                <th className="px-4 py-2.5 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const statusCfg = STATUS_BADGE[r.stock_status];
                return (
                  <tr
                    key={r.product_id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-2.5 font-medium">{r.product_name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.sku ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {r.category ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {r.current_stock}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {r.low_stock_limit}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={statusCfg.variant}>
                        {statusCfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatCurrency(r.selling_price)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                      {formatCurrency(r.inventory_value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

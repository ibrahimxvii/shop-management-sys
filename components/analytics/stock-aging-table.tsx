"use client";

import { Badge } from "@/components/ui/badge";
import { ExportMenu } from "@/components/ui/export-menu";
import type { StockAgingRow } from "@/types/insights";

interface Props {
  data: StockAgingRow[];
}

const STALE_THRESHOLD_DAYS = 60;

export function StockAgingTable({ data }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExportMenu
          filename="stock-aging"
          disabled={data.length === 0}
          getRows={() =>
            data.map((row) => ({
              Product: row.product_name,
              SKU: row.sku ?? "",
              "Quantity In Stock": row.quantity,
              "Last Sold": row.last_sold_at ?? "Never",
              "Days Since Last Sale": row.days_since_last_sale,
            }))
          }
        />
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No in-stock products.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Quantity</th>
                <th className="pb-2 font-medium">Last Sold</th>
                <th className="pb-2 font-medium text-right">Days Idle</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.product_id} className="border-b last:border-0">
                  <td className="py-2 pr-2 truncate max-w-[200px]">{row.product_name}</td>
                  <td className="py-2 tabular-nums">{row.quantity}</td>
                  <td className="py-2 text-muted-foreground">
                    {row.last_sold_at ? new Date(row.last_sold_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="py-2 text-right">
                    <Badge variant={row.days_since_last_sale >= STALE_THRESHOLD_DAYS ? "destructive" : "ghost"}>
                      {row.days_since_last_sale}d
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

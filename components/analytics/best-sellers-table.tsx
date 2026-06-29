import { formatCurrency } from "@/lib/utils";
import type { BestSellingProduct } from "@/types/analytics";
import { Badge } from "@/components/ui/badge";

interface Props {
  products: BestSellingProduct[];
}

export function BestSellersTable({ products }: Props) {
  if (products.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No sales data yet.
      </p>
    );
  }

  const maxQty = products[0]?.total_quantity ?? 1;

  return (
    <div className="space-y-3">
      {products.map((p, i) => (
        <div key={p.product_id} className="flex items-center gap-3">
          <span className="w-5 text-right text-xs font-medium text-muted-foreground">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{p.product_name}</p>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {p.total_quantity.toLocaleString()} sold
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              {/* Progress bar */}
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(p.total_quantity / maxQty) * 100}%` }}
                />
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatCurrency(p.total_revenue)}
              </span>
            </div>
            {p.category_name && (
              <Badge variant="secondary" className="mt-1 text-xs py-0">
                {p.category_name}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

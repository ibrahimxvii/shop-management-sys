import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/products";

interface LowStockListProps {
  products: Product[];
}

export function LowStockList({ products }: LowStockListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {products.length > 0 && (
                <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
              )}
              Low Stock Alert
            </CardTitle>
            <CardDescription className="mt-0.5">
              Products below their stock limit
            </CardDescription>
          </div>
          {products.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products?filter=low_stock" className="flex items-center gap-1.5">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="rounded-xl bg-success/10 p-3 mb-3">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium">All stocked up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No products are below their stock limit
            </p>
          </div>
        ) : (
          <ul role="list" className="divide-y">
            {products.map((product) => {
              const stockPercent = product.low_stock_limit > 0
                ? Math.round((product.quantity / product.low_stock_limit) * 100)
                : 0;
              const isCritical = product.quantity === 0;

              return (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p
                          className={`text-sm font-semibold tabular-nums ${isCritical ? "text-destructive" : "text-warning-foreground"}`}
                        >
                          {product.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          / {product.low_stock_limit} min
                        </p>
                      </div>
                      <Badge variant={isCritical ? "destructive" : "warning"}>
                        {isCritical ? "Out of stock" : `${stockPercent}%`}
                      </Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

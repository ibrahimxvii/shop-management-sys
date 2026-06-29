import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Package } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProductWithRelations } from "@/types/products";

interface RecentProductsProps {
  products: ProductWithRelations[];
}

const statusVariant: Record<string, "success" | "ghost" | "warning"> = {
  active: "success",
  inactive: "ghost",
  draft: "warning",
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function RecentProducts({ products }: RecentProductsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription className="mt-0.5">
              Latest products added to your catalog
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products" className="flex items-center gap-1.5">
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="rounded-xl bg-muted/60 p-3 mb-3">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No products yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first product to get started
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link href="/products/new">Add Product</Link>
            </Button>
          </div>
        ) : (
          <ul role="list" className="divide-y">
            {products.map((product) => {
              const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
              const isLowStock = product.quantity <= product.low_stock_limit && product.status === "active";

              return (
                <li key={product.id}>
                  <Link
                    href={`/products/${product.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors group"
                  >
                    <div className="h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-muted border">
                      {primaryImage ? (
                        <Image
                          src={primaryImage.url}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku ? `SKU: ${product.sku}` : product.category?.name ?? "Uncategorized"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold tabular-nums">
                          {formatPrice(product.selling_price)}
                        </p>
                        <p
                          className={`text-xs ${isLowStock ? "text-destructive font-medium" : "text-muted-foreground"}`}
                        >
                          {product.quantity} in stock
                        </p>
                      </div>
                      <Badge variant={statusVariant[product.status] ?? "ghost"}>
                        {product.status}
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

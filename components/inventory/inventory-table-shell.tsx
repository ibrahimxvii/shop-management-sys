"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  AlertTriangle,
  PackageX,
} from "lucide-react";
import {
  useInventoryProducts,
  useStockIn,
  useStockOut,
  useAdjustStock,
} from "@/hooks/use-inventory";
import { useDebounce } from "@/hooks/use-debounce";
import { StockMovementDialog } from "./stock-movement-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { ProductWithRelations } from "@/types/products";

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";

const PAGE_SIZE = 15;

export function InventoryTableShell() {
  const [search, setSearch] = React.useState("");
  const [stockFilter, setStockFilter] = React.useState<StockFilter>("all");
  const [page, setPage] = React.useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const [selectedProduct, setSelectedProduct] = React.useState<ProductWithRelations | null>(null);
  const [movementMode, setMovementMode] = React.useState<"stock_in" | "stock_out" | "adjustment">("stock_in");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { data: products = [], isLoading, error } = useInventoryProducts(debouncedSearch || undefined);

  const stockIn = useStockIn();
  const stockOut = useStockOut();
  const adjustStock = useAdjustStock();

  const isMovementLoading = stockIn.isPending || stockOut.isPending || adjustStock.isPending;

  React.useEffect(() => { setPage(0); }, [debouncedSearch, stockFilter]);

  const filteredProducts = React.useMemo(() => {
    switch (stockFilter) {
      case "low_stock":
        return products.filter((p) => p.quantity > 0 && p.quantity <= p.low_stock_limit);
      case "out_of_stock":
        return products.filter((p) => p.quantity === 0);
      case "in_stock":
        return products.filter((p) => p.quantity > p.low_stock_limit);
      default:
        return products;
    }
  }, [products, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pageData = filteredProducts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openMovement = (product: ProductWithRelations, mode: typeof movementMode) => {
    setSelectedProduct(product);
    setMovementMode(mode);
    setDialogOpen(true);
  };

  const handleStockIn = async (values: unknown) => {
    await stockIn.mutateAsync(values);
  };

  const handleStockOut = async (values: unknown) => {
    await stockOut.mutateAsync(values);
  };

  const handleAdjust = async (values: unknown) => {
    await adjustStock.mutateAsync(values);
  };

  function getStockStatus(product: ProductWithRelations) {
    if (product.quantity === 0)
      return { label: "Out of Stock", variant: "destructive" as const, icon: PackageX };
    if (product.quantity <= product.low_stock_limit)
      return { label: "Low Stock", variant: "warning" as const, icon: AlertTriangle };
    return { label: "In Stock", variant: "default" as const, icon: Package };
  }

  if (error) {
    return (
      <EmptyState
        title="Failed to load inventory"
        description="There was an error loading inventory data. Please refresh."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={stockFilter}
          onValueChange={(v) => setStockFilter(v as StockFilter)}
        >
          <SelectTrigger className="w-[160px] flex-shrink-0">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Stock status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            debouncedSearch || stockFilter !== "all"
              ? "No products found"
              : "No products in inventory"
          }
          description={
            debouncedSearch || stockFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Add products to start managing inventory"
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground w-12">Image</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Product</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                    <th className="h-11 px-4 text-center font-medium text-muted-foreground">Stock</th>
                    <th className="h-11 px-4 text-center font-medium text-muted-foreground hidden md:table-cell">Low Stock At</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((product) => {
                    const status = getStockStatus(product);
                    const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0];

                    return (
                      <tr
                        key={product.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        {/* Image */}
                        <td className="px-4 py-3 align-middle">
                          <div className="h-9 w-9 rounded-lg border bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                            {primaryImage ? (
                              <Image
                                src={primaryImage.url}
                                alt={product.name}
                                width={36}
                                height={36}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </td>

                        {/* Product info */}
                        <td className="px-4 py-3 align-middle min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 align-middle hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {product.category?.name ?? "—"}
                          </span>
                        </td>

                        {/* Current stock */}
                        <td className="px-4 py-3 align-middle text-center">
                          <span className={cn(
                            "text-lg font-bold",
                            product.quantity === 0
                              ? "text-destructive"
                              : product.quantity <= product.low_stock_limit
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                          )}>
                            {product.quantity}
                          </span>
                        </td>

                        {/* Low stock threshold */}
                        <td className="px-4 py-3 align-middle text-center hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {product.low_stock_limit}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 align-middle">
                          <Badge variant={status.variant} className="text-xs gap-1">
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openMovement(product, "stock_in")}
                              title="Stock In"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openMovement(product, "stock_out")}
                              title="Stock Out"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                              disabled={product.quantity === 0}
                            >
                              <TrendingDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openMovement(product, "adjustment")}
                              title="Adjust Stock"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              {stockFilter !== "all" && ` (${stockFilter.replace("_", " ")})`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-foreground font-medium">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock movement dialog */}
      <StockMovementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        mode={movementMode}
        onStockIn={handleStockIn}
        onStockOut={handleStockOut}
        onAdjust={handleAdjust}
        isLoading={isMovementLoading}
      />
    </div>
  );
}

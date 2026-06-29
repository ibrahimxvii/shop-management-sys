"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  History,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useInventoryHistory } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
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
import type { InventoryAction } from "@/types/inventory";

const ACTION_CONFIG: Record<
  InventoryAction,
  { label: string; icon: React.ElementType; badgeClass: string; changePrefix: string }
> = {
  stock_in: {
    label: "Stock In",
    icon: TrendingUp,
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    changePrefix: "+",
  },
  stock_out: {
    label: "Stock Out",
    icon: TrendingDown,
    badgeClass: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
    changePrefix: "",
  },
  adjustment: {
    label: "Adjustment",
    icon: SlidersHorizontal,
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    changePrefix: "",
  },
  initial: {
    label: "Initial",
    icon: SlidersHorizontal,
    badgeClass: "bg-muted text-muted-foreground",
    changePrefix: "+",
  },
};

const PAGE_SIZE = 15;

interface InventoryHistoryTableProps {
  productId?: string;
}

export function InventoryHistoryTable({ productId }: InventoryHistoryTableProps) {
  const [actionFilter, setActionFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);

  const { data: history = [], isLoading, error } = useInventoryHistory({
    product_id: productId,
    action: actionFilter !== "all" ? actionFilter : undefined,
    limit: 200,
  });

  React.useEffect(() => { setPage(0); }, [actionFilter]);

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const pageData = history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (error) {
    return (
      <EmptyState
        title="Failed to load history"
        description="There was an error loading inventory history."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Stock Movement History
        </h2>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="stock_in">Stock In</SelectItem>
            <SelectItem value="stock_out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No history yet"
          description="Stock movements will appear here once you start managing inventory."
          size="sm"
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Action</th>
                    {!productId && (
                      <th className="h-11 px-4 text-left font-medium text-muted-foreground">Product</th>
                    )}
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Change</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden sm:table-cell">Before → After</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden md:table-cell">Notes</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden lg:table-cell">By</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((entry) => {
                    const cfg = ACTION_CONFIG[entry.action as InventoryAction] ?? ACTION_CONFIG.adjustment;
                    const Icon = cfg.icon;
                    const isPositive = entry.quantity_change > 0;

                    return (
                      <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        {/* Action badge */}
                        <td className="px-4 py-3 align-middle">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                            cfg.badgeClass
                          )}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Product (only in global view) */}
                        {!productId && (
                          <td className="px-4 py-3 align-middle">
                            <div>
                              <p className="font-medium text-xs">{entry.product?.name ?? "—"}</p>
                              {entry.product?.sku && (
                                <p className="text-xs text-muted-foreground">{entry.product.sku}</p>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Change */}
                        <td className="px-4 py-3 align-middle">
                          <span className={cn(
                            "font-semibold text-sm",
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {isPositive ? "+" : ""}{entry.quantity_change}
                          </span>
                        </td>

                        {/* Before → After */}
                        <td className="px-4 py-3 align-middle hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {entry.previous_quantity}{" "}
                            <span className="mx-1">→</span>{" "}
                            <span className="font-medium text-foreground">{entry.updated_quantity}</span>
                          </span>
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-3 align-middle hidden md:table-cell max-w-xs">
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {entry.notes || "—"}
                          </span>
                        </td>

                        {/* By */}
                        <td className="px-4 py-3 align-middle hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {entry.user?.full_name || entry.user?.email || "System"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 align-middle">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(entry.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
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
            <span>{history.length} record{history.length !== 1 ? "s" : ""}</span>
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
    </div>
  );
}

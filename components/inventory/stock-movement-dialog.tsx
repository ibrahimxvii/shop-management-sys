"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, TrendingUp, TrendingDown, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  stockMovementSchema,
  adjustStockSchema,
  type StockMovementFormValues,
  type AdjustStockFormValues,
} from "@/lib/validations/inventory";
import type { ProductWithRelations } from "@/types/products";
import type { InventoryAction } from "@/types/inventory";

type MovementMode = "stock_in" | "stock_out" | "adjustment";

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductWithRelations | null;
  mode: MovementMode;
  onStockIn: (values: unknown) => Promise<void>;
  onStockOut: (values: unknown) => Promise<void>;
  onAdjust: (values: unknown) => Promise<void>;
  isLoading?: boolean;
}

const MODE_CONFIG: Record<
  MovementMode,
  { title: string; description: string; icon: React.ElementType; colorClass: string }
> = {
  stock_in: {
    title: "Stock In",
    description: "Add stock to the inventory",
    icon: TrendingUp,
    colorClass: "text-emerald-600",
  },
  stock_out: {
    title: "Stock Out",
    description: "Remove stock from the inventory",
    icon: TrendingDown,
    colorClass: "text-rose-600",
  },
  adjustment: {
    title: "Adjust Stock",
    description: "Set an exact stock quantity",
    icon: SlidersHorizontal,
    colorClass: "text-blue-600",
  },
};

export function StockMovementDialog({
  open,
  onOpenChange,
  product,
  mode,
  onStockIn,
  onStockOut,
  onAdjust,
  isLoading = false,
}: StockMovementDialogProps) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  const movementForm = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: { product_id: "", action: mode as InventoryAction, quantity: 1, notes: "" },
  });

  const adjustForm = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: { product_id: "", new_quantity: 0, notes: "" },
  });

  React.useEffect(() => {
    if (open && product) {
      if (mode === "adjustment") {
        adjustForm.reset({ product_id: product.id, new_quantity: product.quantity, notes: "" });
      } else {
        movementForm.reset({ product_id: product.id, action: mode, quantity: 1, notes: "" });
      }
    }
  }, [open, product, mode, movementForm, adjustForm]);

  const handleSubmit =
    mode === "adjustment"
      ? adjustForm.handleSubmit(async (values) => {
          await onAdjust(values);
          onOpenChange(false);
        })
      : movementForm.handleSubmit(async (values) => {
          if (mode === "stock_in") {
            await onStockIn(values);
          } else {
            await onStockOut(values);
          }
          onOpenChange(false);
        });

  const errors =
    mode === "adjustment" ? adjustForm.formState.errors : movementForm.formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="default">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={cn("rounded-xl p-2.5 bg-muted", config.colorClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{config.title}</DialogTitle>
              <DialogDescription className="mt-0.5">{config.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Product info */}
        {product && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
            <p className="font-medium text-sm">{product.name}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {product.sku && <span>SKU: {product.sku}</span>}
              <span>
                Current stock:{" "}
                <span
                  className={cn(
                    "font-semibold",
                    product.quantity === 0
                      ? "text-destructive"
                      : product.quantity <= product.low_stock_limit
                      ? "text-warning-foreground"
                      : "text-foreground"
                  )}
                >
                  {product.quantity}
                </span>
              </span>
              {product.quantity <= product.low_stock_limit && product.quantity > 0 && (
                <Badge variant="warning" className="text-[10px]">Low Stock</Badge>
              )}
              {product.quantity === 0 && (
                <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "adjustment" ? (
            <div className="space-y-1.5">
              <Label htmlFor="new-quantity">
                New Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-quantity"
                type="number"
                min={0}
                {...adjustForm.register("new_quantity")}
              />
              {"new_quantity" in errors && errors.new_quantity && (
                <p className="text-xs text-destructive">
                  {errors.new_quantity.message}
                </p>
              )}
              {product && (
                <p className="text-xs text-muted-foreground">
                  Change:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      Number(adjustForm.watch("new_quantity")) > product.quantity
                        ? "text-emerald-600"
                        : Number(adjustForm.watch("new_quantity")) < product.quantity
                        ? "text-rose-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {Number(adjustForm.watch("new_quantity")) - product.quantity >= 0 ? "+" : ""}
                    {Number(adjustForm.watch("new_quantity")) - product.quantity}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="qty">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="qty"
                type="number"
                min={1}
                {...movementForm.register("quantity")}
              />
              {"quantity" in errors && errors.quantity && (
                <p className="text-xs text-destructive">
                  {(errors as typeof movementForm.formState.errors).quantity?.message}
                </p>
              )}
              {product && mode === "stock_in" && (
                <p className="text-xs text-muted-foreground">
                  New total:{" "}
                  <span className="font-medium text-foreground">
                    {product.quantity + Number(movementForm.watch("quantity") || 0)}
                  </span>
                </p>
              )}
              {product && mode === "stock_out" && (
                <p className="text-xs text-muted-foreground">
                  New total:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      product.quantity - Number(movementForm.watch("quantity") || 0) < 0
                        ? "text-destructive"
                        : "text-foreground"
                    )}
                  >
                    {product.quantity - Number(movementForm.watch("quantity") || 0)}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add a note about this stock movement…"
              rows={2}
              {...(mode === "adjustment"
                ? adjustForm.register("notes")
                : movementForm.register("notes"))}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Icon className="h-4 w-4" />
                  {config.title}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

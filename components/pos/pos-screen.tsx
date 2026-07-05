"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, ShoppingCart, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { useInventoryProducts } from "@/hooks/use-inventory";
import { useCustomers } from "@/hooks/use-customers";
import { useCreatePosSale } from "@/hooks/use-orders";
import type { ProductWithRelations } from "@/types/products";

interface CartItem {
  product_id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  quantity: number;
  stock: number;
}

export function PosScreen() {
  const router = useRouter();
  const { data: products = [], isLoading } = useInventoryProducts();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreatePosSale();

  const [search, setSearch] = React.useState("");
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [customerId, setCustomerId] = React.useState("");
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [taxAmount, setTaxAmount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const customerOptions: ComboboxOption[] = customers.map((c) => ({
    value: c.id,
    label: c.full_name,
    description: c.email ?? c.phone ?? undefined,
  }));

  const addToCart = React.useCallback((product: ProductWithRelations) => {
    if (product.quantity <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    let capped = false;
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          capped = true;
          return prev;
        }
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: product.selling_price,
          quantity: 1,
          stock: product.quantity,
        },
      ];
    });
    if (capped) {
      toast.error(`Only ${product.quantity} of ${product.name} in stock`);
    }
  }, []);

  const filteredProducts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const value = search.trim();
    if (!value) return;
    const match = products.find((p) => p.barcode === value || p.sku === value);
    if (match) {
      e.preventDefault();
      addToCart(match);
      setSearch("");
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > item.stock) return item;
          return { ...item, quantity: nextQty };
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (discountAmount > subtotal + taxAmount) {
      toast.error("Discount cannot exceed the subtotal plus tax");
      return;
    }
    const result = await createSale.mutateAsync({
      customer_id: customerId || undefined,
      items: cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: 0,
      })),
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      shipping_amount: 0,
      payment_method: paymentMethod,
      payment_status: "paid",
      status: "delivered",
      notes: "",
    });
    if (result?.id) {
      setCart([]);
      setDiscountAmount(0);
      setTaxAmount(0);
      setCustomerId("");
      router.push(`/orders/${result.id}/invoice`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-11.5rem)]">
      {/* Left: search + product grid */}
      <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
        <Input
          ref={searchInputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Scan barcode or search by name / SKU…"
          className="h-11 text-base"
          leftIcon={<Search className="h-4 w-4" />}
          autoFocus
        />

        <div className="flex-1 min-h-[20rem] overflow-y-auto rounded-xl border bg-card p-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              Loading products…
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
              <PackageX className="h-8 w-8 opacity-40" />
              No products found
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const outOfStock = product.quantity <= 0;
                const inCartQty =
                  cart.find((item) => item.product_id === product.id)?.quantity ?? 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "relative flex flex-col gap-1 rounded-lg border bg-background p-3 text-left transition-all",
                      "hover:border-primary hover:shadow-sm active:scale-[0.98]",
                      outOfStock && "opacity-40 cursor-not-allowed hover:border-border hover:shadow-none"
                    )}
                  >
                    {inCartQty > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {inCartQty}
                      </span>
                    )}
                    <p className="text-sm font-medium leading-tight line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.sku ? `SKU: ${product.sku}` : "No SKU"}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(product.selling_price)}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] tabular-nums",
                          outOfStock ? "text-destructive" : "text-muted-foreground"
                        )}
                      >
                        {outOfStock ? "Out of stock" : `${product.quantity} in stock`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: cart */}
      <div className="flex flex-col rounded-xl border bg-card shadow-card min-h-0">
        <div className="flex items-center gap-2 border-b p-4">
          <ShoppingCart className="h-4 w-4" />
          <h2 className="font-semibold text-sm">
            Cart {cart.length > 0 && `(${cart.length})`}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Scan or select a product to start a sale
            </p>
          ) : (
            cart.map((item) => (
              <div key={item.product_id} className="rounded-lg border bg-muted/20 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unit_price)} each
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => removeFromCart(item.product_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateQuantity(item.product_id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={item.quantity >= item.stock}
                      onClick={() => updateQuantity(item.product_id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Customer (optional)</Label>
            <Combobox
              options={customerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Walk-in customer"
              searchPlaceholder="Search customers..."
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Discount ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className="h-8 text-sm"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tax ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={taxAmount || ""}
                onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                className="h-8 text-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={cart.length === 0 || createSale.isPending}
            isLoading={createSale.isPending}
            loadingText="Completing sale…"
            onClick={handleCompleteSale}
          >
            Complete Sale
          </Button>
        </div>
      </div>
    </div>
  );
}

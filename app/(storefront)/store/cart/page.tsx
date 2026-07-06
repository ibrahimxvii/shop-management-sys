"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, ImageOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useStorefrontCartStore, cartTotal } from "@/store/storefront-cart.store";
import { formatCurrency } from "@/lib/utils";

export default function StoreCartPage() {
  const router = useRouter();
  const items = useStorefrontCartStore((s) => s.items);
  const updateQuantity = useStorefrontCartStore((s) => s.updateQuantity);
  const removeItem = useStorefrontCartStore((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        description="Browse our products and add items to get started."
        action={{ label: "Browse Products", onClick: () => router.push("/store/products") }}
      />
    );
  }

  const subtotal = cartTotal(items);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Your Cart</h1>
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 rounded-xl border bg-card p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/40">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground tabular-nums">{formatCurrency(item.price)}</p>
            </div>
            <div className="flex items-center rounded-lg border">
              <button
                type="button"
                className="h-8 w-8 text-sm hover:bg-accent transition-colors cursor-pointer"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                −
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
              <button
                type="button"
                className="h-8 w-8 text-sm hover:bg-accent transition-colors cursor-pointer"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                disabled={item.quantity >= item.maxQuantity}
              >
                +
              </button>
            </div>
            <p className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
              {formatCurrency(item.price * item.quantity)}
            </p>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-card h-fit space-y-4">
        <h2 className="font-semibold">Order Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground">Cash on delivery / pickup — no online payment required.</p>
        <Button asChild size="lg" className="w-full">
          <Link href="/store/checkout">Proceed to Checkout</Link>
        </Button>
      </div>
    </div>
  );
}

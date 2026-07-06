"use client";

import Image from "next/image";
import { Heart, ImageOff, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useStorefrontWishlistStore } from "@/store/storefront-wishlist.store";
import { useStorefrontCartStore } from "@/store/storefront-cart.store";
import { formatCurrency } from "@/lib/utils";

export default function StoreWishlistPage() {
  const items = useStorefrontWishlistStore((s) => s.items);
  const toggle = useStorefrontWishlistStore((s) => s.toggle);
  const addItem = useStorefrontCartStore((s) => s.addItem);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        description="Save products you're interested in by tapping the heart icon."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Wishlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.productId} className="relative overflow-hidden rounded-xl border bg-card shadow-card">
            <button
              onClick={() => toggle(item)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-sm cursor-pointer"
              aria-label="Remove from wishlist"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="relative aspect-square bg-muted">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="25vw" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/40">
                  <ImageOff className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="space-y-2 p-3">
              <h3 className="truncate text-sm font-medium">{item.name}</h3>
              <div className="flex items-center justify-between">
                <span className="font-semibold tabular-nums">{formatCurrency(item.price)}</span>
                <Button
                  size="icon-sm"
                  onClick={() => {
                    addItem({ ...item, quantity: 1, maxQuantity: 99 });
                    toast.success(`${item.name} added to cart`);
                  }}
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

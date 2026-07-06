"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStorefrontWishlistStore } from "@/store/storefront-wishlist.store";

interface Props {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  className?: string;
}

export function WishlistButton({ productId, name, price, image, className }: Props) {
  const isWishlisted = useStorefrontWishlistStore((s) => s.isWishlisted(productId));
  const toggle = useStorefrontWishlistStore((s) => s.toggle);

  return (
    <button
      type="button"
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={isWishlisted}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ productId, name, price, image });
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm shadow-sm transition-colors hover:bg-background cursor-pointer",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", isWishlisted ? "fill-destructive text-destructive" : "text-muted-foreground")} />
    </button>
  );
}

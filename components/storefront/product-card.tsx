"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { formatCurrency } from "@/lib/utils";
import { useStorefrontCartStore } from "@/store/storefront-cart.store";
import type { StorefrontProduct } from "@/types/storefront";

interface Props {
  product: StorefrontProduct;
  isBestseller?: boolean;
}

const NEW_ARRIVAL_DAYS = 14;

export function ProductCard({ product, isBestseller }: Props) {
  const addItem = useStorefrontCartStore((s) => s.addItem);
  const primaryImage = product.images.find((img) => img.is_primary)?.url ?? product.images[0]?.url ?? null;

  const isNew =
    (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24) <= NEW_ARRIVAL_DAYS;
  const isLowStock = product.quantity > 0 && product.quantity <= product.low_stock_limit;
  const isOutOfStock = product.quantity === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.selling_price,
      quantity: 1,
      image: primaryImage,
      maxQuantity: product.quantity,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      href={`/store/products/${product.id}`}
      className="group block overflow-hidden rounded-xl border bg-card shadow-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/40">
            <ImageOff className="h-10 w-10" />
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isNew && <Badge variant="info">New</Badge>}
          {isBestseller && <Badge variant="success">Bestseller</Badge>}
          {isLowStock && <Badge variant="warning">Low Stock</Badge>}
          {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
        </div>

        <WishlistButton
          productId={product.id}
          name={product.name}
          price={product.selling_price}
          image={primaryImage}
          className="absolute right-2 top-2"
        />
      </div>

      <div className="space-y-1 p-3">
        {product.category && (
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
        )}
        <h3 className="truncate text-sm font-medium">{product.name}</h3>
        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold tabular-nums">{formatCurrency(product.selling_price)}</span>
          <Button
            size="icon-sm"
            variant={isOutOfStock ? "outline" : "default"}
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

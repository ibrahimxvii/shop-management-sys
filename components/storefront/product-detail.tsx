"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingCart, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { ProductCard } from "@/components/storefront/product-card";
import { useStorefrontRelatedProducts } from "@/hooks/use-storefront";
import { useStorefrontCartStore } from "@/store/storefront-cart.store";
import { useStorefrontRecentlyViewedStore } from "@/store/storefront-recently-viewed.store";
import { formatCurrency } from "@/lib/utils";
import type { StorefrontProduct } from "@/types/storefront";

interface Props {
  product: StorefrontProduct;
}

const NEW_ARRIVAL_DAYS = 14;

export function ProductDetail({ product }: Props) {
  const [quantity, setQuantity] = useState(1);
  const addItem = useStorefrontCartStore((s) => s.addItem);
  const recordViewed = useStorefrontRecentlyViewedStore((s) => s.record);
  const { data: related } = useStorefrontRelatedProducts(product.id, product.category?.id ?? null);

  const primaryImage = product.images.find((img) => img.is_primary)?.url ?? product.images[0]?.url ?? null;
  const isNew =
    (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24) <= NEW_ARRIVAL_DAYS;
  const isLowStock = product.quantity > 0 && product.quantity <= product.low_stock_limit;
  const isOutOfStock = product.quantity === 0;

  useEffect(() => {
    recordViewed({
      productId: product.id,
      name: product.name,
      price: product.selling_price,
      image: primaryImage,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.selling_price,
      quantity,
      image: primaryImage,
      maxQuantity: product.quantity,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="space-y-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          {primaryImage ? (
            <Image src={primaryImage} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40">
              <ImageOff className="h-16 w-16" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {isNew && <Badge variant="info">New</Badge>}
            {isLowStock && <Badge variant="warning">Low Stock</Badge>}
            {isOutOfStock && <Badge variant="destructive">Out of Stock</Badge>}
          </div>

          <div>
            {product.category && <p className="text-sm text-muted-foreground">{product.category.name}</p>}
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            {product.brand && <p className="text-sm text-muted-foreground mt-0.5">{product.brand.name}</p>}
          </div>

          <p className="text-3xl font-bold tabular-nums">{formatCurrency(product.selling_price)}</p>

          {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center rounded-lg border">
              <button
                type="button"
                className="h-9 w-9 text-sm hover:bg-accent transition-colors cursor-pointer"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
              <button
                type="button"
                className="h-9 w-9 text-sm hover:bg-accent transition-colors cursor-pointer"
                onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
              >
                +
              </button>
            </div>

            <Button size="lg" disabled={isOutOfStock} onClick={handleAddToCart} className="flex-1">
              <ShoppingCart className="h-4 w-4" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>

            <WishlistButton
              productId={product.id}
              name={product.name}
              price={product.selling_price}
              image={primaryImage}
              className="static h-9 w-9 border"
            />
          </div>
        </div>
      </div>

      {related && related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">You Might Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

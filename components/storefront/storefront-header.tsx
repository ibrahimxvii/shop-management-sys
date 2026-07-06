"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Heart, PackageSearch, Store } from "lucide-react";
import { SearchAutocomplete } from "@/components/storefront/search-autocomplete";
import { useStorefrontCartStore, cartCount } from "@/store/storefront-cart.store";
import { useStorefrontWishlistStore } from "@/store/storefront-wishlist.store";

interface Props {
  shopName: string;
  logoUrl: string | null;
}

export function StorefrontHeader({ shopName, logoUrl }: Props) {
  const items = useStorefrontCartStore((s) => s.items);
  const wishlistCount = useStorefrontWishlistStore((s) => s.items.length);
  const itemCount = cartCount(items);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 lg:px-6">
        <Link href="/store" className="flex shrink-0 items-center gap-2 font-semibold">
          {logoUrl ? (
            <Image src={logoUrl} alt={shopName} width={32} height={32} className="rounded-md" />
          ) : (
            <Store className="h-6 w-6 text-primary" />
          )}
          <span className="hidden sm:inline">{shopName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/store" className="hover:text-foreground transition-colors">Home</Link>
          <Link href="/store/products" className="hover:text-foreground transition-colors">Products</Link>
          <Link href="/store/track" className="hover:text-foreground transition-colors">Track Order</Link>
        </nav>

        <div className="ml-auto flex flex-1 items-center justify-end gap-3">
          <div className="hidden sm:block flex-1 max-w-xs">
            <SearchAutocomplete />
          </div>

          <Link
            href="/store/track"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Track order"
          >
            <PackageSearch className="h-5 w-5" />
          </Link>

          <Link
            href="/store/wishlist"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/store/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

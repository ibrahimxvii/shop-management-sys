"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useStorefrontRecentlyViewedStore } from "@/store/storefront-recently-viewed.store";
import { formatCurrency } from "@/lib/utils";

export function RecentlyViewedSection() {
  const items = useStorefrontRecentlyViewedStore((s) => s.items);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.productId}
            href={`/store/products/${item.productId}`}
            className="group overflow-hidden rounded-xl border bg-card shadow-card transition-shadow hover:shadow-lg"
          >
            <div className="relative aspect-square bg-muted">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground/40">
                  <ImageOff className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <h3 className="truncate text-sm font-medium">{item.name}</h3>
              <span className="font-semibold tabular-nums text-sm">{formatCurrency(item.price)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

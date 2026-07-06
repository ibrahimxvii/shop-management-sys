"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useStorefrontProducts, useStorefrontCategories, useStorefrontBrands } from "@/hooks/use-storefront";
import { cn } from "@/lib/utils";
import { PackageSearch } from "lucide-react";

const PAGE_SIZE = 24;

export function ProductsCatalog() {
  const searchParams = useSearchParams();
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") ?? "");
  const [brandId, setBrandId] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const { data: categories } = useStorefrontCategories();
  const { data: brands } = useStorefrontBrands();
  const { data, isLoading } = useStorefrontProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
    limit: PAGE_SIZE,
  });

  const products = data?.products ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">All Products</h1>
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} products available</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">All Categories</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">All Brands</option>
          {(brands ?? []).map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={cn("aspect-square rounded-xl")} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No products found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

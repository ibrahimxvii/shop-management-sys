import type { Metadata } from "next";
import Link from "next/link";
import { storefrontService } from "@/services/storefront.service";
import { ProductCard } from "@/components/storefront/product-card";
import { RecentlyViewedSection } from "@/components/storefront/recently-viewed-section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function StoreHomePage() {
  const [bestSellers, newArrivals, categories] = await Promise.all([
    storefrontService.getBestSellers(8),
    storefrontService.getNewArrivals(8),
    storefrontService.getCategories(),
  ]);
  const bestSellerIds = new Set(bestSellers.map((p) => p.id));

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 lg:p-12 text-center">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Shop Our Products</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Browse our full catalog, add items to your cart, and check out — no account required.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/store/products">Browse All Products</Link>
        </Button>
      </section>

      {categories.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/store/products?categoryId=${cat.id}`}
                className="rounded-xl border bg-card p-4 text-center text-sm font-medium hover:shadow-md transition-shadow"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Bestsellers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} isBestseller />
            ))}
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">New Arrivals</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} isBestseller={bestSellerIds.has(p.id)} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedSection />
    </div>
  );
}

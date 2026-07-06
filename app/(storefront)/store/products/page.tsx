import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsCatalog } from "@/components/storefront/products-catalog";

export const metadata: Metadata = { title: "Products" };

export default function StoreProductsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-muted-foreground">Loading...</div>}>
      <ProductsCatalog />
    </Suspense>
  );
}

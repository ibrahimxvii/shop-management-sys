import type { Metadata } from "next";
import { PackagePlus } from "lucide-react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProductTableShell } from "@/components/products/product-table-shell";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: "Products" }]} />
          <div className="mt-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage your product catalog
            </p>
          </div>
        </div>
        <Button asChild className="flex-shrink-0">
          <Link href="/products/new">
            <PackagePlus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <ProductTableShell />
    </div>
  );
}

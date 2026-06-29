import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProductForm } from "@/components/products/product-form";

export const metadata: Metadata = {
  title: "Add Product",
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb
          items={[
            { label: "Products", href: "/products" },
            { label: "Add Product" },
          ]}
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Product</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the details to add a new product to your catalog
          </p>
        </div>
      </div>

      <ProductForm />
    </div>
  );
}

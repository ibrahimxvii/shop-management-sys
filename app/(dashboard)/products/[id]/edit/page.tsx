import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/product-form";
import { productService } from "@/services/product.service";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await productService.getProductById(id);
  return { title: product ? `Edit — ${product.name}` : "Edit Product" };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = await productService.getProductById(id);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Products", href: "/products" },
              { label: product.name, href: `/products/${product.id}` },
              { label: "Edit" },
            ]}
          />
          <div className="mt-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Edit Product
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Update the details for{" "}
              <span className="font-medium text-foreground">{product.name}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="flex-shrink-0">
          <Link href={`/products/${product.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Product
          </Link>
        </Button>
      </div>

      <ProductForm product={product} />
    </div>
  );
}

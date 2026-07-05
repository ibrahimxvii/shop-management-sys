import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Pencil,
  Package,
  Tag,
  Building2,
  DollarSign,
  Boxes,
  Hash,
  Star,
  Calendar,
  ArrowLeft,
  Barcode,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { productService } from "@/services/product.service";
import { formatCurrency as formatPrice } from "@/lib/utils";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await productService.getProductById(id);
  return { title: product?.name ?? "Product" };
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5 rounded-md bg-muted p-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm font-medium mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const product = await productService.getProductById(id);

  if (!product) notFound();

  const primaryImage =
    product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const otherImages = product.images?.filter((img) => img !== primaryImage) ?? [];
  const isLowStock =
    product.quantity <= product.low_stock_limit && product.status === "active";
  const margin =
    product.purchase_price > 0
      ? (((product.selling_price - product.purchase_price) / product.purchase_price) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: "Products", href: "/products" },
              { label: product.name },
            ]}
          />
          <div className="mt-1.5 flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
            <ProductStatusBadge status={product.status} />
            {product.is_featured && (
              <Badge variant="warning">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Featured
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          {product.barcode && (
            <Button variant="outline" asChild>
              <Link href={`/products/${product.id}/label`}>
                <Barcode className="h-4 w-4" />
                Print Barcode Label
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — images + description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {product.images && product.images.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                {/* Primary image */}
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted border">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {otherImages.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img) => (
                      <div
                        key={img.id}
                        className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border ${
                          img.is_primary ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* No images placeholder */}
          {(!product.images || product.images.length === 0) && (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="rounded-2xl bg-muted p-4 mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No images uploaded</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href={`/products/${product.id}/edit`}>Add Images</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — metadata cards */}
        <div className="space-y-4">
          {/* Pricing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Selling Price</span>
                <span className="text-lg font-bold tabular-nums">
                  {formatPrice(product.selling_price)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Purchase Price</span>
                <span className="text-sm font-medium tabular-nums">
                  {formatPrice(product.purchase_price)}
                </span>
              </div>
              {margin !== null && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gross Margin</span>
                    <Badge
                      variant={parseFloat(margin) > 0 ? "success" : "destructive"}
                    >
                      {margin}%
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Stock */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In Stock</span>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    product.quantity === 0
                      ? "text-destructive"
                      : isLowStock
                        ? "text-warning-foreground"
                        : "text-foreground"
                  }`}
                >
                  {product.quantity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Low Stock Limit</span>
                <span className="text-sm">{product.low_stock_limit}</span>
              </div>
              {isLowStock && (
                <Badge variant={product.quantity === 0 ? "destructive" : "warning"} className="w-full justify-center">
                  {product.quantity === 0 ? "Out of stock" : "Low stock — reorder needed"}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.sku && (
                <InfoRow icon={Hash} label="SKU" value={product.sku} />
              )}
              {product.barcode && (
                <InfoRow icon={Hash} label="Barcode" value={product.barcode} />
              )}
              {product.category && (
                <InfoRow icon={Tag} label="Category" value={product.category.name} />
              )}
              {product.brand && (
                <InfoRow icon={Building2} label="Brand" value={product.brand.name} />
              )}
              <InfoRow
                icon={Calendar}
                label="Added"
                value={formatDate(product.created_at)}
              />
              <InfoRow
                icon={Calendar}
                label="Updated"
                value={formatDate(product.updated_at)}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Hash className="h-2.5 w-2.5 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

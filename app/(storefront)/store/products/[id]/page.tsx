import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { storefrontService } from "@/services/storefront.service";
import { ProductDetail } from "@/components/storefront/product-detail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await storefrontService.getProductById(id);
  return { title: product?.name ?? "Product" };
}

export default async function StoreProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await storefrontService.getProductById(id);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}

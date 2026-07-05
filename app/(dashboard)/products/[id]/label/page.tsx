import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { productService } from "@/services/product.service";
import { BarcodeLabel } from "@/components/products/barcode-label";

export const metadata: Metadata = {
  title: "Barcode Label",
};

interface BarcodeLabelPageProps {
  params: Promise<{ id: string }>;
}

export default async function BarcodeLabelPage({ params }: BarcodeLabelPageProps) {
  const { id } = await params;
  const product = await productService.getProductById(id);
  if (!product || !product.barcode) notFound();

  return <BarcodeLabel product={product} />;
}

"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodePreview } from "./barcode-preview";
import type { ProductWithRelations } from "@/types/products";
import { formatCurrency as formatPrice } from "@/lib/utils";

interface BarcodeLabelProps {
  product: ProductWithRelations;
}

export function BarcodeLabel({ product }: BarcodeLabelProps) {
  return (
    <>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/products/${product.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Product
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print Label
        </Button>
      </div>

      <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-2 rounded-xl border bg-white p-6 text-center shadow-lg print:w-auto print:max-w-none print:rounded-none print:border-none print:shadow-none">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{product.name}</p>
        <p className="text-base font-bold text-gray-900">{formatPrice(product.selling_price)}</p>
        <BarcodePreview value={product.barcode ?? ""} />
        {product.sku && <p className="text-xs text-gray-500">SKU: {product.sku}</p>}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:shadow-none, .print\\:shadow-none * { visibility: visible; }
          .print\\:shadow-none { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </>
  );
}

import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { BrandTableShell } from "@/components/brands/brand-table-shell";

export const metadata: Metadata = {
  title: "Brands",
};

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Brands" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage product brands and manufacturers
          </p>
        </div>
      </div>

      <BrandTableShell />
    </div>
  );
}

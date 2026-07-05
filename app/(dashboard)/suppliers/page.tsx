import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { SupplierTableShell } from "@/components/suppliers/supplier-table-shell";

export const metadata: Metadata = {
  title: "Suppliers",
};

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Suppliers" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the vendors you restock inventory from
          </p>
        </div>
      </div>

      <SupplierTableShell />
    </div>
  );
}

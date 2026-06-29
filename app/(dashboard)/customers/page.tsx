import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CustomerTableShell } from "@/components/customers/customer-table-shell";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Customers" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your customer database
          </p>
        </div>
      </div>

      <CustomerTableShell />
    </div>
  );
}

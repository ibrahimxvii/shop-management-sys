import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PosScreen } from "@/components/pos/pos-screen";

export const metadata: Metadata = {
  title: "POS",
};

export default function PosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "POS" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Point of Sale</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Scan or search products to ring up a walk-in sale
          </p>
        </div>
      </div>

      <PosScreen />
    </div>
  );
}

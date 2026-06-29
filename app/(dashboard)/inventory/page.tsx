import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryStatsBar } from "@/components/inventory/inventory-stats-bar";
import { InventoryTableShell } from "@/components/inventory/inventory-table-shell";
import { InventoryHistoryTable } from "@/components/inventory/inventory-history-sheet";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Inventory" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage your product stock levels
          </p>
        </div>
      </div>

      {/* Stats overview */}
      <InventoryStatsBar />

      {/* Main tabs */}
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Stock Overview</TabsTrigger>
          <TabsTrigger value="history">Movement History</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <InventoryTableShell />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <InventoryHistoryTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

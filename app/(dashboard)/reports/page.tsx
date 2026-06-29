import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ReportsClient } from "@/components/reports/reports-client";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Reports" }]} />
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and export detailed business reports.
        </p>
      </div>

      <ReportsClient />
    </div>
  );
}

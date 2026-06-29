import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { EmployeeTableShell } from "@/components/employees/employee-table-shell";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Employees" }]} />
        <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
      </div>
      <EmployeeTableShell />
    </div>
  );
}

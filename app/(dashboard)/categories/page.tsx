import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { CategoryTableShell } from "@/components/categories/category-table-shell";

export const metadata: Metadata = {
  title: "Categories",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <Breadcrumb items={[{ label: "Categories" }]} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize your products into categories
          </p>
        </div>
      </div>

      <CategoryTableShell />
    </div>
  );
}

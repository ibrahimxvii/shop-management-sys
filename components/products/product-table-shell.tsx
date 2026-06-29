"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  PackagePlus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
} from "lucide-react";
import {
  useProducts,
  useDeleteProduct,
  useBulkDeleteProducts,
  useUpdateProductStatus,
} from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useDebounce } from "@/hooks/use-debounce";
import { getProductColumns } from "./product-columns";
import { DeleteDialog } from "./delete-dialog";
import { BulkActionsBar } from "./bulk-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { ProductWithRelations, ProductStatus } from "@/types/products";

export function ProductTableShell() {
  const router = useRouter();

  // Filter state
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<ProductWithRelations | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = React.useState(false);

  // Data hooks
  const { data: products = [], isLoading, error } = useProducts({
    search: debouncedSearch || undefined,
    status: statusFilter as ProductStatus | "all",
    category_id: categoryFilter,
  });
  const { data: categories = [] } = useCategories();

  // Mutations
  const deleteProduct = useDeleteProduct();
  const bulkDelete = useBulkDeleteProducts();
  const updateStatus = useUpdateProductStatus();

  // Table columns
  const columns = React.useMemo(
    () => getProductColumns({ onDelete: setDeleteTarget }),
    []
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: { pagination: { pageSize: 10 } },
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteProduct.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleBulkDeleteConfirm = async () => {
    await bulkDelete.mutateAsync(selectedIds);
    setRowSelection({});
    setShowBulkDeleteDialog(false);
  };

  const handleBulkStatusUpdate = async (status: ProductStatus) => {
    await updateStatus.mutateAsync({ ids: selectedIds, status });
    setRowSelection({});
  };

  if (error) {
    return (
      <EmptyState
        title="Failed to load products"
        description="There was an error loading your products. Please refresh the page."
        action={{ label: "Refresh", onClick: () => router.refresh() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search products by name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button asChild>
            <Link href="/products/new">
              <PackagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setRowSelection({})}
        onBulkDelete={() => setShowBulkDeleteDialog(true)}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        isLoading={bulkDelete.isPending || updateStatus.isPending}
      />

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b bg-muted/40">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="h-11 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={cn(
                                "flex items-center gap-1.5",
                                header.column.getCanSort() &&
                                  "cursor-pointer select-none hover:text-foreground transition-colors"
                              )}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <span className="opacity-50">
                                  {header.column.getIsSorted() === "asc" ? (
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  ) : header.column.getIsSorted() === "desc" ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronsUpDown className="h-3.5 w-3.5" />
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b last:border-0 transition-colors hover:bg-muted/40 cursor-pointer",
                          row.getIsSelected() && "bg-primary/5"
                        )}
                        onClick={() => router.push(`/products/${row.original.id}`)}
                        data-state={row.getIsSelected() ? "selected" : undefined}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 align-middle">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="p-0"
                      >
                        <EmptyState
                          icon={PackagePlus}
                          title={
                            search || statusFilter !== "all" || categoryFilter !== "all"
                              ? "No products found"
                              : "No products yet"
                          }
                          description={
                            search || statusFilter !== "all" || categoryFilter !== "all"
                              ? "Try adjusting your search or filters"
                              : "Add your first product to get started"
                          }
                          action={
                            !search && statusFilter === "all" && categoryFilter === "all"
                              ? { label: "Add Product", onClick: () => router.push("/products/new") }
                              : undefined
                          }
                          size="sm"
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              {table.getFilteredRowModel().rows.length} product
              {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""} total
            </span>
            {table.getPageCount() > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-foreground font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete dialogs */}
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This will permanently delete the product and all its images. This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        isLoading={deleteProduct.isPending}
      />

      <DeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title={`Delete ${selectedIds.length} product${selectedIds.length > 1 ? "s" : ""}?`}
        description={`This will permanently delete the selected ${selectedIds.length > 1 ? "products" : "product"} and all associated data. This action cannot be undone.`}
        onConfirm={handleBulkDeleteConfirm}
        isLoading={bulkDelete.isPending}
      />
    </div>
  );
}

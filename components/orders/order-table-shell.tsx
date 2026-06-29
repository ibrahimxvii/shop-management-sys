"use client";

import * as React from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { Plus, Search, Filter, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderColumns } from "./order-columns";
import { useOrders, useDeleteOrder, useUpdateOrderStatus } from "@/hooks/use-orders";
import type { OrderWithRelations, OrderStatus } from "@/types/orders";

export function OrderTableShell() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [paymentFilter, setPaymentFilter] = React.useState("all");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [deletingOrder, setDeletingOrder] = React.useState<OrderWithRelations | null>(null);
  const [cancellingOrder, setCancellingOrder] = React.useState<OrderWithRelations | null>(null);

  const { data: orders = [], isLoading } = useOrders({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    payment_status: paymentFilter !== "all" ? paymentFilter : undefined,
  });

  const deleteOrder = useDeleteOrder();
  const updateStatus = useUpdateOrderStatus();

  const columns = getOrderColumns({
    onDelete: setDeletingOrder,
    onCancel: setCancellingOrder,
  });

  const table = useReactTable({
    data: orders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <Filter className="mr-1.5 h-3 w-3" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b bg-muted/40">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left font-medium text-muted-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {columns.map((_, ci) => (
                      <td key={ci} className="px-4 py-3">
                        <Skeleton className="h-5 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium">No orders found</p>
                    {search || statusFilter !== "all" || paymentFilter !== "all" ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your filters
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">
                        Create your first order to get started
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {orders.length} order(s) total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Modal
        open={!!deletingOrder}
        onOpenChange={(open) => !open && setDeletingOrder(null)}
        title="Delete Order"
        description={`Delete order "${deletingOrder?.order_number}"? This cannot be undone. Note: stock will NOT be restored automatically on delete — cancel the order first if you want stock restored.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeletingOrder(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteOrder.isPending}
            onClick={async () => {
              if (!deletingOrder) return;
              await deleteOrder.mutateAsync(deletingOrder.id);
              setDeletingOrder(null);
            }}
          >
            {deleteOrder.isPending ? "Deleting..." : "Delete Order"}
          </Button>
        </div>
      </Modal>

      {/* Cancel Dialog */}
      <Modal
        open={!!cancellingOrder}
        onOpenChange={(open) => !open && setCancellingOrder(null)}
        title="Cancel Order"
        description={`Cancel order "${cancellingOrder?.order_number}"? Stock for all items will be automatically restored.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setCancellingOrder(null)}>
            Go Back
          </Button>
          <Button
            variant="destructive"
            disabled={updateStatus.isPending}
            onClick={async () => {
              if (!cancellingOrder) return;
              await updateStatus.mutateAsync({
                id: cancellingOrder.id,
                status: "cancelled" as OrderStatus,
              });
              setCancellingOrder(null);
            }}
          >
            {updateStatus.isPending ? "Cancelling..." : "Cancel Order"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

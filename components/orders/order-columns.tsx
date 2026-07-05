"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2, XCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";
import type { OrderWithRelations } from "@/types/orders";
import { formatDate, formatCurrency } from "@/lib/utils";

interface OrderColumnsOptions {
  onDelete: (order: OrderWithRelations) => void;
  onCancel: (order: OrderWithRelations) => void;
}

export function getOrderColumns({
  onDelete,
  onCancel,
}: OrderColumnsOptions): ColumnDef<OrderWithRelations>[] {
  return [
    {
      accessorKey: "order_number",
      header: "Order #",
      cell: ({ row }) => (
        <Link
          href={`/orders/${row.original.id}`}
          className="font-mono text-sm font-medium text-primary hover:underline"
        >
          {row.original.order_number}
        </Link>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => {
        const customer = row.original.customer;
        return customer ? (
          <div>
            <p className="font-medium text-sm">{customer.full_name}</p>
            {customer.email && (
              <p className="text-xs text-muted-foreground">{customer.email}</p>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Walk-in</span>
        );
      },
    },
    {
      id: "items_count",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.items?.length ?? 0} item(s)
        </span>
      ),
    },
    {
      accessorKey: "grand_total",
      header: "Total",
      cell: ({ getValue }) => (
        <span className="font-semibold text-sm">{formatCurrency(getValue() as number)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <OrderStatusBadge status={getValue() as OrderWithRelations["status"]} />
      ),
    },
    {
      accessorKey: "payment_status",
      header: "Payment",
      cell: ({ getValue }) => (
        <PaymentStatusBadge status={getValue() as OrderWithRelations["payment_status"]} />
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{formatDate(getValue() as string)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const order = row.original;
        const canCancel = !["cancelled", "refunded"].includes(order.status);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Order
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}/invoice`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Invoice
                </Link>
              </DropdownMenuItem>
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onCancel(order)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Order
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(order)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

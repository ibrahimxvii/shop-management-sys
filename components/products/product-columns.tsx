"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Package,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductStatusBadge } from "./product-status-badge";
import type { ProductWithRelations } from "@/types/products";
import { formatCurrency as formatPrice } from "@/lib/utils";

interface ColumnActions {
  onDelete: (product: ProductWithRelations) => void;
}

export function getProductColumns(
  actions: ColumnActions
): ColumnDef<ProductWithRelations>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      id: "image",
      header: "",
      cell: ({ row }) => {
        const product = row.original;
        const primaryImage =
          product.images?.find((img) => img.is_primary) ?? product.images?.[0];

        return (
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted border flex-shrink-0">
            {primaryImage ? (
              <Image
                src={primaryImage.url}
                alt={product.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        );
      },
      size: 56,
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate max-w-[200px]">
                {product.name}
              </p>
              {product.is_featured && (
                <Star className="h-3 w-3 text-warning-foreground fill-warning/60 flex-shrink-0" aria-label="Featured" />
              )}
            </div>
            {product.sku && (
              <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.category?.name ?? "—"}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "selling_price",
      header: "Price",
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {formatPrice(row.original.selling_price)}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Stock",
      cell: ({ row }) => {
        const product = row.original;
        const isLow =
          product.quantity <= product.low_stock_limit && product.status === "active";
        const isOut = product.quantity === 0;

        return (
          <span
            className={`text-sm font-medium tabular-nums ${
              isOut
                ? "text-destructive"
                : isLow
                  ? "text-warning-foreground"
                  : "text-foreground"
            }`}
          >
            {product.quantity}
            {isLow && !isOut && (
              <span className="ml-1 text-xs text-warning-foreground">low</span>
            )}
            {isOut && (
              <span className="ml-1 text-xs text-destructive">out</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
      enableSorting: false,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const product = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Open actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}`}>
                  <Eye className="h-4 w-4" />
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/products/${product.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                destructive
                onClick={(e) => {
                  e.stopPropagation();
                  actions.onDelete(product);
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      size: 48,
      enableSorting: false,
    },
  ];
}

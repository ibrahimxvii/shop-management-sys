"use client";

import * as React from "react";
import { Trash2, CheckCircle, XCircle, FileEdit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProductStatus } from "@/types/products";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkStatusUpdate: (status: ProductStatus) => void;
  isLoading?: boolean;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusUpdate,
  isLoading = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-md animate-in fade-in-0 slide-in-from-bottom-2"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <button
        onClick={onClearSelection}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Clear selection"
      >
        <X className="h-3.5 w-3.5" />
        {selectedCount} selected
      </button>

      <div className="h-5 w-px bg-border" aria-hidden="true" />

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <FileEdit className="h-3.5 w-3.5" />
              Update Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Set status to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onBulkStatusUpdate("active")}>
              <CheckCircle className="h-4 w-4 text-success" />
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkStatusUpdate("inactive")}>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              Inactive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkStatusUpdate("draft")}>
              <FileEdit className="h-4 w-4 text-warning-foreground" />
              Draft
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          disabled={isLoading}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete ({selectedCount})
        </Button>
      </div>
    </div>
  );
}

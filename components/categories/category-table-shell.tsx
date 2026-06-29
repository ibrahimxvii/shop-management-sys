"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Tags,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategoryStatus,
} from "@/hooks/use-categories";
import { useDebounce } from "@/hooks/use-debounce";
import { CategoryFormDialog } from "./category-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/modal";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CategoryFormValues } from "@/lib/validations/product";
import type { Category as CategoryType } from "@/types/products";

const PAGE_SIZE = 10;

export function CategoryTableShell() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<CategoryType | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CategoryType | null>(null);

  const { data: categories = [], isLoading, error } = useCategories({
    search: debouncedSearch || undefined,
    status: statusFilter as "active" | "inactive" | "all",
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const toggleStatus = useToggleCategoryStatus();

  React.useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const pageData = categories.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (cat: CategoryType) => {
    setEditTarget(cat);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    values: CategoryFormValues,
    image: { url: string; path: string } | null,
    removeImage: boolean
  ) => {
    if (editTarget) {
      await updateCategory.mutateAsync({ id: editTarget.id, values, image, removeImage });
    } else {
      await createCategory.mutateAsync({ values, image });
    }
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteCategory.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (cat: CategoryType) => {
    const next = cat.status === "active" ? "inactive" : "active";
    await toggleStatus.mutateAsync({ id: cat.id, status: next });
  };

  if (error) {
    return (
      <EmptyState
        title="Failed to load categories"
        description="There was an error loading categories. Please refresh."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories…"
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
            </SelectContent>
          </Select>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Category</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={debouncedSearch || statusFilter !== "all" ? "No categories found" : "No categories yet"}
          description={
            debouncedSearch || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first category to get started"
          }
          action={
            !debouncedSearch && statusFilter === "all"
              ? { label: "Add Category", onClick: handleOpenCreate }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground w-14">Image</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Name</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden md:table-cell">Slug</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden lg:table-cell">Description</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Image */}
                      <td className="px-4 py-3 align-middle">
                        <div className="h-10 w-10 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
                          {cat.image_url ? (
                            <Image
                              src={cat.image_url}
                              alt={cat.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Tags className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 align-middle">
                        <span className="font-medium">{cat.name}</span>
                      </td>

                      {/* Slug */}
                      <td className="px-4 py-3 align-middle hidden md:table-cell">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {cat.slug}
                        </code>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 align-middle hidden lg:table-cell max-w-xs">
                        <span className="text-muted-foreground text-xs line-clamp-1">
                          {cat.description || "—"}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={cat.status === "active"}
                            onCheckedChange={() => handleToggleStatus(cat)}
                            disabled={toggleStatus.isPending}
                            aria-label={`Toggle ${cat.name} status`}
                          />
                          <Badge
                            variant={cat.status === "active" ? "default" : "secondary"}
                            className="hidden sm:inline-flex"
                          >
                            {cat.status}
                          </Badge>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-middle text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(cat)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(cat)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{categories.length} categor{categories.length !== 1 ? "ies" : "y"} total</span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-foreground font-medium">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form dialog */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editTarget}
        onSubmit={handleFormSubmit}
        isLoading={createCategory.isPending || updateCategory.isPending}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete &ldquo;{deleteTarget?.name}&rdquo;?</DialogTitle>
            <DialogDescription className="text-center">
              This will permanently delete the category. Products assigned to it will be
              unlinked but not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? (
                <><Loader2Inline /> Deleting…</>
              ) : (
                <><Trash2 className="h-4 w-4" /> Delete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Loader2Inline() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

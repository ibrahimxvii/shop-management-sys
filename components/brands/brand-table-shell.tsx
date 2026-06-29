"use client";

import * as React from "react";
import Image from "next/image";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useToggleBrandStatus,
} from "@/hooks/use-brands";
import { useDebounce } from "@/hooks/use-debounce";
import { BrandFormDialog } from "./brand-form-dialog";
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
import type { Brand } from "@/types/products";
import type { BrandFormValues } from "@/lib/validations/product";

const PAGE_SIZE = 10;

export function BrandTableShell() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);
  const debouncedSearch = useDebounce(search, 300);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Brand | null>(null);

  const { data: brands = [], isLoading, error } = useBrands({
    search: debouncedSearch || undefined,
    status: statusFilter as "active" | "inactive" | "all",
  });

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const toggleStatus = useToggleBrandStatus();

  React.useEffect(() => { setPage(0); }, [debouncedSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(brands.length / PAGE_SIZE));
  const pageData = brands.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (brand: Brand) => {
    setEditTarget(brand);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    values: BrandFormValues,
    logo: { url: string; path: string } | null,
    removeLogo: boolean
  ) => {
    if (editTarget) {
      await updateBrand.mutateAsync({ id: editTarget.id, values, logo, removeLogo });
    } else {
      await createBrand.mutateAsync({ values, logo });
    }
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteBrand.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (brand: Brand) => {
    const next = brand.status === "active" ? "inactive" : "active";
    await toggleStatus.mutateAsync({ id: brand.id, status: next });
  };

  if (error) {
    return (
      <EmptyState
        title="Failed to load brands"
        description="There was an error loading brands. Please refresh."
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
            placeholder="Search brands…"
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
            <span className="hidden sm:inline">Add Brand</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : brands.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={debouncedSearch || statusFilter !== "all" ? "No brands found" : "No brands yet"}
          description={
            debouncedSearch || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first brand to get started"
          }
          action={
            !debouncedSearch && statusFilter === "all"
              ? { label: "Add Brand", onClick: handleOpenCreate }
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
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground w-14">Logo</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Name</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden md:table-cell">Slug</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground hidden lg:table-cell">Description</th>
                    <th className="h-11 px-4 text-left font-medium text-muted-foreground">Status</th>
                    <th className="h-11 px-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((brand) => (
                    <tr
                      key={brand.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      {/* Logo */}
                      <td className="px-4 py-3 align-middle">
                        <div className="h-10 w-10 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
                          {brand.logo_url ? (
                            <Image
                              src={brand.logo_url}
                              alt={brand.name}
                              width={40}
                              height={40}
                              className="object-contain p-1 w-full h-full"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 align-middle font-medium">{brand.name}</td>

                      {/* Slug */}
                      <td className="px-4 py-3 align-middle hidden md:table-cell">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{brand.slug}</code>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 align-middle hidden lg:table-cell max-w-xs">
                        <span className="text-muted-foreground text-xs line-clamp-1">
                          {brand.description || "—"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={brand.status === "active"}
                            onCheckedChange={() => handleToggleStatus(brand)}
                            disabled={toggleStatus.isPending}
                            aria-label={`Toggle ${brand.name} status`}
                          />
                          <Badge
                            variant={brand.status === "active" ? "default" : "secondary"}
                            className="hidden sm:inline-flex"
                          >
                            {brand.status}
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
                            <DropdownMenuItem onClick={() => handleOpenEdit(brand)}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(brand)}
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
            <span>{brands.length} brand{brands.length !== 1 ? "s" : ""} total</span>
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
      <BrandFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        brand={editTarget}
        onSubmit={handleFormSubmit}
        isLoading={createBrand.isPending || updateBrand.isPending}
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
              This will permanently delete the brand. Products assigned to it will be
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
              disabled={deleteBrand.isPending}
            >
              {deleteBrand.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</>
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

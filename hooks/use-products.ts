"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProductsAction,
  getProductByIdAction,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  bulkDeleteProductsAction,
  updateProductStatusAction,
} from "@/app/actions/product.actions";
import type { ProductFilters, ProductStatus } from "@/types/products";
import type { ProductFormValues } from "@/lib/validations/product";

export const productKeys = {
  all: ["products"] as const,
  list: (filters?: ProductFilters) => ["products", "list", filters] as const,
  detail: (id: string) => ["products", "detail", id] as const,
};

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const result = await getProductsAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch products");
      return result.data ?? [];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const result = await getProductByIdAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch product");
      return result.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      images,
    }: {
      values: ProductFormValues;
      images: { url: string; path: string; is_primary: boolean }[];
    }) => createProductAction(values, images),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to create product");
        return;
      }
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product created successfully");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      values,
      images,
      deletedImageIds,
    }: {
      values: ProductFormValues;
      images: { url: string; path: string; is_primary: boolean }[];
      deletedImageIds: string[];
    }) => updateProductAction(id, values, images, deletedImageIds),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to update product");
        return;
      }
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      toast.success("Product updated successfully");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProductAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete product");
        return;
      }
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Product deleted");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
}

export function useBulkDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteProductsAction(ids),
    onSuccess: (result, ids) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to delete products");
        return;
      }
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success(`${ids.length} product${ids.length > 1 ? "s" : ""} deleted`);
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: ProductStatus }) =>
      updateProductStatusAction(ids, status),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error ?? "Failed to update status");
        return;
      }
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
}

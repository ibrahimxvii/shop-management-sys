"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  toggleCategoryStatusAction,
} from "@/app/actions/product.actions";
import type { CategoryFilters } from "@/services/category.service";

export function useCategories(filters?: CategoryFilters) {
  return useQuery({
    queryKey: ["categories", filters],
    queryFn: async () => {
      const result = await getCategoriesAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch categories");
      return result.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      values,
      image,
    }: {
      values: unknown;
      image?: { url: string; path: string } | null;
    }) => {
      const result = await createCategoryAction(values, image);
      if (!result.success) throw new Error(result.error ?? "Failed to create category");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
      image,
      removeImage,
    }: {
      id: string;
      values: unknown;
      image?: { url: string; path: string } | null;
      removeImage?: boolean;
    }) => {
      const result = await updateCategoryAction(id, values, image, removeImage);
      if (!result.success) throw new Error(result.error ?? "Failed to update category");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCategoryAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete category");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleCategoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) => {
      const result = await toggleCategoryStatusAction(id, status);
      if (!result.success) throw new Error(result.error ?? "Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getBrandsAction,
  createBrandAction,
  updateBrandAction,
  deleteBrandAction,
  toggleBrandStatusAction,
} from "@/app/actions/product.actions";
import type { BrandFilters } from "@/services/brand.service";

export function useBrands(filters?: BrandFilters) {
  return useQuery({
    queryKey: ["brands", filters],
    queryFn: async () => {
      const result = await getBrandsAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch brands");
      return result.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      values,
      logo,
    }: {
      values: unknown;
      logo?: { url: string; path: string } | null;
    }) => {
      const result = await createBrandAction(values, logo);
      if (!result.success) throw new Error(result.error ?? "Failed to create brand");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
      logo,
      removeLogo,
    }: {
      id: string;
      values: unknown;
      logo?: { url: string; path: string } | null;
      removeLogo?: boolean;
    }) => {
      const result = await updateBrandAction(id, values, logo, removeLogo);
      if (!result.success) throw new Error(result.error ?? "Failed to update brand");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBrandAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete brand");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Brand deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useToggleBrandStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) => {
      const result = await toggleBrandStatusAction(id, status);
      if (!result.success) throw new Error(result.error ?? "Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

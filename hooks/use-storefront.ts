"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getStorefrontProductsAction,
  getStorefrontProductByIdAction,
  getStorefrontCategoriesAction,
  getStorefrontBrandsAction,
  getStorefrontRelatedProductsAction,
  createStorefrontOrderAction,
  trackStorefrontOrderAction,
} from "@/app/actions/storefront.actions";
import type { StorefrontProductFilters } from "@/types/storefront";

const STOREFRONT_STALE_TIME = 30 * 1000;

export function useStorefrontProducts(filters?: StorefrontProductFilters) {
  return useQuery({
    queryKey: ["storefront", "products", filters],
    queryFn: async () => {
      const result = await getStorefrontProductsAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to load products");
      return result.data ?? { products: [], total: 0 };
    },
    staleTime: STOREFRONT_STALE_TIME,
  });
}

export function useStorefrontProduct(id: string | null) {
  return useQuery({
    queryKey: ["storefront", "product", id],
    queryFn: async () => {
      if (!id) return null;
      const result = await getStorefrontProductByIdAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to load product");
      return result.data;
    },
    enabled: !!id,
    staleTime: STOREFRONT_STALE_TIME,
  });
}

export function useStorefrontCategories() {
  return useQuery({
    queryKey: ["storefront", "categories"],
    queryFn: async () => {
      const result = await getStorefrontCategoriesAction();
      if (!result.success) throw new Error(result.error ?? "Failed to load categories");
      return result.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStorefrontBrands() {
  return useQuery({
    queryKey: ["storefront", "brands"],
    queryFn: async () => {
      const result = await getStorefrontBrandsAction();
      if (!result.success) throw new Error(result.error ?? "Failed to load brands");
      return result.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStorefrontRelatedProducts(productId: string | null, categoryId: string | null) {
  return useQuery({
    queryKey: ["storefront", "related", productId, categoryId],
    queryFn: async () => {
      if (!productId) return [];
      const result = await getStorefrontRelatedProductsAction(productId, categoryId);
      if (!result.success) throw new Error(result.error ?? "Failed to load related products");
      return result.data ?? [];
    },
    enabled: !!productId,
    staleTime: STOREFRONT_STALE_TIME,
  });
}

export function useCreateStorefrontOrder() {
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createStorefrontOrderAction(values);
      if (!result.success || !result.data) throw new Error(result.error ?? "Failed to place order");
      return result.data;
    },
  });
}

export function useTrackStorefrontOrder() {
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await trackStorefrontOrderAction(values);
      if (!result.success || !result.data) throw new Error(result.error ?? "Order not found");
      return result.data;
    },
  });
}

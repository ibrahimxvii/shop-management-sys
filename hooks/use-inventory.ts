"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getInventoryProductsAction,
  getLowStockProductsAction,
  getOutOfStockProductsAction,
  getInventoryHistoryAction,
  stockInAction,
  stockOutAction,
  adjustStockAction,
  getInventoryStatsAction,
} from "@/app/actions/inventory.actions";
import type { InventoryFilters } from "@/services/inventory.service";

export function useInventoryProducts(search?: string) {
  return useQuery({
    queryKey: ["inventory-products", search],
    queryFn: async () => {
      const result = await getInventoryProductsAction(search);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch inventory");
      return result.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const result = await getLowStockProductsAction();
      if (!result.success) throw new Error(result.error ?? "Failed to fetch low stock");
      return result.data ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useOutOfStockProducts() {
  return useQuery({
    queryKey: ["out-of-stock-products"],
    queryFn: async () => {
      const result = await getOutOfStockProductsAction();
      if (!result.success) throw new Error(result.error ?? "Failed to fetch out of stock");
      return result.data ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useInventoryHistory(filters?: InventoryFilters) {
  return useQuery({
    queryKey: ["inventory-history", filters],
    queryFn: async () => {
      const result = await getInventoryHistoryAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch history");
      return result.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: ["inventory-stats"],
    queryFn: async () => {
      const result = await getInventoryStatsAction();
      if (!result.success) throw new Error(result.error ?? "Failed to fetch stats");
      return result.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useStockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await stockInAction(values);
      if (!result.success) throw new Error(result.error ?? "Stock in failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["out-of-stock-products"] });
      toast.success("Stock added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useStockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await stockOutAction(values);
      if (!result.success) throw new Error(result.error ?? "Stock out failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["out-of-stock-products"] });
      toast.success("Stock removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await adjustStockAction(values);
      if (!result.success) throw new Error(result.error ?? "Stock adjustment failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-history"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      queryClient.invalidateQueries({ queryKey: ["low-stock-products"] });
      queryClient.invalidateQueries({ queryKey: ["out-of-stock-products"] });
      toast.success("Stock adjusted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

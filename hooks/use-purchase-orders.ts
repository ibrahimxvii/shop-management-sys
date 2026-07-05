"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPurchaseOrdersAction,
  getPurchaseOrderByIdAction,
  createPurchaseOrderAction,
  receivePurchaseOrderAction,
  cancelPurchaseOrderAction,
  deletePurchaseOrderAction,
} from "@/app/actions/purchase-order.actions";
import type { PurchaseOrderFilters } from "@/types/purchase-orders";

export function usePurchaseOrders(filters?: PurchaseOrderFilters) {
  return useQuery({
    queryKey: ["purchase-orders", filters],
    queryFn: async () => {
      const result = await getPurchaseOrdersAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch purchase orders");
      return result.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ["purchase-order", id],
    queryFn: async () => {
      const result = await getPurchaseOrderByIdAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch purchase order");
      return result.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createPurchaseOrderAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to create purchase order");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await receivePurchaseOrderAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to receive purchase order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Stock received and added to inventory");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await cancelPurchaseOrderAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to cancel purchase order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-order"] });
      toast.success("Purchase order cancelled");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deletePurchaseOrderAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete purchase order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

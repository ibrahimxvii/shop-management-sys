"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getOrdersAction,
  getOrderByIdAction,
  createOrderAction,
  createPosSaleAction,
  updateOrderAction,
  updateOrderStatusAction,
  deleteOrderAction,
  getOrderStatsAction,
  processReturnAction,
  getOrderReturnsAction,
} from "@/app/actions/order.actions";

export function useOrders(filters?: {
  search?: string;
  status?: string;
  payment_status?: string;
  customer_id?: string;
}) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const result = await getOrdersAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch orders");
      return result.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const result = await getOrderByIdAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch order");
      return result.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["order-stats"],
    queryFn: async () => {
      const result = await getOrderStatsAction();
      if (!result.success) throw new Error(result.error ?? "Failed to fetch order stats");
      return result.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createOrderAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to create order");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Order created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreatePosSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createPosSaleAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to complete sale");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Sale completed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: unknown }) => {
      const result = await updateOrderAction(id, values);
      if (!result.success) throw new Error(result.error ?? "Failed to update order");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Order updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await updateOrderStatusAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Order status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useOrderReturns(orderId: string) {
  return useQuery({
    queryKey: ["order-returns", orderId],
    queryFn: async () => {
      const result = await getOrderReturnsAction(orderId);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch returns");
      return result.data ?? [];
    },
    enabled: !!orderId,
    staleTime: 10 * 1000,
  });
}

export function useProcessReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await processReturnAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to process return");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      queryClient.invalidateQueries({ queryKey: ["order-returns"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stats"] });
      toast.success("Return processed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteOrderAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
      toast.success("Order deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

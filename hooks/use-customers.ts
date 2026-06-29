"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getCustomersAction,
  getCustomerByIdAction,
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
} from "@/app/actions/customer.actions";
import type { CustomerFilters } from "@/services/customer.service";

export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: async () => {
      const result = await getCustomersAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch customers");
      return result.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: async () => {
      const result = await getCustomerByIdAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch customer");
      return result.data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createCustomerAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to create customer");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: unknown }) => {
      const result = await updateCustomerAction(id, values);
      if (!result.success) throw new Error(result.error ?? "Failed to update customer");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteCustomerAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete customer");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

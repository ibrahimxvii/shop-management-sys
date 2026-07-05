"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSuppliersAction,
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  toggleSupplierStatusAction,
} from "@/app/actions/supplier.actions";
import type { SupplierFilters } from "@/types/suppliers";

export function useSuppliers(filters?: SupplierFilters) {
  return useQuery({
    queryKey: ["suppliers", filters],
    queryFn: async () => {
      const result = await getSuppliersAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch suppliers");
      return result.data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createSupplierAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to create supplier");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: unknown }) => {
      const result = await updateSupplierAction(id, values);
      if (!result.success) throw new Error(result.error ?? "Failed to update supplier");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteSupplierAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete supplier");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleSupplierStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "inactive" }) => {
      const result = await toggleSupplierStatusAction(id, status);
      if (!result.success) throw new Error(result.error ?? "Failed to update status");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

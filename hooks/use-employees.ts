"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getEmployeesAction,
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
} from "@/app/actions/employee.actions";
import type { EmployeeFilters } from "@/types/employees";

export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: ["employees", filters],
    queryFn: async () => {
      const result = await getEmployeesAction(filters);
      if (!result.success) throw new Error(result.error ?? "Failed to fetch employees");
      return result.data ?? [];
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: unknown) => {
      const result = await createEmployeeAction(values);
      if (!result.success) throw new Error(result.error ?? "Failed to create employee");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: unknown }) => {
      const result = await updateEmployeeAction(id, values);
      if (!result.success) throw new Error(result.error ?? "Failed to update employee");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteEmployeeAction(id);
      if (!result.success) throw new Error(result.error ?? "Failed to delete employee");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

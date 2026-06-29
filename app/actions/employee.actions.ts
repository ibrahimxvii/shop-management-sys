"use server";

import { revalidatePath } from "next/cache";
import { employeeService } from "@/services/employee.service";
import { employeeSchema } from "@/lib/validations/employee";
import { parseError } from "@/lib/errors";
import { requireRole } from "@/lib/auth-helpers";
import type { EmployeeFilters } from "@/types/employees";

export async function getEmployeesAction(filters?: EmployeeFilters) {
  try {
    const employees = await employeeService.getEmployees(filters);
    return { success: true, data: employees, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getEmployeeByIdAction(id: string) {
  try {
    const employee = await employeeService.getEmployeeById(id);
    return { success: true, data: employee, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createEmployeeAction(values: unknown) {
  try {
    await requireRole("admin");
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }

  const validated = employeeSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }
  if (!validated.data.password || validated.data.password.length < 8) {
    return {
      success: false,
      data: null,
      error: "Password must be at least 8 characters",
    };
  }

  try {
    const employee = await employeeService.createEmployee({
      ...validated.data,
      password: validated.data.password,
    });
    revalidatePath("/employees");
    revalidatePath("/dashboard");
    return { success: true, data: employee, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateEmployeeAction(id: string, values: unknown) {
  try {
    await requireRole("admin");
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }

  const validated = employeeSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }

  try {
    const employee = await employeeService.updateEmployee(id, validated.data);
    revalidatePath("/employees");
    return { success: true, data: employee, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function deleteEmployeeAction(id: string) {
  try {
    await requireRole("admin");
  } catch (error) {
    return { success: false, error: parseError(error) };
  }

  try {
    await employeeService.deleteEmployee(id);
    revalidatePath("/employees");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

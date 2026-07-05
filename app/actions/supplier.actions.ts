"use server";

import { revalidatePath } from "next/cache";
import { supplierService } from "@/services/supplier.service";
import { supplierSchema } from "@/lib/validations/supplier";
import type { SupplierFilters } from "@/types/suppliers";
import { parseError } from "@/lib/errors";

export async function getSuppliersAction(filters?: SupplierFilters) {
  try {
    const suppliers = await supplierService.getSuppliers(filters);
    return { success: true, data: suppliers, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getSupplierByIdAction(id: string) {
  try {
    const supplier = await supplierService.getSupplierById(id);
    return { success: true, data: supplier, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createSupplierAction(values: unknown) {
  const validated = supplierSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }
  try {
    const supplier = await supplierService.createSupplier(validated.data);
    revalidatePath("/suppliers");
    return { success: true, data: supplier, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateSupplierAction(id: string, values: unknown) {
  const validated = supplierSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }
  try {
    const supplier = await supplierService.updateSupplier(id, validated.data);
    revalidatePath("/suppliers");
    return { success: true, data: supplier, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function deleteSupplierAction(id: string) {
  try {
    await supplierService.deleteSupplier(id);
    revalidatePath("/suppliers");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function toggleSupplierStatusAction(id: string, status: "active" | "inactive") {
  try {
    await supplierService.toggleStatus(id, status);
    revalidatePath("/suppliers");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

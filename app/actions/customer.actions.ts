"use server";

import { revalidatePath } from "next/cache";
import { customerService, type CustomerFilters } from "@/services/customer.service";
import { customerSchema } from "@/lib/validations/order";
import { parseError } from "@/lib/errors";

export async function getCustomersAction(filters?: CustomerFilters) {
  try {
    const customers = await customerService.getCustomers(filters);
    return { success: true, data: customers, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getCustomerByIdAction(id: string) {
  try {
    const customer = await customerService.getCustomerById(id);
    return { success: true, data: customer, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createCustomerAction(values: unknown) {
  const validated = customerSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }

  try {
    const customer = await customerService.createCustomer(validated.data);
    revalidatePath("/customers");
    revalidatePath("/orders");
    return { success: true, data: customer, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateCustomerAction(id: string, values: unknown) {
  const validated = customerSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }

  try {
    const customer = await customerService.updateCustomer(id, validated.data);
    revalidatePath("/customers");
    revalidatePath("/orders");
    return { success: true, data: customer, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    const orderCount = await customerService.getCustomerOrderCount(id);
    if (orderCount > 0) {
      return {
        success: false,
        error: `Cannot delete customer with ${orderCount} order(s). Remove orders first.`,
      };
    }
    await customerService.deleteCustomer(id);
    revalidatePath("/customers");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

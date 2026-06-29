"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { inventoryService } from "@/services/inventory.service";
import { stockMovementSchema, adjustStockSchema } from "@/lib/validations/inventory";
import { parseError } from "@/lib/errors";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export async function getInventoryProductsAction(search?: string) {
  try {
    const products = await inventoryService.getInventoryProducts(search);
    return { success: true, data: products, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getLowStockProductsAction() {
  try {
    const products = await inventoryService.getLowStockProducts();
    return { success: true, data: products, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getOutOfStockProductsAction() {
  try {
    const products = await inventoryService.getOutOfStockProducts();
    return { success: true, data: products, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getInventoryHistoryAction(filters?: {
  product_id?: string;
  action?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const history = await inventoryService.getInventoryHistory(filters);
    return { success: true, data: history, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function stockInAction(values: unknown) {
  const validated = stockMovementSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();
    await inventoryService.stockIn(
      validated.data.product_id,
      validated.data.quantity,
      userId,
      validated.data.notes
    );
    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function stockOutAction(values: unknown) {
  const validated = stockMovementSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();
    await inventoryService.stockOut(
      validated.data.product_id,
      validated.data.quantity,
      userId,
      validated.data.notes
    );
    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function adjustStockAction(values: unknown) {
  const validated = adjustStockSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();
    await inventoryService.adjustStock(
      validated.data.product_id,
      validated.data.new_quantity,
      userId,
      validated.data.notes
    );
    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function getInventoryStatsAction() {
  try {
    const stats = await inventoryService.getStats();
    return { success: true, data: stats, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

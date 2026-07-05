"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { purchaseOrderService } from "@/services/purchase-order.service";
import { purchaseOrderSchema } from "@/lib/validations/purchase-order";
import type { PurchaseOrderFilters } from "@/types/purchase-orders";
import { parseError } from "@/lib/errors";

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

export async function getPurchaseOrdersAction(filters?: PurchaseOrderFilters) {
  try {
    const orders = await purchaseOrderService.getPurchaseOrders(filters);
    return { success: true, data: orders, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getPurchaseOrderByIdAction(id: string) {
  try {
    const order = await purchaseOrderService.getPurchaseOrderById(id);
    return { success: true, data: order, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createPurchaseOrderAction(values: unknown) {
  const validated = purchaseOrderSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }
  try {
    const userId = await getCurrentUserId();
    const id = await purchaseOrderService.createPurchaseOrder({
      supplier_id: validated.data.supplier_id,
      items: validated.data.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      })),
      notes: validated.data.notes,
      user_id: userId,
    });
    revalidatePath("/purchase-orders");
    return { success: true, data: { id }, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function receivePurchaseOrderAction(id: string) {
  try {
    const userId = await getCurrentUserId();
    await purchaseOrderService.receivePurchaseOrder(id, userId);
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${id}`);
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function cancelPurchaseOrderAction(id: string) {
  try {
    await purchaseOrderService.cancelPurchaseOrder(id);
    revalidatePath("/purchase-orders");
    revalidatePath(`/purchase-orders/${id}`);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function deletePurchaseOrderAction(id: string) {
  try {
    await purchaseOrderService.deletePurchaseOrder(id);
    revalidatePath("/purchase-orders");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

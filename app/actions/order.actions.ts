"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { orderService } from "@/services/order.service";
import { orderSchema, updateOrderStatusSchema } from "@/lib/validations/order";
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

export async function getOrdersAction(filters?: {
  search?: string;
  status?: string;
  payment_status?: string;
  customer_id?: string;
  limit?: number;
}) {
  try {
    const orders = await orderService.getOrders(filters as Parameters<typeof orderService.getOrders>[0]);
    return { success: true, data: orders, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getOrderByIdAction(id: string) {
  try {
    const order = await orderService.getOrderById(id);
    return { success: true, data: order, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function createOrderAction(values: unknown) {
  const validated = orderSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, data: null, error: validated.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();
    const orderId = await orderService.createOrder({
      customer_id: validated.data.customer_id || undefined,
      items: validated.data.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
      })),
      discount_amount: validated.data.discount_amount,
      tax_amount: validated.data.tax_amount,
      shipping_amount: validated.data.shipping_amount,
      payment_method: validated.data.payment_method,
      payment_status: validated.data.payment_status,
      notes: validated.data.notes,
      user_id: userId,
    });

    revalidatePath("/orders");
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    return { success: true, data: { id: orderId }, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function updateOrderAction(id: string, values: unknown) {
  const validated = orderSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();
    await orderService.updateOrder({
      order_id: id,
      customer_id: validated.data.customer_id || undefined,
      items: validated.data.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
      })),
      discount_amount: validated.data.discount_amount,
      tax_amount: validated.data.tax_amount,
      shipping_amount: validated.data.shipping_amount,
      payment_method: validated.data.payment_method,
      payment_status: validated.data.payment_status,
      status: validated.data.status,
      notes: validated.data.notes,
      user_id: userId,
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${id}`);
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function updateOrderStatusAction(values: unknown) {
  const validated = updateOrderStatusSchema.safeParse(values);
  if (!validated.success) {
    return { success: false, error: validated.error.errors[0].message };
  }

  try {
    const userId = await getCurrentUserId();
    await orderService.updateOrderStatus(validated.data.id, validated.data.status, userId);
    revalidatePath("/orders");
    revalidatePath(`/orders/${validated.data.id}`);
    revalidatePath("/dashboard");
    revalidatePath("/inventory");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function deleteOrderAction(id: string) {
  try {
    await orderService.deleteOrder(id);
    revalidatePath("/orders");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: parseError(error) };
  }
}

export async function getOrderStatsAction() {
  try {
    const stats = await orderService.getStats();
    return { success: true, data: stats, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

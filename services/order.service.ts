import { createClient } from "@/lib/supabase/server";
import type {
  Order,
  OrderWithRelations,
  OrderFilters,
  OrderStats,
  OrderStatus,
  OrderReturnWithItems,
} from "@/types/orders";

const ORDER_WITH_RELATIONS = `
  *,
  customer:customers(*),
  items:order_items(*, product:products(id, name, sku, selling_price)),
  payments(*)
`;

export const orderService = {
  async getOrders(filters?: OrderFilters): Promise<OrderWithRelations[]> {
    const supabase = await createClient();

    let query = supabase
      .from("orders")
      .select(ORDER_WITH_RELATIONS)
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.payment_status && filters.payment_status !== "all") {
      query = query.eq("payment_status", filters.payment_status);
    }
    if (filters?.customer_id) {
      query = query.eq("customer_id", filters.customer_id);
    }
    if (filters?.search) {
      query = query.ilike("order_number", `%${filters.search}%`);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OrderWithRelations[];
  },

  async getOrderById(id: string): Promise<OrderWithRelations | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_WITH_RELATIONS)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data as unknown as OrderWithRelations;
  },

  async createOrder(params: {
    customer_id?: string;
    items: { product_id: string; quantity: number; unit_price: number; discount_percent: number }[];
    discount_amount: number;
    tax_amount: number;
    shipping_amount: number;
    payment_method: string;
    payment_status: string;
    notes?: string;
    user_id: string;
    status?: OrderStatus;
  }): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_order_transaction", {
      p_customer_id: params.customer_id || null,
      p_items: params.items,
      p_discount_amount: params.discount_amount,
      p_tax_amount: params.tax_amount,
      p_shipping_amount: params.shipping_amount,
      p_payment_method: params.payment_method,
      p_payment_status: params.payment_status,
      p_notes: params.notes || null,
      p_user_id: params.user_id,
      ...(params.status ? { p_status: params.status } : {}),
    });

    if (error) throw new Error(error.message);
    return data as string;
  },

  async updateOrder(params: {
    order_id: string;
    customer_id?: string;
    items: { product_id: string; quantity: number; unit_price: number; discount_percent: number }[];
    discount_amount: number;
    tax_amount: number;
    shipping_amount: number;
    payment_method: string;
    payment_status: string;
    status: string;
    notes?: string;
    user_id: string;
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase.rpc("update_order_transaction", {
      p_order_id: params.order_id,
      p_customer_id: params.customer_id || null,
      p_items: params.items,
      p_discount_amount: params.discount_amount,
      p_tax_amount: params.tax_amount,
      p_shipping_amount: params.shipping_amount,
      p_payment_method: params.payment_method,
      p_payment_status: params.payment_status,
      p_status: params.status,
      p_notes: params.notes || null,
      p_user_id: params.user_id,
    });

    if (error) throw new Error(error.message);
  },

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    userId: string
  ): Promise<void> {
    const needsStockRestore = status === "cancelled" || status === "refunded";

    if (needsStockRestore) {
      const supabase = await createClient();
      const { error } = await supabase.rpc("cancel_order_transaction", {
        p_order_id: orderId,
        p_new_status: status,
        p_user_id: userId,
      });
      if (error) throw new Error(error.message);
    } else {
      const supabase = await createClient();
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw new Error(error.message);
    }
  },

  async deleteOrder(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getStats(): Promise<OrderStats> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_order_stats");
    if (error) throw new Error(error.message);
    return data as unknown as OrderStats;
  },

  async processReturn(params: {
    order_id: string;
    items: { order_item_id: string; quantity: number }[];
    reason?: string;
    refund_method: string;
    user_id: string;
  }): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("process_return_transaction", {
      p_order_id: params.order_id,
      p_items: params.items,
      p_reason: params.reason || null,
      p_refund_method: params.refund_method,
      p_user_id: params.user_id,
    });

    if (error) throw new Error(error.message);
    return data as string;
  },

  async getReturnsForOrder(orderId: string): Promise<OrderReturnWithItems[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("order_returns")
      .select(`*, items:order_return_items(*, product:products(id, name, sku))`)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OrderReturnWithItems[];
  },

  async getRecentOrders(limit = 5): Promise<OrderWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_WITH_RELATIONS)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as OrderWithRelations[];
  },
};

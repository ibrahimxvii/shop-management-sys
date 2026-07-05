import { createClient } from "@/lib/supabase/server";
import type {
  PurchaseOrderWithRelations,
  PurchaseOrderFilters,
} from "@/types/purchase-orders";

const PO_WITH_RELATIONS = `
  *,
  supplier:suppliers(*),
  items:purchase_order_items(*, product:products(id, name, sku))
`;

export const purchaseOrderService = {
  async getPurchaseOrders(filters?: PurchaseOrderFilters): Promise<PurchaseOrderWithRelations[]> {
    const supabase = await createClient();

    let query = supabase
      .from("purchase_orders")
      .select(PO_WITH_RELATIONS)
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.supplier_id) {
      query = query.eq("supplier_id", filters.supplier_id);
    }
    if (filters?.search) {
      query = query.ilike("po_number", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as PurchaseOrderWithRelations[];
  },

  async getPurchaseOrderById(id: string): Promise<PurchaseOrderWithRelations | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(PO_WITH_RELATIONS)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data as unknown as PurchaseOrderWithRelations;
  },

  async createPurchaseOrder(params: {
    supplier_id: string;
    items: { product_id: string; quantity: number; unit_cost: number }[];
    notes?: string;
    user_id: string;
  }): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_purchase_order_transaction", {
      p_supplier_id: params.supplier_id,
      p_items: params.items,
      p_notes: params.notes || null,
      p_user_id: params.user_id,
    });

    if (error) throw new Error(error.message);
    return data as string;
  },

  async receivePurchaseOrder(poId: string, userId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.rpc("receive_purchase_order_transaction", {
      p_po_id: poId,
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
  },

  async cancelPurchaseOrder(poId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: "cancelled" })
      .eq("id", poId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
  },

  async deletePurchaseOrder(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

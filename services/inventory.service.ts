import { createClient } from "@/lib/supabase/server";
import type { InventoryHistory, InventoryHistoryWithRelations, InventoryStats } from "@/types/inventory";
import type { ProductWithRelations } from "@/types/products";

const HISTORY_WITH_RELATIONS = `
  *,
  product:products(id, name, sku),
  user:profiles(id, full_name, email)
`;

export interface InventoryFilters {
  search?: string;
  action?: string;
  product_id?: string;
  limit?: number;
  offset?: number;
}

export const inventoryService = {
  async getInventoryProducts(search?: string): Promise<ProductWithRelations[]> {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(`*, category:categories(*), brand:brands(*), images:product_images(*)`)
      .order("name", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as ProductWithRelations[];
  },

  async getLowStockProducts(): Promise<ProductWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`*, category:categories(*), brand:brands(*), images:product_images(*)`)
      .eq("status", "active")
      .gt("quantity", 0)
      .filter("quantity", "lte", "low_stock_limit")
      .order("quantity", { ascending: true });

    if (error) throw new Error(error.message);

    const products = (data ?? []) as ProductWithRelations[];
    return products.filter((p) => p.quantity <= p.low_stock_limit && p.quantity > 0);
  },

  async getOutOfStockProducts(): Promise<ProductWithRelations[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(`*, category:categories(*), brand:brands(*), images:product_images(*)`)
      .eq("quantity", 0)
      .order("updated_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as ProductWithRelations[];
  },

  async getInventoryHistory(
    filters?: InventoryFilters
  ): Promise<InventoryHistoryWithRelations[]> {
    const supabase = await createClient();

    let query = supabase
      .from("inventory_history")
      .select(HISTORY_WITH_RELATIONS)
      .order("created_at", { ascending: false });

    if (filters?.product_id) {
      query = query.eq("product_id", filters.product_id);
    }
    if (filters?.action && filters.action !== "all") {
      query = query.eq("action", filters.action);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit ?? 20) - 1
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as InventoryHistoryWithRelations[];
  },

  async stockIn(
    productId: string,
    quantity: number,
    userId: string,
    notes?: string
  ): Promise<void> {
    const supabase = await createClient();

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", productId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const previousQty = product.quantity as number;
    const newQty = previousQty + quantity;

    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: newQty })
      .eq("id", productId);

    if (updateError) throw new Error(updateError.message);

    await inventoryService._recordHistory({
      productId,
      userId,
      action: "stock_in",
      previousQty,
      newQty,
      change: quantity,
      notes,
    });
  },

  async stockOut(
    productId: string,
    quantity: number,
    userId: string,
    notes?: string
  ): Promise<void> {
    const supabase = await createClient();

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", productId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const previousQty = product.quantity as number;
    if (previousQty < quantity) {
      throw new Error(`Insufficient stock. Available: ${previousQty}, Requested: ${quantity}`);
    }

    const newQty = previousQty - quantity;

    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: newQty })
      .eq("id", productId);

    if (updateError) throw new Error(updateError.message);

    await inventoryService._recordHistory({
      productId,
      userId,
      action: "stock_out",
      previousQty,
      newQty,
      change: -quantity,
      notes,
    });
  },

  async adjustStock(
    productId: string,
    newQuantity: number,
    userId: string,
    notes?: string
  ): Promise<void> {
    const supabase = await createClient();

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", productId)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    const previousQty = product.quantity as number;
    const change = newQuantity - previousQty;

    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: newQuantity })
      .eq("id", productId);

    if (updateError) throw new Error(updateError.message);

    await inventoryService._recordHistory({
      productId,
      userId,
      action: "adjustment",
      previousQty,
      newQty: newQuantity,
      change,
      notes,
    });
  },

  async getStats(): Promise<InventoryStats> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_inventory_stats");
    if (error) throw new Error(error.message);
    return data as InventoryStats;
  },

  async _recordHistory({
    productId,
    userId,
    action,
    previousQty,
    newQty,
    change,
    notes,
  }: {
    productId: string;
    userId: string;
    action: string;
    previousQty: number;
    newQty: number;
    change: number;
    notes?: string;
  }): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("inventory_history").insert({
      product_id: productId,
      user_id: userId,
      action,
      previous_quantity: previousQty,
      updated_quantity: newQty,
      quantity_change: change,
      notes: notes || null,
    });
    if (error) throw new Error(error.message);
  },
};

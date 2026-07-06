import { createClient } from "@/lib/supabase/server";
import { escapePostgrestValue } from "@/lib/postgrest";
import type {
  StorefrontProduct,
  StorefrontCategory,
  StorefrontBrand,
  StorefrontProductFilters,
  StorefrontCheckoutInput,
  StorefrontOrderResult,
  StorefrontOrderStatus,
} from "@/types/storefront";

const WITH_RELATIONS = `*, category:categories(id,name,slug), brand:brands(id,name,slug), images:product_images(url,is_primary)`;

export const storefrontService = {
  async getProducts(
    filters: StorefrontProductFilters = {}
  ): Promise<{ products: StorefrontProduct[]; total: number }> {
    const supabase = await createClient();
    let query = supabase
      .from("products")
      .select(WITH_RELATIONS, { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters.brandId) query = query.eq("brand_id", filters.brandId);
    if (filters.search?.trim()) {
      const term = escapePostgrestValue(`%${filters.search.trim()}%`);
      query = query.or(`name.ilike.${term},sku.ilike.${term}`);
    }

    const limit = filters.limit ?? 24;
    const offset = filters.offset ?? 0;
    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return { products: (data ?? []) as unknown as StorefrontProduct[], total: count ?? 0 };
  },

  async getProductById(id: string): Promise<StorefrontProduct | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(WITH_RELATIONS)
      .eq("id", id)
      .eq("status", "active")
      .single();
    if (error) return null;
    return data as unknown as StorefrontProduct;
  },

  async getCategories(): Promise<StorefrontCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, image_url")
      .eq("status", "active")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as StorefrontCategory[];
  },

  async getBrands(): Promise<StorefrontBrand[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("brands")
      .select("id, name, slug, logo_url")
      .eq("status", "active")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as StorefrontBrand[];
  },

  async getBestSellers(limit = 8): Promise<StorefrontProduct[]> {
    const supabase = await createClient();
    const { data: bestSellers } = await supabase.rpc("get_best_selling_products", { p_limit: limit });
    const ids = ((bestSellers ?? []) as unknown as Array<{ product_id: string }>).map((b) => b.product_id);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from("products")
      .select(WITH_RELATIONS)
      .in("id", ids)
      .eq("status", "active");
    if (error) throw new Error(error.message);

    const products = (data ?? []) as unknown as StorefrontProduct[];
    const productsById = new Map(products.map((p) => [p.id, p]));
    return ids.map((id) => productsById.get(id)).filter((p): p is StorefrontProduct => !!p);
  },

  async getNewArrivals(limit = 8): Promise<StorefrontProduct[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(WITH_RELATIONS)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as StorefrontProduct[];
  },

  /** Frequently-bought-together primary source, with a same-category fallback for a sparse/cold-start dataset. */
  async getRelatedProducts(productId: string, categoryId: string | null, limit = 5): Promise<StorefrontProduct[]> {
    const supabase = await createClient();
    const { data: fbt } = await supabase.rpc("get_frequently_bought_together", {
      p_product_id: productId,
      p_limit: limit,
    });
    const fbtIds = ((fbt ?? []) as unknown as Array<{ product_id: string }>).map((f) => f.product_id);

    if (fbtIds.length > 0) {
      const { data } = await supabase
        .from("products")
        .select(WITH_RELATIONS)
        .in("id", fbtIds)
        .eq("status", "active");
      if (data && data.length > 0) return data as unknown as StorefrontProduct[];
    }

    if (!categoryId) return [];
    const { data } = await supabase
      .from("products")
      .select(WITH_RELATIONS)
      .eq("category_id", categoryId)
      .eq("status", "active")
      .neq("id", productId)
      .limit(limit);
    return (data ?? []) as unknown as StorefrontProduct[];
  },

  async checkout(input: StorefrontCheckoutInput): Promise<StorefrontOrderResult> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("create_storefront_order_transaction", {
      p_client_reference_id: input.clientReferenceId,
      p_full_name: input.fullName,
      p_phone: input.phone,
      p_email: input.email ?? null,
      p_address: input.address ?? null,
      p_city: input.city ?? null,
      p_notes: input.notes ?? null,
      p_items: input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    });
    if (error) throw new Error(error.message);

    const row = (data as unknown as Array<{ order_id: string; order_number: string }> | null)?.[0];
    if (!row) throw new Error("Order could not be created");
    return { orderId: row.order_id, orderNumber: row.order_number };
  },

  async trackOrder(orderNumber: string, phone: string): Promise<StorefrontOrderStatus | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_storefront_order_status", {
      p_order_number: orderNumber,
      p_phone: phone,
    });
    if (error) throw new Error(error.message);
    return (data as unknown as StorefrontOrderStatus[] | null)?.[0] ?? null;
  },
};

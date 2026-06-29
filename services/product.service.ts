import { createClient } from "@/lib/supabase/server";
import type {
  Product,
  ProductWithRelations,
  ProductFilters,
  PaginatedProducts,
} from "@/types/products";
import type { ProductFormValues } from "@/lib/validations/product";

const WITH_RELATIONS = `*, category:categories(*), brand:brands(*), images:product_images(*)`;

export const productService = {
  async getProducts(filters?: ProductFilters): Promise<ProductWithRelations[]> {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(WITH_RELATIONS)
      .order("created_at", { ascending: false });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.category_id && filters.category_id !== "all") {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters?.brand_id && filters.brand_id !== "all") {
      query = query.eq("brand_id", filters.brand_id);
    }
    if (filters?.featured) {
      query = query.eq("is_featured", true);
    }
    if (filters?.search?.trim()) {
      const term = filters.search.trim();
      query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as ProductWithRelations[];
  },

  /**
   * Server-side paginated variant of getProducts — applies the same filters
   * but uses .range() + an exact count instead of returning every matching
   * row. Prefer this for list pages with large catalogs.
   */
  async getProductsPaginated(
    filters: ProductFilters & { limit: number; offset: number }
  ): Promise<PaginatedProducts> {
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select(WITH_RELATIONS, { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.category_id && filters.category_id !== "all") {
      query = query.eq("category_id", filters.category_id);
    }
    if (filters.brand_id && filters.brand_id !== "all") {
      query = query.eq("brand_id", filters.brand_id);
    }
    if (filters.featured) {
      query = query.eq("is_featured", true);
    }
    if (filters.search) {
      const term = filters.search.trim();
      if (term) {
        query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
      }
    }

    const { data, error, count } = await query.range(
      filters.offset,
      filters.offset + filters.limit - 1
    );
    if (error) throw new Error(error.message);

    return {
      data: (data ?? []) as ProductWithRelations[],
      total: count ?? 0,
    };
  },

  async getProductById(id: string): Promise<ProductWithRelations | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select(WITH_RELATIONS)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data as ProductWithRelations;
  },

  async createProduct(
    values: ProductFormValues,
    images: { url: string; path: string; is_primary: boolean }[]
  ): Promise<Product> {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name: values.name,
        description: values.description || null,
        sku: values.sku || null,
        barcode: values.barcode || null,
        category_id: values.category_id || null,
        brand_id: values.brand_id || null,
        purchase_price: values.purchase_price,
        selling_price: values.selling_price,
        quantity: values.quantity,
        low_stock_limit: values.low_stock_limit,
        status: values.status,
        is_featured: values.is_featured,
        tags: values.tags,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (images.length > 0) {
      const { error: imgError } = await supabase.from("product_images").insert(
        images.map((img, idx) => ({
          product_id: product.id,
          url: img.url,
          path: img.path,
          is_primary: idx === 0 ? true : img.is_primary,
          sort_order: idx,
        }))
      );
      if (imgError) throw new Error(imgError.message);
    }

    return product as Product;
  },

  async updateProduct(
    id: string,
    values: ProductFormValues,
    images: { url: string; path: string; is_primary: boolean }[],
    deletedImageIds: string[]
  ): Promise<Product> {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from("products")
      .update({
        name: values.name,
        description: values.description || null,
        sku: values.sku || null,
        barcode: values.barcode || null,
        category_id: values.category_id || null,
        brand_id: values.brand_id || null,
        purchase_price: values.purchase_price,
        selling_price: values.selling_price,
        quantity: values.quantity,
        low_stock_limit: values.low_stock_limit,
        status: values.status,
        is_featured: values.is_featured,
        tags: values.tags,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    if (deletedImageIds.length > 0) {
      await supabase
        .from("product_images")
        .delete()
        .in("id", deletedImageIds);
    }

    if (images.length > 0) {
      const { data: existingImages } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", id);

      const startOrder = existingImages?.length ?? 0;
      await supabase.from("product_images").insert(
        images.map((img, idx) => ({
          product_id: id,
          url: img.url,
          path: img.path,
          is_primary: startOrder === 0 && idx === 0,
          sort_order: startOrder + idx,
        }))
      );
    }

    return product as Product;
  },

  async deleteProduct(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async bulkDeleteProducts(ids: string[]): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) throw new Error(error.message);
  },

  async updateProductStatus(
    ids: string[],
    status: "active" | "inactive" | "draft"
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .update({ status })
      .in("id", ids);
    if (error) throw new Error(error.message);
  },

  async getDashboardStats() {
    const supabase = await createClient();

    const [
      { count: totalProducts },
      { count: activeProducts },
      { count: totalCustomers },
      { data: recentProducts },
      { data: allProducts },
      { count: totalCategories },
      { count: totalBrands },
      { data: recentHistory },
      { data: orderStatsData },
      { data: recentOrders },
      { count: activeEmployees },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.from("customers").select("*", { count: "exact", head: true }),
      supabase
        .from("products")
        .select(WITH_RELATIONS)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("products")
        .select("quantity, low_stock_limit, selling_price, status, created_at, name, sku"),
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("brands").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("inventory_history")
        .select("*, product:products(id, name, sku)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.rpc("get_order_stats"),
      supabase
        .from("orders")
        .select("*, customer:customers(id, full_name, email), items:order_items(id, quantity, total_price)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "active"),
    ]);

    const products = allProducts ?? [];
    const lowStockProducts = products.filter(
      (p) => p.quantity > 0 && p.quantity <= p.low_stock_limit && p.status === "active"
    );
    const outOfStockCount = products.filter(
      (p) => p.quantity === 0 && p.status === "active"
    ).length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.selling_price * p.quantity,
      0
    );

    // Daily product additions for the last 30 days
    const now = new Date();
    const dailyProducts: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = products.filter(
        (p) => p.created_at.slice(0, 10) === dateStr
      ).length;
      dailyProducts.push({ date: dateStr, count });
    }

    const statusGroups = ["active", "inactive", "draft"].map((status) => ({
      status,
      count: products.filter((p) => p.status === status).length,
    }));

    const orderStats = (orderStatsData as {
      total_orders: number;
      pending_orders: number;
      completed_orders: number;
      total_revenue: number;
    } | null) ?? {
      total_orders: 0,
      pending_orders: 0,
      completed_orders: 0,
      total_revenue: 0,
    };

    return {
      totalProducts: totalProducts ?? 0,
      activeProducts: activeProducts ?? 0,
      lowStockCount: lowStockProducts.length,
      outOfStockCount,
      featuredCount: products.filter((p) => p.status === "active").length,
      totalInventoryValue,
      totalCustomers: totalCustomers ?? 0,
      totalCategories: totalCategories ?? 0,
      totalBrands: totalBrands ?? 0,
      recentProducts: (recentProducts ?? []) as ProductWithRelations[],
      lowStockProducts: lowStockProducts.slice(0, 6) as unknown as Product[],
      productsByStatus: statusGroups,
      dailyProducts,
      recentInventoryActivity: recentHistory ?? [],
      activeEmployees: activeEmployees ?? 0,
      totalOrders: orderStats.total_orders,
      pendingOrders: orderStats.pending_orders,
      completedOrders: orderStats.completed_orders,
      totalRevenue: orderStats.total_revenue,
      recentOrders: (recentOrders ?? []) as Array<{
        id: string;
        order_number: string;
        status: string;
        payment_status: string;
        grand_total: number;
        created_at: string;
        customer: { id: string; full_name: string; email: string | null } | null;
        items: Array<{ id: string; quantity: number; total_price: number }>;
      }>,
    };
  },
};

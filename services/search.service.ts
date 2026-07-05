import { createClient } from "@/lib/supabase/server";
import { escapePostgrestValue } from "@/lib/postgrest";

export interface SearchProductResult {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number;
}

export interface SearchOrderResult {
  id: string;
  order_number: string;
  grand_total: number;
  customer_name: string | null;
}

export interface SearchCustomerResult {
  id: string;
  full_name: string;
  email: string | null;
}

export interface GlobalSearchResults {
  products: SearchProductResult[];
  orders: SearchOrderResult[];
  customers: SearchCustomerResult[];
}

const RESULT_LIMIT = 6;

export const searchService = {
  async globalSearch(query: string): Promise<GlobalSearchResults> {
    const supabase = await createClient();
    const like = escapePostgrestValue(`%${query}%`);

    const [productsRes, ordersRes, customersRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku, selling_price")
        .or(`name.ilike.${like},sku.ilike.${like}`)
        .limit(RESULT_LIMIT),
      supabase
        .from("orders")
        .select("id, order_number, grand_total, customer:customers(full_name)")
        .ilike("order_number", `%${query}%`)
        .limit(RESULT_LIMIT),
      supabase
        .from("customers")
        .select("id, full_name, email")
        .or(`full_name.ilike.${like},email.ilike.${like}`)
        .limit(RESULT_LIMIT),
    ]);

    if (productsRes.error) throw new Error(productsRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);
    if (customersRes.error) throw new Error(customersRes.error.message);

    return {
      products: (productsRes.data ?? []) as SearchProductResult[],
      orders: (ordersRes.data ?? []).map((o) => ({
        id: o.id,
        order_number: o.order_number,
        grand_total: o.grand_total,
        customer_name: (o.customer as unknown as { full_name: string } | null)?.full_name ?? null,
      })),
      customers: (customersRes.data ?? []) as SearchCustomerResult[],
    };
  },
};

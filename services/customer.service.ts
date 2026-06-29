import { createClient } from "@/lib/supabase/server";
import type { Customer } from "@/types/orders";
import type { CustomerFormValues } from "@/lib/validations/order";

export interface CustomerFilters {
  search?: string;
  status?: "active" | "inactive" | "all";
  limit?: number;
  offset?: number;
}

export interface CustomerWithStats extends Customer {
  total_orders: number;
  total_spending: number;
  last_order_date: string | null;
}

export const customerService = {
  async getCustomers(filters?: CustomerFilters): Promise<CustomerWithStats[]> {
    const supabase = await createClient();

    let query = supabase
      .from("customers")
      .select(`*, orders!orders_customer_id_fkey(id, grand_total, created_at)`)
      .order("full_name", { ascending: true });

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((c) => {
      const orders = (c.orders ?? []) as { id: string; grand_total: number; created_at: string }[];
      const dates = orders.map((o) => o.created_at).sort().reverse();
      return {
        ...c,
        orders: undefined,
        total_orders: orders.length,
        total_spending: orders.reduce((sum, o) => sum + (o.grand_total ?? 0), 0),
        last_order_date: dates[0] ?? null,
      } as CustomerWithStats;
    });
  },

  async getCustomerById(id: string): Promise<CustomerWithStats | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .select(`*, orders!orders_customer_id_fkey(id, order_number, status, payment_status, grand_total, created_at)`)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    const orders = (data.orders ?? []) as Array<{ id: string; grand_total: number; created_at: string }>;
    const dates = orders.map((o) => o.created_at).sort().reverse();

    return {
      ...data,
      total_orders: orders.length,
      total_spending: orders.reduce((sum, o) => sum + (o.grand_total ?? 0), 0),
      last_order_date: dates[0] ?? null,
    } as CustomerWithStats;
  },

  async createCustomer(values: CustomerFormValues): Promise<Customer> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || "US",
        postal_code: values.postal_code || null,
        notes: values.notes || null,
        status: values.status ?? "active",
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  },

  async updateCustomer(id: string, values: CustomerFormValues): Promise<Customer> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("customers")
      .update({
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        country: values.country || "US",
        postal_code: values.postal_code || null,
        notes: values.notes || null,
        status: values.status ?? "active",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getCustomerOrderCount(id: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", id);
    if (error) return 0;
    return count ?? 0;
  },
};

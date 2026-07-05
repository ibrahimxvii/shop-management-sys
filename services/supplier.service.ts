import { createClient } from "@/lib/supabase/server";
import { escapePostgrestValue } from "@/lib/postgrest";
import type { Supplier, SupplierFilters } from "@/types/suppliers";
import type { SupplierFormValues } from "@/lib/validations/supplier";

export const supplierService = {
  async getSuppliers(filters?: SupplierFilters): Promise<Supplier[]> {
    const supabase = await createClient();

    let query = supabase.from("suppliers").select("*").order("name", { ascending: true });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.search) {
      const like = escapePostgrestValue(`%${filters.search}%`);
      query = query.or(`name.ilike.${like},contact_name.ilike.${like}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Supplier[];
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data as Supplier;
  },

  async createSupplier(values: SupplierFormValues): Promise<Supplier> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        name: values.name,
        contact_name: values.contact_name || null,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        country: values.country,
        notes: values.notes || null,
        status: values.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Supplier;
  },

  async updateSupplier(id: string, values: SupplierFormValues): Promise<Supplier> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("suppliers")
      .update({
        name: values.name,
        contact_name: values.contact_name || null,
        email: values.email || null,
        phone: values.phone || null,
        address: values.address || null,
        city: values.city || null,
        country: values.country,
        notes: values.notes || null,
        status: values.status,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Supplier;
  },

  async deleteSupplier(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async toggleStatus(id: string, status: "active" | "inactive"): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("suppliers").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
  },
};

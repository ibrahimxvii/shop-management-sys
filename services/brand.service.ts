import { createClient } from "@/lib/supabase/server";
import type { Brand } from "@/types/products";
import type { BrandFormValues } from "@/lib/validations/product";

export interface BrandFilters {
  search?: string;
  status?: "active" | "inactive" | "all";
}

export const brandService = {
  async getBrands(filters?: BrandFilters): Promise<Brand[]> {
    const supabase = await createClient();

    let query = supabase
      .from("brands")
      .select("*")
      .order("name", { ascending: true });

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.search) {
      query = query.ilike("name", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Brand[];
  },

  async getBrandById(id: string): Promise<Brand | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data as Brand;
  },

  async createBrand(
    values: BrandFormValues,
    logo?: { url: string; path: string } | null
  ): Promise<Brand> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        logo_url: logo?.url ?? values.logo_url ?? null,
        logo_path: logo?.path ?? values.logo_path ?? null,
        status: values.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Brand;
  },

  async updateBrand(
    id: string,
    values: BrandFormValues,
    logo?: { url: string; path: string } | null,
    removeLogo?: boolean
  ): Promise<Brand> {
    const supabase = await createClient();

    const updatePayload: Record<string, unknown> = {
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      status: values.status,
    };

    if (logo) {
      updatePayload.logo_url = logo.url;
      updatePayload.logo_path = logo.path;
    } else if (removeLogo) {
      updatePayload.logo_url = null;
      updatePayload.logo_path = null;
    }

    const { data, error } = await supabase
      .from("brands")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Brand;
  },

  async deleteBrand(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async toggleStatus(id: string, status: "active" | "inactive"): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("brands")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

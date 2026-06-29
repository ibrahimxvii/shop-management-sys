import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/products";
import type { CategoryFormValues } from "@/lib/validations/product";
import type { Database } from "@/types/database";

export interface CategoryFilters {
  search?: string;
  status?: "active" | "inactive" | "all";
}

export const categoryService = {
  async getCategories(filters?: CategoryFilters): Promise<Category[]> {
    const supabase = await createClient();

    let query = supabase
      .from("categories")
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
    return (data ?? []) as Category[];
  },

  async getCategoryById(id: string): Promise<Category | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data as Category;
  },

  async createCategory(
    values: CategoryFormValues,
    image?: { url: string; path: string } | null
  ): Promise<Category> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        image_url: image?.url ?? values.image_url ?? null,
        image_path: image?.path ?? values.image_path ?? null,
        status: values.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Category;
  },

  async updateCategory(
    id: string,
    values: CategoryFormValues,
    image?: { url: string; path: string } | null,
    removeImage?: boolean
  ): Promise<Category> {
    const supabase = await createClient();

    const updatePayload: Database["public"]["Tables"]["categories"]["Update"] = {
      name: values.name,
      slug: values.slug,
      description: values.description || null,
      status: values.status,
    };

    if (image) {
      updatePayload.image_url = image.url;
      updatePayload.image_path = image.path;
    } else if (removeImage) {
      updatePayload.image_url = null;
      updatePayload.image_path = null;
    }

    const { data, error } = await supabase
      .from("categories")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Category;
  },

  async deleteCategory(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async toggleStatus(id: string, status: "active" | "inactive"): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("categories")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
};

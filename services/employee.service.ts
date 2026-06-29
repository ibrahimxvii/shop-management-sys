import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeFilters } from "@/types/employees";
import type { EmployeeFormValues } from "@/lib/validations/employee";

export const employeeService = {
  async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    const supabase = await createClient();

    let query = supabase
      .from("employees")
      .select("*")
      .order("full_name", { ascending: true });

    if (filters?.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }
    if (filters?.role && filters.role !== "all") {
      query = query.eq("role", filters.role);
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []) as Employee[];
  },

  async getEmployeeById(id: string): Promise<Employee | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }
    return data as Employee;
  },

  async createEmployee(values: EmployeeFormValues): Promise<Employee> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .insert({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        role: values.role,
        status: values.status,
        avatar_url: values.avatar_url || null,
        avatar_path: values.avatar_path || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Employee;
  },

  async updateEmployee(id: string, values: EmployeeFormValues): Promise<Employee> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .update({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        role: values.role,
        status: values.status,
        avatar_url: values.avatar_url || null,
        avatar_path: values.avatar_path || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Employee;
  },

  async deleteEmployee(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getActiveCount(): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");
    if (error) return 0;
    return count ?? 0;
  },
};

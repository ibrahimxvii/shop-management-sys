import { createClient, createAdminClient } from "@/lib/supabase/server";
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

  /**
   * Creating an employee also provisions a real Supabase Auth login
   * account (email + password) and sets its profile role — without
   * this, the "role" picked here would have no effect on what the
   * person can actually access after logging in.
   */
  async createEmployee(values: EmployeeFormValues & { password: string }): Promise<Employee> {
    const admin = await createAdminClient();

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: values.email,
      password: values.password,
      email_confirm: true,
      user_metadata: { full_name: values.full_name },
    });
    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: values.role, is_active: values.status === "active" })
      .eq("id", userId);
    if (profileError) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(profileError.message);
    }

    const { data, error } = await admin
      .from("employees")
      .insert({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        role: values.role,
        status: values.status,
        avatar_url: values.avatar_url || null,
        avatar_path: values.avatar_path || null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(error.message);
    }
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

    // Keep the linked login account's role/active-state in sync — RBAC
    // reads from `profiles.role`, not `employees.role`.
    if (data.user_id) {
      const admin = await createAdminClient();
      await admin
        .from("profiles")
        .update({
          role: values.role,
          full_name: values.full_name,
          is_active: values.status === "active",
        })
        .eq("id", data.user_id);
    }

    return data as Employee;
  },

  async deleteEmployee(id: string): Promise<void> {
    const supabase = await createClient();
    const { data: employee } = await supabase
      .from("employees")
      .select("user_id")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw new Error(error.message);

    // Removing the employee also revokes their login access entirely.
    if (employee?.user_id) {
      const admin = await createAdminClient();
      await admin.auth.admin.deleteUser(employee.user_id);
    }
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

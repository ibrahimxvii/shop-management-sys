export type EmployeeRole = "admin" | "manager" | "staff";
export type EmployeeStatus = "active" | "inactive" | "on_leave";

export interface Employee {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFilters {
  search?: string;
  role?: EmployeeRole | "all";
  status?: EmployeeStatus | "all";
  limit?: number;
  offset?: number;
}

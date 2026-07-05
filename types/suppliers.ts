export type SupplierStatus = "active" | "inactive";

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  notes: string | null;
  status: SupplierStatus;
  created_at: string;
  updated_at: string;
}

export interface SupplierFilters {
  search?: string;
  status?: SupplierStatus | "all";
}

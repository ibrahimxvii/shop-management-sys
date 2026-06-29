import type { UserRole } from "@/types/auth";

export type Resource =
  | "dashboard"
  | "products"
  | "products.write"
  | "categories"
  | "brands"
  | "inventory"
  | "orders"
  | "customers"
  | "employees"
  | "reports"
  | "analytics"
  | "notifications"
  | "settings";

const ROLE_PERMISSIONS: Record<UserRole, Resource[]> = {
  admin: [
    "dashboard",
    "products", "products.write",
    "categories", "brands",
    "inventory",
    "orders",
    "customers",
    "employees",
    "reports",
    "analytics",
    "notifications",
    "settings",
  ],
  manager: [
    "dashboard",
    "products", "products.write",
    "categories", "brands",
    "inventory",
    "orders",
    "customers",
    "reports",
    "notifications",
  ],
  staff: [
    "dashboard",
    "products",
    "orders",
    "customers",
    "notifications",
  ],
};

export function canAccess(role: UserRole | null | undefined, resource: Resource): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(resource) ?? false;
}

export const NAV_PERMISSION_MAP: Record<string, Resource> = {
  "/dashboard":  "dashboard",
  "/products":   "products",
  "/categories": "categories",
  "/brands":     "brands",
  "/inventory":  "inventory",
  "/orders":     "orders",
  "/customers":  "customers",
  "/employees":  "employees",
  "/reports":        "reports",
  "/analytics":      "analytics",
  "/notifications":  "notifications",
  "/settings":       "settings",
};

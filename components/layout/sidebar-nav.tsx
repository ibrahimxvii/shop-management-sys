"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Tags,
  Building2,
  ShoppingCart,
  Users,
  UserCog,
  BarChart3,
  TrendingUp,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAccess, type Resource } from "@/lib/rbac";
import type { UserRole } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  resource: Resource;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard, resource: "dashboard" },
  { label: "Products",   href: "/products",   icon: Package,         resource: "products" },
  { label: "Categories", href: "/categories", icon: Tags,            resource: "categories" },
  { label: "Brands",     href: "/brands",     icon: Building2,       resource: "brands" },
  { label: "Inventory",  href: "/inventory",  icon: Warehouse,       resource: "inventory" },
  { label: "Orders",     href: "/orders",     icon: ShoppingCart,    resource: "orders" },
  { label: "Customers",  href: "/customers",  icon: Users,           resource: "customers" },
  { label: "Employees",  href: "/employees",  icon: UserCog,         resource: "employees" },
  { label: "Reports",        href: "/reports",        icon: BarChart3,   resource: "reports" },
  { label: "Analytics",      href: "/analytics",      icon: TrendingUp,  resource: "analytics" },
  { label: "Notifications",  href: "/notifications",  icon: Bell,        resource: "notifications" },
  { label: "Settings",       href: "/settings",       icon: Settings,    resource: "settings" },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  role?: UserRole | null;
}

export function SidebarNav({ collapsed = false, onNavigate, role }: SidebarNavProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => canAccess(role, item.resource));

  return (
    <nav aria-label="Main navigation">
      <ul className="space-y-0.5" role="list">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-primary",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 flex-shrink-0 transition-transform duration-150",
                    !isActive && "group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {!collapsed && item.badge != null && item.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary-foreground/20 px-1.5 text-[10px] font-semibold">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

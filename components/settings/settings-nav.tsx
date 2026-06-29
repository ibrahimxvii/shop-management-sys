"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  Monitor,
  Shield,
  Activity,
  Database,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  adminOnly?: boolean;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    href: "/settings/shop",
    label: "Shop",
    icon: Store,
    description: "Store configuration",
    adminOnly: true,
  },
  {
    href: "/settings/system",
    label: "System",
    icon: Monitor,
    description: "Appearance & preferences",
  },
  {
    href: "/settings/security",
    label: "Security",
    icon: Shield,
    description: "Password, sessions & 2FA",
  },
  {
    href: "/settings/activity",
    label: "Activity",
    icon: Activity,
    description: "Audit logs",
    adminOnly: true,
  },
  {
    href: "/settings/backup",
    label: "Backup",
    icon: Database,
    description: "Backup & restore",
    adminOnly: true,
  },
];

interface SettingsNavProps {
  role?: string | null;
}

export function SettingsNav({ role }: SettingsNavProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const isAdminOrManager = role === "admin" || role === "manager";

  const visibleItems = SETTINGS_NAV.filter(
    (item) => !item.adminOnly || isAdmin || (item.href === "/settings/activity" && isAdminOrManager)
  );

  return (
    <nav aria-label="Settings navigation">
      {/* Desktop vertical list */}
      <ul className="hidden md:flex flex-col gap-0.5" role="list">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile horizontal scroll */}
      <div
        className="flex md:hidden gap-1 overflow-x-auto pb-1 -mx-1 px-1"
        role="list"
      >
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              role="listitem"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-all flex-shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

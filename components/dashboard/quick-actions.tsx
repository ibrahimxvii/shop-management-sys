import Link from "next/link";
import {
  PackagePlus,
  Tag,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const actions: QuickAction[] = [
  {
    label: "Add Product",
    description: "Add a new product to your catalog",
    href: "/products/new",
    icon: PackagePlus,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    label: "Manage Categories",
    description: "Organize your product categories",
    href: "/products",
    icon: Tag,
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  {
    label: "View Reports",
    description: "Analyze your business performance",
    href: "/reports",
    icon: BarChart3,
    iconBg: "bg-warning/15",
    iconColor: "text-warning-foreground",
  },
  {
    label: "Settings",
    description: "Configure your store settings",
    href: "/settings",
    icon: Settings,
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul role="list" className="divide-y">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <li key={action.href}>
                <Link
                  href={action.href}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors group"
                >
                  <div
                    className={`flex-shrink-0 rounded-lg p-2 ${action.iconBg}`}
                    aria-hidden="true"
                  >
                    <Icon className={`h-4 w-4 ${action.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

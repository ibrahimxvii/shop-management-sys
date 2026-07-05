"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  Scan,
  PackagePlus,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { useCommandPaletteStore } from "@/store/command-palette.store";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { useDebounce } from "@/hooks/use-debounce";
import { NAV_ITEMS } from "@/components/layout/sidebar-nav";
import { canAccess } from "@/lib/rbac";
import type { UserRole } from "@/types/auth";

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  onSelect: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { isOpen, close, toggle } = useCommandPaletteStore();
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 250);
  const { data: results, isFetching } = useGlobalSearch(debouncedQuery);

  const role = (profile?.role ?? null) as UserRole | null;

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  const go = React.useCallback(
    (href: string) => {
      router.push(href);
      close();
    },
    [router, close]
  );

  const items: PaletteItem[] = React.useMemo(() => {
    if (debouncedQuery.trim().length >= 2) {
      const list: PaletteItem[] = [];
      results?.products.forEach((p) =>
        list.push({
          id: `product-${p.id}`,
          label: p.name,
          description: `${p.sku ? `SKU: ${p.sku} · ` : ""}${formatCurrency(p.selling_price)}`,
          icon: Package,
          group: "Products",
          onSelect: () => go(`/products/${p.id}`),
        })
      );
      results?.orders.forEach((o) =>
        list.push({
          id: `order-${o.id}`,
          label: o.order_number,
          description: `${o.customer_name ?? "Walk-in"} · ${formatCurrency(o.grand_total)}`,
          icon: ShoppingCart,
          group: "Orders",
          onSelect: () => go(`/orders/${o.id}`),
        })
      );
      results?.customers.forEach((c) =>
        list.push({
          id: `customer-${c.id}`,
          label: c.full_name,
          description: c.email ?? undefined,
          icon: Users,
          group: "Customers",
          onSelect: () => go(`/customers/${c.id}`),
        })
      );
      return list;
    }

    const quickActions: PaletteItem[] = [];
    if (canAccess(role, "products.write")) {
      quickActions.push({
        id: "action-new-product",
        label: "New Product",
        icon: PackagePlus,
        group: "Quick Actions",
        onSelect: () => go("/products/new"),
      });
    }
    if (canAccess(role, "orders")) {
      quickActions.push(
        {
          id: "action-new-order",
          label: "New Order",
          icon: ShoppingCart,
          group: "Quick Actions",
          onSelect: () => go("/orders/new"),
        },
        {
          id: "action-pos",
          label: "Open POS",
          icon: Scan,
          group: "Quick Actions",
          onSelect: () => go("/pos"),
        }
      );
    }

    const navItems: PaletteItem[] = NAV_ITEMS.filter((item) =>
      canAccess(role, item.resource)
    ).map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      icon: item.icon,
      group: "Go to",
      onSelect: () => go(item.href),
    }));

    return [...quickActions, ...navItems];
  }, [debouncedQuery, results, role, go]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[activeIndex]?.onSelect();
    }
  };

  const groups = React.useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    items.forEach((item) => {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  const isSearching = debouncedQuery.trim().length >= 2;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[12%] z-50 w-full max-w-xl -translate-x-1/2",
            "rounded-xl border bg-popover shadow-2xl overflow-hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          onKeyDown={handleKeyDown}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search products, orders, customers, or jump to any page
          </DialogPrimitive.Description>

          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, orders, customers, or jump to a page…"
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {isSearching && !isFetching && items.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No results for &quot;{debouncedQuery}&quot;
              </p>
            ) : (
              groups.map(([group, groupItems]) => (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group}
                  </p>
                  {groupItems.map((item) => {
                    const globalIndex = items.indexOf(item);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        onClick={() => item.onSelect()}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                          globalIndex === activeIndex
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/60"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                        {item.description && (
                          <span className="shrink-0 truncate text-xs text-muted-foreground max-w-[40%]">
                            {item.description}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 border-t px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Select
            </span>
            <span className="ml-auto flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono">Esc</kbd>
              Close
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

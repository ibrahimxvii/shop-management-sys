"use client";

import * as React from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { cn } from "@/lib/utils";
import type { ActivityAction, ActivityResource } from "@/types/settings";

const ACTION_STYLES: Record<string, string> = {
  login:           "bg-blue-500/10 text-blue-600 border-blue-500/20",
  logout:          "bg-slate-500/10 text-slate-600 border-slate-500/20",
  logout_all:      "bg-orange-500/10 text-orange-700 border-orange-500/20",
  create:          "bg-green-500/10 text-green-600 border-green-500/20",
  update:          "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  delete:          "bg-red-500/10 text-red-600 border-red-500/20",
  view:            "bg-slate-500/10 text-slate-500 border-slate-500/20",
  export:          "bg-purple-500/10 text-purple-600 border-purple-500/20",
  import:          "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  settings_change: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  stock_in:        "bg-green-500/10 text-green-600 border-green-500/20",
  stock_out:       "bg-red-500/10 text-red-600 border-red-500/20",
  stock_adjust:    "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  password_change: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const ACTION_LABELS: Record<string, string> = {
  login: "Login", logout: "Logout", logout_all: "Logout All",
  create: "Create", update: "Update", delete: "Delete", view: "View",
  export: "Export", import: "Import", settings_change: "Settings",
  stock_in: "Stock In", stock_out: "Stock Out", stock_adjust: "Adjustment",
  password_change: "Password",
};

const FILTER_ACTIONS: { value: ActivityAction | ""; label: string }[] = [
  { value: "", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "create", label: "Create" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "settings_change", label: "Settings" },
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
  { value: "password_change", label: "Password Change" },
];

const FILTER_RESOURCES: { value: ActivityResource | ""; label: string }[] = [
  { value: "", label: "All Resources" },
  { value: "auth", label: "Auth" },
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "brand", label: "Brand" },
  { value: "inventory", label: "Inventory" },
  { value: "order", label: "Order" },
  { value: "customer", label: "Customer" },
  { value: "employee", label: "Employee" },
  { value: "settings", label: "Settings" },
];

const SELECT_CLASS =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const LIMIT = 25;

export function ActivityLogTable() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [action, setAction] = React.useState<ActivityAction | "">("");
  const [resource, setResource] = React.useState<ActivityResource | "">("");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(id);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, action, resource]);

  const { data, isLoading, isFetching } = useActivityLogs({
    search: debouncedSearch || undefined,
    action: action || undefined,
    resource: resource || undefined,
    page,
    limit: LIMIT,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search description or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as ActivityAction | "")}
            className={SELECT_CLASS}
            aria-label="Filter by action"
          >
            {FILTER_ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <select
            value={resource}
            onChange={(e) =>
              setResource(e.target.value as ActivityResource | "")
            }
            className={SELECT_CLASS}
            aria-label="Filter by resource"
          >
            {FILTER_RESOURCES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        className={cn(
          "rounded-xl border bg-card shadow-card overflow-hidden transition-opacity",
          isFetching && !isLoading && "opacity-75"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                  User
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                  Action
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                  Resource
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/40">
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-44" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-28" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {search || action || resource
                      ? "No logs match your filters"
                      : "No activity logs recorded yet"}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {log.user_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          ACTION_STYLES[log.action] ??
                            "bg-muted text-foreground border-border"
                        )}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground whitespace-nowrap">
                      {log.resource}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)}{" "}
              of {total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[5rem] text-center">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

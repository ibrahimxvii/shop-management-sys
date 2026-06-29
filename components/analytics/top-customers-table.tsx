import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import type { TopCustomer } from "@/types/analytics";

interface Props {
  customers: TopCustomer[];
}

export function TopCustomersTable({ customers }: Props) {
  if (customers.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No customer data yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {customers.map((c, i) => (
        <div key={c.customer_id} className="flex items-center gap-3">
          <span className="w-5 text-right text-xs font-medium text-muted-foreground">
            {i + 1}
          </span>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(c.customer_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{c.customer_name}</p>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                {formatCurrency(c.total_spending)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{c.total_orders} orders</span>
              {c.last_order_date && (
                <>
                  <span>·</span>
                  <span>Last {formatDate(c.last_order_date)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

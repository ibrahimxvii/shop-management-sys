import { formatCurrency } from "@/lib/utils";
import type { SalesHeatmapCell } from "@/types/insights";

interface Props {
  data: SalesHeatmapCell[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function SalesHeatmap({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No order data yet.</p>
    );
  }

  const grid = new Map<string, SalesHeatmapCell>();
  for (const cell of data) grid.set(`${cell.day_of_week}-${cell.hour_of_day}`, cell);
  const maxCount = Math.max(...data.map((c) => c.order_count), 1);

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `32px repeat(24, 20px)` }}>
        <div />
        {HOURS.map((h) => (
          <div key={h} className="text-center text-[9px] text-muted-foreground">
            {h % 3 === 0 ? h : ""}
          </div>
        ))}

        {DAY_LABELS.map((label, dow) => (
          <div key={dow} className="contents">
            <div className="flex items-center text-[10px] text-muted-foreground">{label}</div>
            {HOURS.map((hour) => {
              const cell = grid.get(`${dow}-${hour}`);
              const intensity = cell ? cell.order_count / maxCount : 0;
              return (
                <div
                  key={hour}
                  title={
                    cell
                      ? `${label} ${hour}:00 — ${cell.order_count} orders, ${formatCurrency(cell.revenue)}`
                      : `${label} ${hour}:00 — no orders`
                  }
                  className="h-5 w-5 rounded-sm"
                  style={{
                    backgroundColor: `hsl(221, 83%, 53%)`,
                    opacity: intensity === 0 ? 0.06 : 0.15 + intensity * 0.85,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Darker cells indicate more orders for that day/hour combination (last 90 days).
      </p>
    </div>
  );
}

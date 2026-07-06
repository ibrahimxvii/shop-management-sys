import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SalesHeatmap } from "@/components/analytics/sales-heatmap";
import { StockAgingTable } from "@/components/analytics/stock-aging-table";
import { DateRangeSalesChart } from "@/components/analytics/date-range-sales-chart";
import { formatCurrency } from "@/lib/utils";
import type { InsightsData } from "@/types/insights";

interface Props {
  insights: InsightsData;
}

const CONFIDENCE_BADGE: Record<InsightsData["forecast"]["confidence"], { label: string; variant: "success" | "warning" | "destructive" }> = {
  high: { label: "High confidence", variant: "success" },
  medium: { label: "Medium confidence", variant: "warning" },
  low: { label: "Low confidence", variant: "destructive" },
};

function ScoreBar({ label, score, weight }: { label: string; score: number; weight: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {Math.round(score)} / 100 · weight {Math.round(weight * 100)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function InsightsTab({ insights }: Props) {
  const {
    executiveSummary,
    businessHealth,
    forecast,
    reorderSuggestions,
    deadStock,
    coPurchaseAnchor,
    coPurchaseSuggestions,
    productGrowth,
    categoryGrowth,
    topBrands,
    profitEstimation,
    revenueLeaks,
    stockAging,
    salesHeatmap,
  } = insights;

  const confidence = CONFIDENCE_BADGE[forecast.confidence];

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {executiveSummary.map((line, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {revenueLeaks.length > 0 && (
            <div className="mt-4 space-y-2 border-t pt-4">
              {revenueLeaks.map((flag, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Badge variant={flag.severity === "critical" ? "destructive" : "warning"}>
                    {flag.severity === "critical" ? "Critical" : "Warning"}
                  </Badge>
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Business Health Score */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Business Health Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tabular-nums">{businessHealth.totalScore}</span>
              <span className="text-muted-foreground text-sm">/ 100</span>
            </div>
            <div className="space-y-3">
              {businessHealth.components.map((c) => (
                <ScoreBar key={c.label} label={c.label} score={c.score} weight={c.weight} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Forecast */}
        <Card variant="elevated" padding="default">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>7-Day Revenue Forecast</CardTitle>
            <Badge variant={confidence.variant}>{confidence.label}</Badge>
          </CardHeader>
          <CardContent>
            {forecast.points.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Not enough historical data yet.
              </p>
            ) : (
              <div className="space-y-2">
                {forecast.points.map((p) => (
                  <div key={p.date} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{p.date}</span>
                    <span className="tabular-nums">
                      {formatCurrency(p.lowerBound)} – {formatCurrency(p.upperBound)}
                      <span className="ml-2 font-medium">({formatCurrency(p.predicted)})</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Reorder Suggestions */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Reorder Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            {reorderSuggestions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No products need reordering right now.
              </p>
            ) : (
              <div className="space-y-3">
                {reorderSuggestions.map((p) => (
                  <div key={p.product_id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.current_quantity} in stock · {p.avg_daily_velocity}/day
                      </p>
                    </div>
                    <Badge variant={(p.days_until_stockout ?? 0) <= 3 ? "destructive" : "warning"}>
                      {p.days_until_stockout}d left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dead Stock */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Slow-Moving / Dead Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {deadStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No dead stock detected.
              </p>
            ) : (
              <div className="space-y-3">
                {deadStock.slice(0, 8).map((p) => (
                  <div key={p.product_id} className="flex items-center justify-between text-sm">
                    <p className="truncate font-medium">{p.product_name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {p.days_since_last_sale}d since last sale
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Fastest Growing Products */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Fastest Growing Products</CardTitle>
          </CardHeader>
          <CardContent>
            {productGrowth.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {productGrowth.slice(0, 8).map((p) => (
                  <div key={p.product_id} className="flex items-center justify-between text-sm">
                    <p className="truncate font-medium">{p.product_name}</p>
                    <span
                      className={`shrink-0 tabular-nums ${
                        p.growth_percent === null
                          ? "text-muted-foreground"
                          : p.growth_percent >= 0
                            ? "text-success"
                            : "text-destructive"
                      }`}
                    >
                      {p.growth_percent === null ? "New" : `${p.growth_percent >= 0 ? "+" : ""}${p.growth_percent}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Performance */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryGrowth.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {categoryGrowth.slice(0, 8).map((c) => (
                  <div key={c.category_id} className="flex items-center justify-between text-sm">
                    <p className="truncate font-medium">{c.category_name}</p>
                    <span
                      className={`shrink-0 tabular-nums ${
                        c.growth_percent === null
                          ? "text-muted-foreground"
                          : c.growth_percent >= 0
                            ? "text-success"
                            : "text-destructive"
                      }`}
                    >
                      {c.growth_percent === null ? "New" : `${c.growth_percent >= 0 ? "+" : ""}${c.growth_percent}%`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profit Estimation */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Profit Estimation (30d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Estimated — uses current cost price, not cost at time of sale.
            </p>
            <div className="flex justify-between text-sm">
              <span>Revenue</span>
              <span className="tabular-nums font-medium">{formatCurrency(profitEstimation.total_revenue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Est. Cost</span>
              <span className="tabular-nums font-medium">{formatCurrency(profitEstimation.total_cost_estimate)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Est. Profit</span>
              <span className="tabular-nums font-semibold">{formatCurrency(profitEstimation.estimated_profit)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Est. Margin</span>
              <span className="tabular-nums">{profitEstimation.estimated_margin_percent}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Top Brands */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Best Brands</CardTitle>
          </CardHeader>
          <CardContent>
            {topBrands.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {topBrands.map((b) => (
                  <div key={b.brand_id} className="flex items-center justify-between text-sm">
                    <p className="truncate font-medium">{b.brand_name}</p>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatCurrency(b.total_revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Co-purchase */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Frequently Bought Together</CardTitle>
          </CardHeader>
          <CardContent>
            {!coPurchaseAnchor || coPurchaseSuggestions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Not enough order history yet.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Customers who bought <span className="font-medium">{coPurchaseAnchor.productName}</span> also bought:
                </p>
                {coPurchaseSuggestions.map((s) => (
                  <div key={s.product_id} className="flex items-center justify-between text-sm">
                    <p className="truncate">{s.product_name}</p>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {s.co_purchase_count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend (date-range selectable) */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeSalesChart />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales Heatmap */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Sales Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesHeatmap data={salesHeatmap} />
          </CardContent>
        </Card>

        {/* Stock Aging */}
        <Card variant="elevated" padding="default">
          <CardHeader>
            <CardTitle>Stock Aging</CardTitle>
          </CardHeader>
          <CardContent>
            <StockAgingTable data={stockAging} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

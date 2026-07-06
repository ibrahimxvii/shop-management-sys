// RPC row shapes (migration 017)

export interface ProductVelocity {
  product_id: string;
  product_name: string;
  sku: string | null;
  category_name: string | null;
  current_quantity: number;
  low_stock_limit: number;
  units_sold: number;
  avg_daily_velocity: number;
  days_until_stockout: number | null;
}

export interface StockAgingRow {
  product_id: string;
  product_name: string;
  sku: string | null;
  quantity: number;
  last_sold_at: string | null;
  days_since_last_sale: number;
}

export interface ProductGrowthRow {
  product_id: string;
  product_name: string;
  sku: string | null;
  current_revenue: number;
  previous_revenue: number;
  current_qty: number;
  previous_qty: number;
  growth_percent: number | null;
}

export interface CategoryGrowthRow {
  category_id: string;
  category_name: string;
  current_revenue: number;
  previous_revenue: number;
  growth_percent: number | null;
}

export interface TopBrand {
  brand_id: string;
  brand_name: string;
  total_revenue: number;
  product_count: number;
  order_count: number;
}

export interface ProfitEstimation {
  total_revenue: number;
  total_cost_estimate: number;
  estimated_profit: number;
  estimated_margin_percent: number;
}

export interface ProfitEstimationByCategory {
  category_id: string;
  category_name: string;
  revenue: number;
  cost_estimate: number;
  profit_estimate: number;
  margin_percent: number;
}

export interface FrequentlyBoughtTogetherRow {
  product_id: string;
  product_name: string;
  sku: string | null;
  selling_price: number;
  co_purchase_count: number;
}

export interface SalesHeatmapCell {
  day_of_week: number;
  hour_of_day: number;
  order_count: number;
  revenue: number;
}

// Computed (lib/forecasting.ts, lib/business-health.ts, lib/revenue-leak.ts)

export type ForecastConfidence = "low" | "medium" | "high";

export interface ForecastPoint {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResult {
  points: ForecastPoint[];
  confidence: ForecastConfidence;
  trendSlope: number;
}

export interface BusinessHealthComponent {
  label: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface BusinessHealthResult {
  totalScore: number;
  components: BusinessHealthComponent[];
}

export type RevenueLeakType = "cancellation_rate_up" | "refund_rate_up" | "aov_declining";
export type RevenueLeakSeverity = "warning" | "critical";

export interface RevenueLeakFlag {
  type: RevenueLeakType;
  message: string;
  severity: RevenueLeakSeverity;
}

// Top-level aggregate returned by insightsService.getInsights()

export interface InsightsData {
  executiveSummary: string[];
  businessHealth: BusinessHealthResult;
  forecast: ForecastResult;
  reorderSuggestions: ProductVelocity[];
  deadStock: StockAgingRow[];
  stockAging: StockAgingRow[];
  coPurchaseAnchor: { productId: string; productName: string } | null;
  coPurchaseSuggestions: FrequentlyBoughtTogetherRow[];
  productGrowth: ProductGrowthRow[];
  categoryGrowth: CategoryGrowthRow[];
  topBrands: TopBrand[];
  profitEstimation: ProfitEstimation;
  profitByCategory: ProfitEstimationByCategory[];
  revenueLeaks: RevenueLeakFlag[];
  salesHeatmap: SalesHeatmapCell[];
}

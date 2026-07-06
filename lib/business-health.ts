import type { BusinessHealthResult } from "@/types/insights";

export interface BusinessHealthInputs {
  currentPeriodRevenue: number;
  previousPeriodRevenue: number;
  outOfStockCount: number;
  lowStockCount: number;
  totalActiveProducts: number;
  deliveredOrders: number;
  totalOrders: number;
  cancelledOrders: number;
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/**
 * Composite 0-100 score, weighted per the design spec: revenue trend 35%,
 * stock health 25%, fulfillment rate 25%, cancellation rate 15%. Every
 * sub-score and its weighted contribution is returned (not just the
 * total) so the UI can render a fully explainable breakdown.
 */
export function computeBusinessHealthScore(inputs: BusinessHealthInputs): BusinessHealthResult {
  const {
    currentPeriodRevenue,
    previousPeriodRevenue,
    outOfStockCount,
    lowStockCount,
    totalActiveProducts,
    deliveredOrders,
    totalOrders,
    cancelledOrders,
  } = inputs;

  // 0% growth -> 50; +/-20% growth clamps the 0-100 range.
  const growthPercent =
    previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0;
  const revenueTrendScore = clampScore(50 + (growthPercent / 20) * 50);

  const stockHealthScore =
    totalActiveProducts > 0
      ? clampScore((1 - (outOfStockCount + lowStockCount) / totalActiveProducts) * 100)
      : 100;

  const fulfillableOrders = totalOrders - cancelledOrders;
  const fulfillmentScore =
    fulfillableOrders > 0 ? clampScore((deliveredOrders / fulfillableOrders) * 100) : 100;

  const cancellationScore =
    totalOrders > 0 ? clampScore((1 - cancelledOrders / totalOrders) * 100) : 100;

  const components = [
    { label: "Revenue Trend", score: revenueTrendScore, weight: 0.35 },
    { label: "Stock Health", score: stockHealthScore, weight: 0.25 },
    { label: "Fulfillment Rate", score: fulfillmentScore, weight: 0.25 },
    { label: "Cancellation Rate", score: cancellationScore, weight: 0.15 },
  ].map((c) => ({ ...c, contribution: c.score * c.weight }));

  const totalScore = Math.round(components.reduce((sum, c) => sum + c.contribution, 0));

  return { totalScore, components };
}

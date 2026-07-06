import type { RevenueLeakFlag } from "@/types/insights";

export interface RevenueLeakInputs {
  recentCancelledOrders: number;
  recentRefundedOrders: number;
  recentTotalOrders: number;
  priorCancelledOrders: number;
  priorRefundedOrders: number;
  priorTotalOrders: number;
  recentAvgOrderValue: number;
  priorAvgOrderValue: number;
}

const RATE_INCREASE_THRESHOLD = 1.25; // flag if recent rate is 25%+ higher than prior
const MIN_MEANINGFUL_RATE = 0.05; // ignore noise below 5%
const CRITICAL_RATE = 0.15;
const AOV_WARNING_DROP_PERCENT = -10;
const AOV_CRITICAL_DROP_PERCENT = -25;

/** Rule-based comparison of two periods' cancellation/refund/AOV figures — no ML involved. */
export function detectRevenueLeaks(inputs: RevenueLeakInputs): RevenueLeakFlag[] {
  const flags: RevenueLeakFlag[] = [];

  const recentCancelRate =
    inputs.recentTotalOrders > 0 ? inputs.recentCancelledOrders / inputs.recentTotalOrders : 0;
  const priorCancelRate =
    inputs.priorTotalOrders > 0 ? inputs.priorCancelledOrders / inputs.priorTotalOrders : 0;

  if (
    priorCancelRate > 0 &&
    recentCancelRate > priorCancelRate * RATE_INCREASE_THRESHOLD &&
    recentCancelRate > MIN_MEANINGFUL_RATE
  ) {
    flags.push({
      type: "cancellation_rate_up",
      message: `Cancellation rate rose from ${(priorCancelRate * 100).toFixed(1)}% to ${(recentCancelRate * 100).toFixed(1)}%.`,
      severity: recentCancelRate > CRITICAL_RATE ? "critical" : "warning",
    });
  }

  const recentRefundRate =
    inputs.recentTotalOrders > 0 ? inputs.recentRefundedOrders / inputs.recentTotalOrders : 0;
  const priorRefundRate =
    inputs.priorTotalOrders > 0 ? inputs.priorRefundedOrders / inputs.priorTotalOrders : 0;

  if (
    priorRefundRate > 0 &&
    recentRefundRate > priorRefundRate * RATE_INCREASE_THRESHOLD &&
    recentRefundRate > MIN_MEANINGFUL_RATE
  ) {
    flags.push({
      type: "refund_rate_up",
      message: `Refund rate rose from ${(priorRefundRate * 100).toFixed(1)}% to ${(recentRefundRate * 100).toFixed(1)}%.`,
      severity: recentRefundRate > CRITICAL_RATE ? "critical" : "warning",
    });
  }

  if (inputs.priorAvgOrderValue > 0) {
    const aovChangePercent =
      ((inputs.recentAvgOrderValue - inputs.priorAvgOrderValue) / inputs.priorAvgOrderValue) * 100;
    if (aovChangePercent < AOV_WARNING_DROP_PERCENT) {
      flags.push({
        type: "aov_declining",
        message: `Average order value declined ${Math.abs(aovChangePercent).toFixed(1)}% period-over-period.`,
        severity: aovChangePercent < AOV_CRITICAL_DROP_PERCENT ? "critical" : "warning",
      });
    }
  }

  return flags;
}

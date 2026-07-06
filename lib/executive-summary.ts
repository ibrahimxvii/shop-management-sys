/**
 * Rule-based plain-English summary generated from already-computed
 * statistics — template strings filled with real numbers, not an LLM call.
 */
export interface ExecutiveSummaryInputs {
  revenueGrowthPercent: number | null;
  topGrowingCategory: { name: string; growthPercent: number } | null;
  reorderCount: number;
  deadStockCount: number;
  cancellationTrendUp: boolean;
  aovTrendPercent: number | null;
}

const AOV_NOTABLE_DROP_PERCENT = -5;

export function generateExecutiveSummary(inputs: ExecutiveSummaryInputs): string[] {
  const lines: string[] = [];

  if (inputs.revenueGrowthPercent !== null) {
    const direction = inputs.revenueGrowthPercent >= 0 ? "grew" : "declined";
    lines.push(
      `Revenue ${direction} ${Math.abs(inputs.revenueGrowthPercent).toFixed(1)}% compared to the previous period.`
    );
  }

  if (inputs.topGrowingCategory) {
    lines.push(
      `${inputs.topGrowingCategory.name} is the fastest-growing category, up ${inputs.topGrowingCategory.growthPercent.toFixed(1)}%.`
    );
  }

  if (inputs.reorderCount > 0) {
    lines.push(
      `${inputs.reorderCount} product${inputs.reorderCount === 1 ? "" : "s"} should be reordered soon based on current sales velocity.`
    );
  }

  if (inputs.deadStockCount > 0) {
    lines.push(
      `${inputs.deadStockCount} product${inputs.deadStockCount === 1 ? "" : "s"} have had no sales in over 60 days.`
    );
  }

  if (inputs.cancellationTrendUp) {
    lines.push("Cancellations are trending up — worth reviewing recent order flow.");
  }

  if (inputs.aovTrendPercent !== null && inputs.aovTrendPercent < AOV_NOTABLE_DROP_PERCENT) {
    lines.push(
      `Average order value is down ${Math.abs(inputs.aovTrendPercent).toFixed(1)}% — consider bundling or upsell prompts.`
    );
  }

  if (lines.length === 0) {
    lines.push("Business metrics are stable with no significant changes to report.");
  }

  return lines;
}

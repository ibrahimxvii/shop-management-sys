import type { ForecastConfidence, ForecastPoint, ForecastResult } from "@/types/insights";

export interface DailyDataPoint {
  date: string;
  value: number;
}

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  residualStdDev: number;
}

/**
 * Ordinary least squares over the series index (0..n-1) as x. Returns the
 * residual standard deviation alongside slope/intercept so callers can
 * derive a confidence band without re-walking the series.
 */
export function linearRegression(series: DailyDataPoint[]): LinearRegressionResult {
  const n = series.length;
  if (n === 0) return { slope: 0, intercept: 0, residualStdDev: 0 };

  const xs = series.map((_, i) => i);
  const ys = series.map((p) => p.value);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - xMean) * (ys[i] - yMean);
    denominator += (xs[i] - xMean) ** 2;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const residualStdDev = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) / Math.max(1, n - 2)
  );

  return { slope, intercept, residualStdDev };
}

/** Recency-weighted average of the trailing `windowSize` points (more recent = higher weight). */
export function weightedMovingAverage(series: DailyDataPoint[], windowSize = 7): number {
  if (series.length === 0) return 0;
  const window = series.slice(-windowSize);
  const weights = window.map((_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const weighted = window.reduce((acc, point, i) => acc + point.value * weights[i], 0);
  return weightSum === 0 ? 0 : weighted / weightSum;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Confidence thresholds (per design spec): High needs >=60 days of history
 * AND residual std-dev <=15% of mean daily value. Low is <30 days OR
 * residual std-dev >40% of mean. Everything else is Medium.
 */
function classifyConfidence(pointCount: number, residualStdDev: number, meanValue: number): ForecastConfidence {
  const relativeResidual = meanValue === 0 ? 1 : residualStdDev / meanValue;
  if (pointCount >= 60 && relativeResidual <= 0.15) return "high";
  if (pointCount < 30 || relativeResidual > 0.4) return "low";
  return "medium";
}

/**
 * Projects `daysAhead` days forward from a daily revenue/order-count series
 * using linear regression, with a 95%-ish confidence band (±1.96 residual
 * std-dev) rather than a single point estimate.
 */
export function forecastRevenue(series: DailyDataPoint[], daysAhead: number): ForecastResult {
  if (series.length === 0) {
    return { points: [], confidence: "low", trendSlope: 0 };
  }

  const { slope, intercept, residualStdDev } = linearRegression(series);
  const n = series.length;
  const meanValue = series.reduce((sum, p) => sum + p.value, 0) / n;
  const lastDate = new Date(series[series.length - 1].date);
  const margin = 1.96 * residualStdDev;

  const points: ForecastPoint[] = [];
  for (let i = 1; i <= daysAhead; i++) {
    const x = n - 1 + i;
    const predicted = Math.max(0, slope * x + intercept);
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);

    points.push({
      date: date.toISOString().slice(0, 10),
      predicted: round2(predicted),
      lowerBound: round2(Math.max(0, predicted - margin)),
      upperBound: round2(predicted + margin),
    });
  }

  return {
    points,
    confidence: classifyConfidence(n, residualStdDev, meanValue),
    trendSlope: slope,
  };
}

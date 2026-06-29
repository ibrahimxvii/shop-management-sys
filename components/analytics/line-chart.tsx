"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  format?: "currency" | "number";
  unit?: string;
  showArea?: boolean;
}

function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return points.length === 1 ? `M${points[0][0]},${points[0][1]}` : "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1][0] + points[i][0]) / 2;
    d += ` C${cpx},${points[i - 1][1]} ${cpx},${points[i][1]} ${points[i][0]},${points[i][1]}`;
  }
  return d;
}

export function LineChart({
  data,
  color = "hsl(var(--primary))",
  height = 200,
  format = "number",
  unit,
  showArea = true,
}: LineChartProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: DataPoint } | null>(null);

  const formatValue = (v: number) =>
    format === "currency" ? formatCurrency(v) : unit ? `${v} ${unit}` : String(v);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const padLeft = 48;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 32;
  const W = 600;
  const H = height;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => padLeft + (i / (data.length - 1 || 1)) * chartW;
  const toY = (v: number) => padTop + chartH - ((v - minVal) / range) * chartH;

  const points: [number, number][] = data.map((d, i) => [toX(i), toY(d.value)]);
  const linePath = smoothPath(points);
  const areaPath = `${linePath} L${points[points.length - 1][0]},${padTop + chartH} L${points[0][0]},${padTop + chartH} Z`;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = minVal + (range * i) / yTicks;
    return { v, y: toY(v) };
  });

  const xStep = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => i % xStep === 0 || i === data.length - 1);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {yLabels.map(({ v, y }, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={y}
              x2={W - padRight}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="1"
              strokeDasharray="4 3"
              className="text-foreground"
            />
            <text
              x={padLeft - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="currentColor"
              className="text-muted-foreground"
              fillOpacity="0.6"
            >
              {formatValue(Math.round(v))}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ d, i }) => (
          <text
            key={i}
            x={toX(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="currentColor"
            fillOpacity="0.55"
          >
            {d.label}
          </text>
        ))}

        {/* Area fill */}
        {showArea && (
          <path d={areaPath} fill="url(#area-fill)" />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive dots */}
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="14"
            fill="transparent"
            onMouseEnter={(e) => {
              const rect = (e.currentTarget.closest("svg") as SVGElement)
                ?.getBoundingClientRect();
              if (rect) {
                const svgX = ((x / W) * rect.width) + rect.left;
                const svgY = ((y / H) * rect.height) + rect.top;
                setTooltip({ x: svgX, y: svgY, point: data[i] });
              }
            }}
          />
        ))}

        {/* Visible dots on hover target area */}
        {tooltip &&
          points.map(([x, y], i) =>
            data[i].label === tooltip.point.label ? (
              <circle key={i} cx={x} cy={y} r="4" fill={color} stroke="white" strokeWidth="2" />
            ) : null
          )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border bg-popover px-3 py-2 text-sm shadow-md"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 40,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-medium">{tooltip.point.label}</p>
          <p className="text-muted-foreground">{formatValue(tooltip.point.value)}</p>
        </div>
      )}
    </div>
  );
}

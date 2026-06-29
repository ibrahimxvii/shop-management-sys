"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  format?: "currency" | "number";
  unit?: string;
}

export function BarChart({
  data,
  color = "hsl(var(--primary))",
  height = 200,
  format = "number",
  unit,
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
  const padRight = 8;
  const padTop = 16;
  const padBottom = 36;
  const W = 600;
  const H = height;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = Math.max(4, (chartW / data.length) * 0.6);
  const gap = chartW / data.length;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = (maxVal * i) / yTicks;
    const y = padTop + chartH - (v / maxVal) * chartH;
    return { v, y };
  });

  const xStep = Math.max(1, Math.floor(data.length / 8));

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        onMouseLeave={() => setHoveredIdx(null)}
      >
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
            />
            <text
              x={padLeft - 6}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="currentColor"
              fillOpacity="0.55"
            >
              {formatValue(Math.round(v))}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / maxVal) * chartH;
          const x = padLeft + i * gap + gap / 2 - barW / 2;
          const y = padTop + chartH - barH;
          const isHovered = hoveredIdx === i;
          const barColor = d.color ?? color;

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              style={{ cursor: "default" }}
            >
              {/* Hover area */}
              <rect
                x={padLeft + i * gap}
                y={padTop}
                width={gap}
                height={chartH}
                fill="transparent"
              />
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 2)}
                rx="3"
                fill={barColor}
                fillOpacity={isHovered ? 1 : 0.8}
              />
              {/* Value on hover */}
              {isHovered && barH > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill={barColor}
                  fontWeight="600"
                >
                  {formatValue(d.value)}
                </text>
              )}
              {/* X label */}
              {(i % xStep === 0 || i === data.length - 1) && (
                <text
                  x={x + barW / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="currentColor"
                  fillOpacity="0.55"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

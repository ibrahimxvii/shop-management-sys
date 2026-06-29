"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface DataPoint {
  date: string;
  count: number;
}

interface OverviewChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
}

export function OverviewChart({
  data,
  title = "Product Activity",
  description = "New products added in the last 30 days",
}: OverviewChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  // Show every 5th label to avoid crowding
  const labelIndices = new Set([0, 6, 13, 20, 27, data.length - 1]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-0.5">{description}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums">{total}</p>
            <p className="text-xs text-muted-foreground">total added</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-48 w-full" aria-hidden="true">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${data.length * 14} 100`}
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            {/* Grid lines */}
            {[25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={100 - y}
                x2={data.length * 14}
                y2={100 - y}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-border"
                strokeDasharray="4 2"
              />
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const barHeight = max > 0 ? (d.count / max) * 85 : 0;
              const x = i * 14 + 3;
              const y = 100 - barHeight;
              const isEmpty = d.count === 0;

              return (
                <g key={d.date}>
                  <rect
                    x={x}
                    y={isEmpty ? 98 : y}
                    width={8}
                    height={isEmpty ? 2 : barHeight}
                    rx="2"
                    className={isEmpty ? "fill-border" : "fill-primary"}
                    opacity={isEmpty ? 0.4 : 0.9}
                  />
                  <title>{`${d.date}: ${d.count} product${d.count !== 1 ? "s" : ""}`}</title>
                </g>
              );
            })}
          </svg>

          {/* X-axis labels */}
          <div
            className="flex mt-2 text-[10px] text-muted-foreground"
            style={{ width: "100%" }}
          >
            {data.map((d, i) => {
              if (!labelIndices.has(i)) return <span key={i} className="flex-1" />;
              const parts = d.date.split("-");
              const label = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
              return (
                <span key={i} className="flex-1 text-center">
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: Segment[];
  size?: number;
  thickness?: number;
  formatValue?: (v: number) => string;
  centerLabel?: string;
}

function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
  thickness: number
): string {
  const outerStart = polarToXY(cx, cy, r, startDeg);
  const outerEnd = polarToXY(cx, cy, r, endDeg);
  const innerStart = polarToXY(cx, cy, r - thickness, startDeg);
  const innerEnd = polarToXY(cx, cy, r - thickness, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${r} ${r} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${r - thickness} ${r - thickness} 0 ${large} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

export function DonutChart({
  data,
  size = 200,
  thickness = 40,
  formatValue = (v) => String(v),
  centerLabel,
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ width: size, height: size }}
      >
        No data
      </div>
    );
  }

  let currentDeg = 0;
  const segments = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const start = currentDeg;
    const end = currentDeg + sweep;
    currentDeg = end;
    return { ...d, start, end, i };
  });

  const hovered = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div style={{ width: size, height: size, position: "relative" }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {segments.map((seg) => (
            <path
              key={seg.i}
              d={arcPath(cx, cy, r, seg.start, seg.end - 0.5, thickness)}
              fill={seg.color}
              fillOpacity={hoveredIdx === null || hoveredIdx === seg.i ? 1 : 0.4}
              onMouseEnter={() => setHoveredIdx(seg.i)}
              style={{ cursor: "pointer", transition: "fill-opacity 0.15s" }}
            />
          ))}

          {/* Center text */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fontSize="18"
            fontWeight="700"
            fill="currentColor"
          >
            {hovered ? formatValue(hovered.value) : centerLabel ?? formatValue(total)}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fontSize="11"
            fill="currentColor"
            fillOpacity="0.55"
          >
            {hovered
              ? `${((hovered.value / total) * 100).toFixed(1)}%`
              : "total"}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 w-full">
        {segments.map((seg) => (
          <div
            key={seg.i}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHoveredIdx(seg.i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <span
              className="shrink-0 rounded-sm"
              style={{ width: 10, height: 10, backgroundColor: seg.color }}
            />
            <span
              className="flex-1 truncate text-xs text-muted-foreground"
              style={{ opacity: hoveredIdx === null || hoveredIdx === seg.i ? 1 : 0.4 }}
            >
              {seg.label}
            </span>
            <span className="text-xs font-medium tabular-nums">
              {formatValue(seg.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

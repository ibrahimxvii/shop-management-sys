"use client";

import * as React from "react";
import JsBarcode from "jsbarcode";
import { cn } from "@/lib/utils";
import { isValidEan13 } from "@/lib/barcode";

interface BarcodePreviewProps {
  value: string;
  className?: string;
}

export function BarcodePreview({ value, className }: BarcodePreviewProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [isValid, setIsValid] = React.useState(false);

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!value) {
      setIsValid(false);
      return;
    }
    try {
      JsBarcode(svg, value, {
        format: isValidEan13(value) ? "EAN13" : "CODE128",
        height: 50,
        width: 1.6,
        fontSize: 12,
        margin: 8,
        displayValue: true,
      });
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  }, [value]);

  return (
    <div className={cn(!isValid && "hidden", className)}>
      <svg ref={svgRef} />
    </div>
  );
}

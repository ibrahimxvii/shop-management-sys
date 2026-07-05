"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  label?: string;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  label = "Date Range",
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {label && (
        <span className="w-full text-xs font-medium text-muted-foreground -mb-1">
          {label}
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">From</Label>
        <Input
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="h-8 text-sm w-36"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">To</Label>
        <Input
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="h-8 text-sm w-36"
        />
      </div>
    </div>
  );
}

"use client";

import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  onExportCsv: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  disabled?: boolean;
}

export function ExportButtons({
  onExportCsv,
  onExportExcel,
  onPrint,
  disabled,
}: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onExportCsv}
        disabled={disabled}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportExcel}
        disabled={disabled}
      >
        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrint}
        disabled={disabled}
      >
        <Printer className="mr-1.5 h-3.5 w-3.5" />
        Print / PDF
      </Button>
    </div>
  );
}

export function downloadCsv(
  rows: Record<string, unknown>[],
  filename: string
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h];
          const str = val == null ? "" : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadExcel(
  rows: Record<string, unknown>[],
  filename: string
): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const tableRows = [
    `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`,
    ...rows.map(
      (r) =>
        `<tr>${headers
          .map((h) => `<td>${r[h] == null ? "" : String(r[h])}</td>`)
          .join("")}</tr>`
    ),
  ];
  const html = `<html><head><meta charset="utf-8"/></head><body><table>${tableRows.join("")}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

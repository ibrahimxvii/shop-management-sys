"use client";

import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export { downloadCsv, downloadExcel } from "@/lib/export";

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

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Neutralizes leading =, +, -, @ so spreadsheet apps don't interpret the cell as a formula (CSV/formula injection). */
function sanitizeForSpreadsheet(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function downloadCsv(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = r[h];
          const str = sanitizeForSpreadsheet(val == null ? "" : String(val));
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export function downloadExcel(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const tableRows = [
    `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`,
    ...rows.map(
      (r) =>
        `<tr>${headers
          .map((h) => `<td>${r[h] == null ? "" : escapeHtml(String(r[h]))}</td>`)
          .join("")}</tr>`
    ),
  ];
  const html = `<html><head><meta charset="utf-8"/></head><body><table>${tableRows.join("")}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  triggerDownload(blob, `${filename}.xls`);
}

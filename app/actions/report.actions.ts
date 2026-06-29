"use server";

import { reportService } from "@/services/report.service";
import { parseError } from "@/lib/errors";
import type { ReportPeriod } from "@/types/analytics";

export async function getSalesReportAction(
  from: string,
  to: string,
  period: ReportPeriod
) {
  try {
    const data = await reportService.getSalesReport(
      new Date(from),
      new Date(to),
      period
    );
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getInventoryReportAction() {
  try {
    const data = await reportService.getInventoryReport();
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getOrdersReportAction(from: string, to: string) {
  try {
    const data = await reportService.getOrdersReport(
      new Date(from),
      new Date(to)
    );
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

export async function getCustomersReportAction(from: string, to: string) {
  try {
    const data = await reportService.getCustomersReport(
      new Date(from),
      new Date(to)
    );
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: parseError(error) };
  }
}

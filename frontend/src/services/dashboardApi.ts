import { request } from "./api";
import type { DashboardSummaryDTO } from "../types/entities";

export function getTodaySummary(): Promise<DashboardSummaryDTO> {
  return request<DashboardSummaryDTO>("/dashboard/today");
}

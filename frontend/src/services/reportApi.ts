import { request } from "./api";
import type { ReportDTO, ReportType } from "../types/entities";

export function getReport(type: ReportType, date?: string): Promise<ReportDTO> {
  const params = new URLSearchParams({ type });
  if (date) params.set("date", date);
  return request<ReportDTO>(`/reports?${params.toString()}`);
}

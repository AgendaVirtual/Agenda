import { Router } from "express";
import { ReportService } from "../services/ReportService";
import { DashboardService } from "../services/DashboardService";
import { asyncHandler } from "../utils/errors";

const reportRouter = Router();
const dashboardRouter = Router();
const reportService = new ReportService();
const dashboardService = new DashboardService();

reportRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const type = (req.query.type as "weekly" | "monthly" | "yearly") ?? "weekly";
    const report = await reportService.generate(type);
    res.json({ success: true, data: report });
  })
);

dashboardRouter.get(
  "/today",
  asyncHandler(async (_req, res) => {
    const summary = await dashboardService.getToday();
    res.json({ success: true, data: summary });
  })
);

export { reportRouter, dashboardRouter };

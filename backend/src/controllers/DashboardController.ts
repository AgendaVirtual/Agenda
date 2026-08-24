import { Router } from "express";
import { DashboardService } from "../services/DashboardService";
import { asyncHandler } from "../utils/errors";

export function createDashboardRouter(
  dashboardService = new DashboardService()
): Router {
  const router = Router();

  router.get(
    "/today",
    asyncHandler(async (_req, res) => {
      const summary = await dashboardService.getToday();
      res.json({ success: true, data: summary });
    })
  );

  return router;
}

export default createDashboardRouter();

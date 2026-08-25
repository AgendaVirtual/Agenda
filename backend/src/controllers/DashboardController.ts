import { Router } from "express";
import { DashboardService } from "../services/DashboardService";
import { asyncHandler } from "../utils/errors";
import { parseOptionalDashboardDateQuery } from "../utils/validation";

export function createDashboardRouter(
  dashboardService = new DashboardService()
): Router {
  const router = Router();

  router.get(
    "/today",
    asyncHandler(async (req, res) => {
      const date = parseOptionalDashboardDateQuery(req.query.date);
      const summary = await dashboardService.getToday(date);
      res.json({ success: true, data: summary });
    })
  );

  return router;
}

export default createDashboardRouter();

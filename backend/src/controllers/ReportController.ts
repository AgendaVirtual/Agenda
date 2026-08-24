import { Router } from "express";
import { ReportService } from "../services/ReportService";
import { asyncHandler } from "../utils/errors";

export function createReportRouter(
  reportService = new ReportService()
): Router {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const type = req.query.type as string | undefined;
      const date = req.query.date as string | undefined;
      const report = await reportService.generate(type, date);

      res.json({ success: true, data: report });
    })
  );

  return router;
}

export default createReportRouter();

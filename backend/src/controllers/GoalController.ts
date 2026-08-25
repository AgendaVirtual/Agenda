import { Router } from "express";
import { GoalService } from "../services/GoalService";
import { asyncHandler } from "../utils/errors";
import {
  parseCreateGoalBody,
  parseGoalStatusBody,
  parseOptionalGoalPeriodQuery,
} from "../utils/validation";

const router = Router();
const goalService = new GoalService();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = parseCreateGoalBody(req.body);
    const goal = await goalService.create(data);
    res.status(201).json({ success: true, data: goal });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const period = parseOptionalGoalPeriodQuery(req.query.period);
    const goals = await goalService.list(period);
    res.json({ success: true, data: goals });
  })
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const status = parseGoalStatusBody(req.body);
    const goal = await goalService.updateStatus(req.params.id, status);
    res.json({ success: true, data: goal });
  })
);

export default router;

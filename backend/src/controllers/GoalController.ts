import { Router } from "express";
import { GoalService } from "../services/GoalService";
import { asyncHandler } from "../utils/errors";

const router = Router();
const goalService = new GoalService();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const goal = await goalService.create(req.body);
    res.status(201).json({ success: true, data: goal });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const period = req.query.period as string | undefined;
    const goals = await goalService.list(period);
    res.json({ success: true, data: goals });
  })
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const goal = await goalService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: goal });
  })
);

export default router;

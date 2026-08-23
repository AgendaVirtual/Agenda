import { Router } from "express";
import { ReminderService } from "../services/ReminderService";
import { asyncHandler } from "../utils/errors";

const router = Router();
const reminderService = new ReminderService();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const reminder = await reminderService.create(req.body);
    res.status(201).json({ success: true, data: reminder });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const upcoming = req.query.upcoming === "true";
    const reminders = upcoming
      ? await reminderService.listUpcoming()
      : [];
    res.json({ success: true, data: reminders });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await reminderService.remove(req.params.id);
    res.json({ success: true });
  })
);

export default router;

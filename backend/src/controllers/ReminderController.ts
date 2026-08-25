import { Router } from "express";
import { ReminderService } from "../services/ReminderService";
import { asyncHandler } from "../utils/errors";
import {
  parseCreateReminderBody,
  parseUpcomingQuery,
} from "../utils/validation";

export function createReminderRouter(
  reminderService = new ReminderService()
): Router {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const data = parseCreateReminderBody(req.body);
      const reminder = await reminderService.create(data);
      res.status(201).json({ success: true, data: reminder });
    })
  );

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const upcoming = parseUpcomingQuery(req.query.upcoming);
      const reminders = upcoming
        ? await reminderService.listUpcoming()
        : await reminderService.list();
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

  return router;
}

export default createReminderRouter();

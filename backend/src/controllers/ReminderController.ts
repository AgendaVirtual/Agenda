import { Router } from "express";
import { ReminderService } from "../services/ReminderService";
import { asyncHandler } from "../utils/errors";
import {
  parseCreateReminderBody,
  parseOptionalReminderDateQuery,
  parsePositiveDaysQuery,
  parseUpcomingQuery,
  parseUpdateReminderBody,
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
        ? await reminderService.listUpcoming(
            parsePositiveDaysQuery(req.query.days, 7),
            parseOptionalReminderDateQuery(req.query.date)
          )
        : await reminderService.list();

      res.json({ success: true, data: reminders });
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const reminder = await reminderService.findById(req.params.id);
      res.json({ success: true, data: reminder });
    })
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const data = parseUpdateReminderBody(req.body);
      const reminder = await reminderService.update(req.params.id, data);
      res.json({ success: true, data: reminder });
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

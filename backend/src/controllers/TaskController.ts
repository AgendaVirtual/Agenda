import { Router } from "express";
import { TaskService } from "../services/TaskService";
import { asyncHandler } from "../utils/errors";

const router = Router();
const taskService = new TaskService();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const task = await taskService.create(req.body);
    res.status(201).json({ success: true, data: task });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const date = req.query.date as string | undefined;
    const tasks = await taskService.listByDate(date);
    res.json({ success: true, data: tasks });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await taskService.update(req.params.id, req.body);
    res.json({ success: true, data: task });
  })
);

router.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const task = await taskService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: task });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await taskService.remove(req.params.id);
    res.json({ success: true });
  })
);

export default router;

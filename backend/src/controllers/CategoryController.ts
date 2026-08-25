import { Router } from "express";
import { CategoryService } from "../services/CategoryService";
import { asyncHandler } from "../utils/errors";
import {
  parseCreateCategoryBody,
  parseUpdateCategoryBody,
} from "../utils/validation";

export function createCategoryRouter(
  categoryService = new CategoryService()
): Router {
  const router = Router();

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const data = parseCreateCategoryBody(req.body);
      const category = await categoryService.create(data);
      res.status(201).json({ success: true, data: category });
    })
  );

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      const categories = await categoryService.list();
      res.json({ success: true, data: categories });
    })
  );

  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const data = parseUpdateCategoryBody(req.body);
      const category = await categoryService.update(req.params.id, data);
      res.json({ success: true, data: category });
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      await categoryService.remove(req.params.id);
      res.json({ success: true });
    })
  );

  return router;
}

export default createCategoryRouter();

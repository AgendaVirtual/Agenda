import { Router } from "express";
import { CategoryService } from "../services/CategoryService";
import { asyncHandler } from "../utils/errors";
import { parseCreateCategoryBody } from "../utils/validation";

const router = Router();
const categoryService = new CategoryService();

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

export default router;

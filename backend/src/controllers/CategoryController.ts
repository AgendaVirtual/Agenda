import { Router } from "express";
import { CategoryService } from "../services/CategoryService";
import { asyncHandler } from "../utils/errors";

const router = Router();
const categoryService = new CategoryService();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const category = await categoryService.create(req.body);

     res.status(201).json({
          success: true,
          data: category,
        });
      })
    );

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await categoryService.list();

    res.json({
        success: true,
        data: categories,
    });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const category = await categoryService.update(
      req.params.id,
      req.body
    );

    res.json({
      success: true,
      data: category,
    });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await categoryService.remove(req.params.id);

    res.json({
      success: true,
    });
  })
);

export default router;

import { request } from "./api";
import type { Category, CreateCategoryDTO } from "../types/entities";

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

export function createCategory(data: CreateCategoryDTO): Promise<Category> {
  return request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export const CATEGORY_EDIT_SUPPORTED = false;

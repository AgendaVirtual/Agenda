import { request } from "./api";
import type { Category } from "../types/entities";

export function getCategories(): Promise<Category[]> {
  return request<Category[]>("/categories");
}

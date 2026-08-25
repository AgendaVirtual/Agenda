import { FileRepository } from "../persistence/FileRepository";
import { Category } from "../types/entities";

export class CategoryRepository extends FileRepository<Category> {
  constructor() {
    super("categories.json");
  }
}
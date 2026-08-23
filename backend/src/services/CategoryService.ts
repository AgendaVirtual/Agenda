import { FileRepository } from "../persistence/FileRepository";
import { Category, CreateCategoryDTO } from "../types/entities";
import { AppError } from "../utils/errors";

export class CategoryRepository extends FileRepository<Category> {
  constructor() {
    super("categories.json");
  }
}

// Categorias iniciais sugeridas pelo PDF (seção 6) - usar como seed
export const DEFAULT_CATEGORIES: CreateCategoryDTO[] = [
  { name: "Faculdade", color: "#3F51B5" },
  { name: "Trabalho", color: "#F44336" },
  { name: "Saúde", color: "#4CAF50" },
  { name: "Lazer", color: "#FF9800" },
  { name: "Projetos pessoais", color: "#9C27B0" },
  { name: "Estudos", color: "#00BCD4" },
];

export class CategoryService {
  constructor(private repository = new CategoryRepository()) {}

  async create(data: CreateCategoryDTO): Promise<Category> {
    if (!data.color) throw new AppError("Cor da categoria é obrigatória");
    const all = await this.repository.findAll();
    const duplicate = all.some((c) => c.color === data.color);
    if (duplicate) throw new AppError("Já existe uma categoria com essa cor");
    return this.repository.create(data);
  }

  async list(): Promise<Category[]> {
    return this.repository.findAll();
  }

  async seedDefaults(): Promise<void> {
    const existing = await this.repository.findAll();
    if (existing.length > 0) return;
    for (const c of DEFAULT_CATEGORIES) {
      await this.repository.create(c);
    }
  }
}

import { FileRepository } from "../persistence/FileRepository";
import { Category, CreateCategoryDTO } from "../types/entities";
import { AppError } from "../utils/errors";

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

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
    if (typeof data.name !== "string" || data.name.trim().length === 0) {
      throw new AppError("Nome da categoria é obrigatório");
    }
    if (typeof data.color !== "string" || !HEX_COLOR_PATTERN.test(data.color)) {
      throw new AppError("Cor deve estar no formato hexadecimal #RRGGBB");
    }

    const all = await this.repository.findAll();
    const duplicate = all.some(
      (category) => category.color.toLowerCase() === data.color.toLowerCase()
    );
    if (duplicate) throw new AppError("Já existe uma categoria com essa cor");

    return this.repository.create({
      name: data.name.trim(),
      color: data.color,
    });
  }

  async list(): Promise<Category[]> {
    return this.repository.findAll();
  }

  async seedDefaults(): Promise<void> {
    const existing = await this.repository.findAll();
    if (existing.length > 0) return;
    for (const category of DEFAULT_CATEGORIES) {
      await this.repository.create(category);
    }
  }
}

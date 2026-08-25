import { IRepository } from "../persistence/FileRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
export { CategoryRepository };
import {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "../types/entities";
import { AppError } from "../utils/errors";

export const DEFAULT_CATEGORIES: CreateCategoryDTO[] = [
  { name: "Faculdade", color: "#3F51B5" },
  { name: "Trabalho", color: "#F44336" },
  { name: "Saúde", color: "#4CAF50" },
  { name: "Lazer", color: "#FF9800" },
  { name: "Projetos pessoais", color: "#9C27B0" },
  { name: "Estudos", color: "#00BCD4" },
];

const DEFAULT_CATEGORY_COLORS = [
  ...DEFAULT_CATEGORIES.map((category) => category.color as string),
  "#795548",
  "#607D8B",
  "#E91E63",
  "#009688",
  "#673AB7",
  "#CDDC39",
];

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;
const CREATE_FIELDS = new Set(["name", "color"]);
const UPDATE_FIELDS = CREATE_FIELDS;

function normalizeName(name: unknown): string {
  const normalized = typeof name === "string" ? name.trim() : "";
  if (!normalized) {
    throw new AppError("Nome da categoria é obrigatório");
  }
  return normalized;
}

function normalizeColor(color: unknown): string {
  if (typeof color !== "string") {
    throw new AppError(
      "Cor da categoria deve estar no formato hexadecimal #RRGGBB"
    );
  }

  const normalized = color.trim().toUpperCase();
  if (!HEX_COLOR_PATTERN.test(normalized)) {
    throw new AppError(
      "Cor da categoria deve estar no formato hexadecimal #RRGGBB"
    );
  }
  return normalized;
}


function validateCreateShape(data: unknown): asserts data is CreateCategoryDTO {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AppError("Dados da categoria são obrigatórios");
  }

  const invalid = Object.keys(data).filter((key) => !CREATE_FIELDS.has(key));
  if (invalid.length > 0) {
    throw new AppError(`Campo(s) não permitido(s): ${invalid.join(", ")}`);
  }
}

function validateUpdateShape(data: unknown): asserts data is UpdateCategoryDTO {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AppError("Dados da categoria são obrigatórios");
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar a categoria");
  }

  const invalid = keys.filter((key) => !UPDATE_FIELDS.has(key));
  if (invalid.length > 0) {
    throw new AppError(`Campo(s) não permitido(s): ${invalid.join(", ")}`);
  }
}

export function assignDefaultColor(usedColors: string[]): string {
  const used = new Set(usedColors.map((color) => color.toUpperCase()));
  const available = DEFAULT_CATEGORY_COLORS.find(
    (color) => !used.has(color.toUpperCase())
  );

  if (!available) {
    throw new AppError(
      "Não há cor padrão disponível; informe uma cor hexadecimal"
    );
  }
  return available;
}

export class CategoryService {
  constructor(
    private repository: IRepository<Category> = new CategoryRepository()
  ) {}

  async create(data: CreateCategoryDTO): Promise<Category> {
    validateCreateShape(data);

    const categories = await this.repository.findAll();
    const name = normalizeName(data.name);
    const color =
      data.color === undefined
        ? assignDefaultColor(categories.map((category) => category.color))
        : normalizeColor(data.color);

    this.ensureUniqueColor(color, categories);
    return this.repository.create({ name, color });
  }

  async list(): Promise<Category[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new AppError("Categoria não encontrada", 404);
    }
    return category;
  }

  async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
    validateUpdateShape(data);

    const current = await this.findById(id);
    const categories = await this.repository.findAll();

    const name =
      data.name === undefined ? current.name : normalizeName(data.name);
    const color =
      data.color === undefined ? current.color : normalizeColor(data.color);

    this.ensureUniqueColor(color, categories, id);

    const updated = await this.repository.update(id, { name, color });
    if (!updated) {
      throw new AppError("Categoria não encontrada", 404);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError("Categoria não encontrada", 404);
    }
  }

  async seedDefaults(): Promise<void> {
    const existing = await this.repository.findAll();
    const usedNames = new Set(
      existing.map((category) =>
        category.name.trim().toLocaleLowerCase("pt-BR")
      )
    );
    const usedColors = new Set(
      existing.map((category) => category.color.toUpperCase())
    );

    for (const category of DEFAULT_CATEGORIES) {
      const color = normalizeColor(category.color);
      const nameKey = category.name.toLocaleLowerCase("pt-BR");

      if (!usedNames.has(nameKey) && !usedColors.has(color)) {
        await this.repository.create({ name: category.name, color });
        usedNames.add(nameKey);
        usedColors.add(color);
      }
    }
  }

  private ensureUniqueColor(
    color: string,
    categories: Category[],
    ignoredId?: string
  ): void {
    const duplicate = categories.some(
      (category) =>
        category.id !== ignoredId && category.color.toUpperCase() === color
    );

    if (duplicate) {
      throw new AppError("Já existe uma categoria com essa cor");
    }
  }
}

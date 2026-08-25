import { GoalRepository } from "../repositories/GoalRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { CreateGoalDTO, Goal } from "../types/entities";
import { GoalPeriod, GoalStatus } from "../types/enums";
import { AppError } from "../utils/errors";
import { isValidISODate } from "../utils/reportCalculations";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const GOAL_CREATE_FIELDS = new Set([
  "description",
  "categoryId",
  "period",
  "startDate",
  "endDate",
]);

function validateGoalCreateShape(data: unknown): void {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AppError("Dados da meta são obrigatórios");
  }

  const invalid = Object.keys(data).filter(
    (key) => !GOAL_CREATE_FIELDS.has(key)
  );
  if (invalid.length > 0) {
    throw new AppError(`Campo(s) não permitido(s): ${invalid.join(", ")}`);
  }
}

// Faixa de dias tolerada para cada período, com uma margem
// razoável (ex: mês pode ter 28 a 31 dias).
const PERIOD_DAY_RANGE: Record<GoalPeriod, { min: number; max: number }> = {
  [GoalPeriod.SEMANAL]: { min: 1, max: 10 },
  [GoalPeriod.MENSAL]: { min: 11, max: 40 },
  [GoalPeriod.ANUAL]: { min: 41, max: 400 },
};

function isEnumValue<T extends string>(
  enumObject: Record<string, T>,
  value: unknown
): value is T {
  return typeof value === "string" && Object.values(enumObject).includes(value as T);
}

// Garante que startDate <= endDate e que a duração do intervalo
// é coerente com o period escolhido (SEMANAL, MENSAL ou ANUAL).
function validateGoalPeriod(
  period: GoalPeriod,
  startDate: string,
  endDate: string
): void {
  if (!isEnumValue(GoalPeriod, period)) {
    throw new AppError("Período da meta inválido");
  }

  if (!isValidISODate(startDate) || !isValidISODate(endDate)) {
    throw new AppError("Datas da meta devem estar no formato YYYY-MM-DD");
  }

  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (start > end) {
    throw new AppError(
      "A data de início da meta não pode ser depois da data de fim"
    );
  }

  const durationDays =
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const range = PERIOD_DAY_RANGE[period];

  if (durationDays < range.min || durationDays > range.max) {
    throw new AppError(
      `Duração de ${durationDays} dia(s) não é coerente com o período "${period}" (esperado entre ${range.min} e ${range.max} dias)`
    );
  }
}

export class GoalService {
  constructor(
    private repository = new GoalRepository(),
    private categoryRepository = new CategoryRepository()
  ) {}

  private async validateCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new AppError(`Categoria "${categoryId}" não existe`);
    }
  }

  async create(data: CreateGoalDTO): Promise<Goal> {
    validateGoalCreateShape(data);
    if (typeof data.description !== "string" || data.description.trim().length === 0) {
      throw new AppError("Descrição é obrigatória");
    }
    if (typeof data.categoryId !== "string" || data.categoryId.trim().length === 0) {
      throw new AppError("Categoria é obrigatória");
    }

    validateGoalPeriod(data.period, data.startDate, data.endDate);
    await this.validateCategoryExists(data.categoryId);

    return this.repository.create({
      description: data.description.trim(),
      categoryId: data.categoryId.trim(),
      period: data.period,
      startDate: data.startDate,
      endDate: data.endDate,
      status: GoalStatus.EM_ANDAMENTO,
    });
  }

  async list(period?: GoalPeriod): Promise<Goal[]> {
    if (period !== undefined && !isEnumValue(GoalPeriod, period)) {
      throw new AppError("Período da meta inválido");
    }

    const all = await this.repository.findAll();
    if (!period) return all;
    return all.filter((goal) => goal.period === period);
  }

  async updateStatus(id: string, status: GoalStatus): Promise<Goal> {
    if (!isEnumValue(GoalStatus, status)) {
      throw new AppError("Status da meta inválido");
    }

    const updated = await this.repository.update(id, { status });
    if (!updated) throw new AppError("Meta não encontrada", 404);
    return updated;
  }
}

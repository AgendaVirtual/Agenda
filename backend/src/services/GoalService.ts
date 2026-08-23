import { GoalRepository } from "../repositories/GoalRepository";
import { CreateGoalDTO, Goal } from "../types/entities";
import { GoalPeriod, GoalStatus } from "../types/enums";
import { AppError } from "../utils/errors";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Faixa de dias tolerada para cada período, com uma margem
// razoável (ex: mês pode ter 28 a 31 dias).
const PERIOD_DAY_RANGE: Record<GoalPeriod, { min: number; max: number }> = {
  [GoalPeriod.SEMANAL]: { min: 1, max: 10 },
  [GoalPeriod.MENSAL]: { min: 11, max: 40 },
  [GoalPeriod.ANUAL]: { min: 41, max: 400 },
};

// Garante que startDate <= endDate e que a duração do intervalo
// é coerente com o period escolhido (SEMANAL, MENSAL ou ANUAL)
function validateGoalPeriod(
  period: GoalPeriod,
  startDate: string,
  endDate: string
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new AppError(
      "A data de início da meta não pode ser depois da data de fim"
    );
  }

  const durationDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const range = PERIOD_DAY_RANGE[period];

  if (durationDays < range.min || durationDays > range.max) {
    throw new AppError(
      `Duração de ${durationDays} dia(s) não é coerente com o período "${period}" (esperado entre ${range.min} e ${range.max} dias)`
    );
  }
}

export class GoalService {
  constructor(private repository = new GoalRepository()) {}

  async create(data: CreateGoalDTO): Promise<Goal> {
    validateGoalPeriod(data.period, data.startDate, data.endDate);
    return this.repository.create({
      ...data,
      status: GoalStatus.EM_ANDAMENTO,
    });
  }

  async list(period?: string): Promise<Goal[]> {
    const all = await this.repository.findAll();
    if (!period) return all;
    return all.filter((goal) => goal.period === period);
  }

  async updateStatus(id: string, status: GoalStatus): Promise<Goal> {
    const updated = await this.repository.update(id, { status });
    if (!updated) throw new AppError("Meta não encontrada", 404);
    return updated;
  }
}
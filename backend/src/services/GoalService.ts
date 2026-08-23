import { GoalRepository } from "../repositories/GoalRepository";
import { CreateGoalDTO, Goal } from "../types/entities";
import { GoalStatus } from "../types/enums";
import { AppError } from "../utils/errors";

function validateGoalPeriod(startDate: string, endDate: string) {
  if (new Date(startDate) > new Date(endDate)) {
    throw new AppError(
      "A data de início da meta não pode ser depois da data de fim"
    );
  }
}

export class GoalService {
  constructor(private repository = new GoalRepository()) {}

  async create(data: CreateGoalDTO): Promise<Goal> {
    validateGoalPeriod(data.startDate, data.endDate);
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

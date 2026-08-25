import { GoalRepository } from "../repositories/GoalRepository";
import { TaskRepository } from "./TaskService";
import { Goal, ReportDTO, ReportType, Task } from "../types/entities";
import { GoalPeriod } from "../types/enums";
import { AppError } from "../utils/errors";
import {
  calculateCompletionRate,
  calculateReportRange,
  findMostProductivePeriod,
  findMostProductiveShift,
  getISOWeekKey,
  getLocalISODate,
  getMonthKey,
  groupByCategory,
  isGoalCompleted,
  isTaskExecuted,
  isValidISODate,
} from "../utils/reportCalculations";

interface TaskReader {
  findAll(): Promise<Task[]>;
}

interface GoalReader {
  findAll(): Promise<Goal[]>;
}

const REPORT_TYPES: ReportType[] = ["weekly", "monthly", "yearly"];

const GOAL_PERIOD_BY_REPORT: Record<ReportType, GoalPeriod> = {
  weekly: GoalPeriod.SEMANAL,
  monthly: GoalPeriod.MENSAL,
  yearly: GoalPeriod.ANUAL,
};

export class ReportService {
  constructor(
    private taskRepository: TaskReader = new TaskRepository(),
    private goalRepository: GoalReader = new GoalRepository()
  ) {}

  async generate(typeValue?: string, dateValue?: string): Promise<ReportDTO> {
    const type = this.validateType(typeValue ?? "weekly");
    const referenceDate = this.normalizeReferenceDate(type, dateValue);
    const { startDate, endDate } = calculateReportRange(type, referenceDate);

    const [allTasks, allGoals] = await Promise.all([
      this.taskRepository.findAll(),
      this.goalRepository.findAll(),
    ]);

    const tasks = allTasks.filter(
      (task) => task.date >= startDate && task.date <= endDate
    );

    const expectedGoalPeriod = GOAL_PERIOD_BY_REPORT[type];
    const goals = allGoals.filter(
      (goal) =>
        goal.period === expectedGoalPeriod &&
        goal.startDate <= endDate &&
        goal.endDate >= startDate
    );

    const executedTasks = tasks.filter(isTaskExecuted);
    const completedGoals = goals.filter(isGoalCompleted);

    const topTaskCategories = groupByCategory(executedTasks);
    const topGoalCategories = groupByCategory(completedGoals);

    return {
      period: type,
      startDate,
      endDate,

      goalsTotal: goals.length,
      goalsCompleted: completedGoals.length,
      goalsCompletionRate: calculateCompletionRate(goals, isGoalCompleted),

      tasksTotal: tasks.length,
      tasksExecuted: executedTasks.length,
      tasksCompletionRate: calculateCompletionRate(tasks, isTaskExecuted),

      mostProductivePeriod: this.findMostProductivePeriod(type, tasks),
      mostProductiveShift: findMostProductiveShift(tasks),
      mostProductiveCategory: topTaskCategories[0]?.categoryId ?? null,
      topTaskCategories,
      topGoalCategories,
    };
  }

  private findMostProductivePeriod(
    type: ReportType,
    tasks: Task[]
  ): string | null {
    if (type === "weekly") return null;

    return type === "monthly"
      ? findMostProductivePeriod(tasks, getISOWeekKey)
      : findMostProductivePeriod(tasks, getMonthKey);
  }

  private validateType(value: string): ReportType {
    if (!REPORT_TYPES.includes(value as ReportType)) {
      throw new AppError(
        'O parâmetro "type" deve ser weekly, monthly ou yearly'
      );
    }

    return value as ReportType;
  }

  /**
   * Compatibilidade com o contrato do PDF:
   * - weekly:  YYYY-MM-DD
   * - monthly: YYYY-MM ou YYYY-MM-DD
   * - yearly:  YYYY ou YYYY-MM-DD
   *
   * Se date não for informado, usa a data atual do servidor.
   */
  private normalizeReferenceDate(
    type: ReportType,
    value?: string
  ): string {
    if (!value) return getLocalISODate();

    const trimmed = value.trim();

    if (isValidISODate(trimmed)) return trimmed;

    if (type === "monthly" && /^\d{4}-\d{2}$/.test(trimmed)) {
      const candidate = `${trimmed}-01`;
      if (isValidISODate(candidate)) return candidate;
    }

    if (type === "yearly" && /^\d{4}$/.test(trimmed)) {
      return `${trimmed}-01-01`;
    }

    const expected =
      type === "weekly"
        ? "YYYY-MM-DD"
        : type === "monthly"
          ? "YYYY-MM ou YYYY-MM-DD"
          : "YYYY ou YYYY-MM-DD";

    throw new AppError(`O parâmetro "date" deve estar no formato ${expected}`);
  }
}

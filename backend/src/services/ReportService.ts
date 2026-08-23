import { TaskRepository } from "./TaskService";
import { GoalRepository } from "../repositories/GoalRepository";
import { ReportDTO } from "../types/entities";
import { GoalStatus, Shift, TaskStatus } from "../types/enums";

function calculateCompletionRate(done: number, total: number): number {
  if (total === 0) return 0;
  return Number((done / total).toFixed(2));
}

function findMostProductiveShift(
  tasks: { shift?: Shift; status: TaskStatus }[]
): Shift | null {
  const byShift: Record<string, { done: number; total: number }> = {};
  for (const t of tasks) {
    if (!t.shift) continue;
    byShift[t.shift] ??= { done: 0, total: 0 };
    byShift[t.shift].total += 1;
    if (t.status === TaskStatus.EXECUTADA) byShift[t.shift].done += 1;
  }
  let best: Shift | null = null;
  let bestRate = -1;
  for (const [shift, stats] of Object.entries(byShift)) {
    const rate = calculateCompletionRate(stats.done, stats.total);
    if (rate > bestRate) {
      bestRate = rate;
      best = shift as Shift;
    }
  }
  return best;
}

function groupByCategory(
  tasks: { categoryId: string }[]
): { categoryId: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const t of tasks) {
    counts[t.categoryId] = (counts[t.categoryId] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([categoryId, count]) => ({ categoryId, count }))
    .sort((a, b) => b.count - a.count);
}

export class ReportService {
  constructor(
    private taskRepository = new TaskRepository(),
    private goalRepository = new GoalRepository()
  ) {}

  async generate(
    period: "weekly" | "monthly" | "yearly"
  ): Promise<ReportDTO> {
    // Filtro real por período (data) deve ser adicionado conforme a Etapa 4;
    // por ora considera todos os registros existentes.
    const tasks = await this.taskRepository.findAll();
    const goals = await this.goalRepository.findAll();

    const tasksDone = tasks.filter(
      (t) => t.status === TaskStatus.EXECUTADA
    ).length;
    const goalsDone = goals.filter(
      (g) => g.status === GoalStatus.CUMPRIDA
    ).length;

    const topCategories = groupByCategory(tasks);

    return {
      period,
      goalsCompletionRate: calculateCompletionRate(goalsDone, goals.length),
      tasksCompletionRate: calculateCompletionRate(tasksDone, tasks.length),
      mostProductiveShift: findMostProductiveShift(tasks),
      mostProductiveCategory: topCategories[0]?.categoryId ?? null,
      topTaskCategories: topCategories,
    };
  }
}

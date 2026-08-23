import { TaskRepository } from "./TaskService";
import { GoalRepository } from "../repositories/GoalRepository";
import { ReminderService } from "./ReminderService";
import { DashboardSummaryDTO } from "../types/entities";
import { GoalStatus, TaskStatus } from "../types/enums";

function calculateProductivityIndex(
  completedTasks: number,
  totalTasks: number
): number {
  if (totalTasks === 0) return 0;
  return Number((completedTasks / totalTasks).toFixed(2));
}

export class DashboardService {
  constructor(
    private taskRepository = new TaskRepository(),
    private goalRepository = new GoalRepository(),
    private reminderService = new ReminderService()
  ) {}

  async getToday(): Promise<DashboardSummaryDTO> {
    const todayISO = new Date().toISOString().slice(0, 10);

    const tasks = (await this.taskRepository.findAll()).filter(
      (t) => t.date === todayISO
    );
    const goals = await this.goalRepository.findAll();
    const upcoming = await this.reminderService.listUpcoming(3);

    const pendingTasks = tasks.filter(
      (t) => t.status === TaskStatus.PENDENTE
    ).length;
    const completedTasks = tasks.filter(
      (t) => t.status === TaskStatus.EXECUTADA
    ).length;
    const goalsInProgress = goals.filter(
      (g) => g.status === GoalStatus.EM_ANDAMENTO
    ).length;

    return {
      pendingTasks,
      completedTasks,
      goalsInProgress,
      upcomingReminders: upcoming.map((r) => ({
        description: r.description,
        time: r.time,
      })),
      productivityIndex: calculateProductivityIndex(
        completedTasks,
        tasks.length
      ),
    };
  }
}

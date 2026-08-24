import { GoalRepository } from "../repositories/GoalRepository";
import { ReminderRepository } from "../repositories/ReminderRepository";
import { TaskRepository } from "./TaskService";
import {
  DashboardSummaryDTO,
  Goal,
  Reminder,
  Task,
} from "../types/entities";
import {
  GoalStatus,
  ReminderRecurrence,
  TaskStatus,
} from "../types/enums";
import {
  addDays,
  calculateProductivityIndex,
  isValidISODate,
} from "../utils/reportCalculations";
import { AppError } from "../utils/errors";

interface TaskReader {
  findAll(): Promise<Task[]>;
}

interface GoalReader {
  findAll(): Promise<Goal[]>;
}

interface ReminderReader {
  findAll(): Promise<Reminder[]>;
}

const UPCOMING_REMINDER_DAYS = 7;

export class DashboardService {
  constructor(
    private taskRepository: TaskReader = new TaskRepository(),
    private goalRepository: GoalReader = new GoalRepository(),
    private reminderRepository: ReminderReader = new ReminderRepository()
  ) {}

  async getToday(referenceDate?: string): Promise<DashboardSummaryDTO> {
    const today = referenceDate ?? new Date().toISOString().slice(0, 10);

    if (!isValidISODate(today)) {
      throw new AppError("Data de referência inválida; use YYYY-MM-DD");
    }

    const [allTasks, allGoals, allReminders] = await Promise.all([
      this.taskRepository.findAll(),
      this.goalRepository.findAll(),
      this.reminderRepository.findAll(),
    ]);

    const tasksToday = allTasks.filter((task) => task.date === today);
    const activeGoals = allGoals.filter(
      (goal) =>
        goal.status === GoalStatus.EM_ANDAMENTO &&
        goal.startDate <= today &&
        goal.endDate >= today
    );

    const upcomingReminders = this.getUpcomingReminders(
      allReminders,
      today,
      UPCOMING_REMINDER_DAYS
    );

    return {
      pendingTasks: tasksToday.filter(
        (task) => task.status === TaskStatus.PENDENTE
      ).length,
      completedTasks: tasksToday.filter(
        (task) => task.status === TaskStatus.EXECUTADA
      ).length,
      goalsInProgress: activeGoals.length,
      upcomingReminders: upcomingReminders.map(({ reminder }) => ({
        description: reminder.description,
        time: reminder.time,
      })),
      productivityIndex: calculateProductivityIndex(tasksToday),
    };
  }

  /**
   * Mantido aqui para a Pessoa 4 conseguir trabalhar agora sem depender do
   * ReminderService completo da Pessoa 3. A única dependência real é a
   * leitura dos lembretes pelo ReminderRepository.
   */
  private getUpcomingReminders(
    reminders: Reminder[],
    fromDate: string,
    days: number
  ): { reminder: Reminder; occurrenceDate: string }[] {
    const endDate = addDays(fromDate, Math.max(days - 1, 0));
    const fromDayOfWeek = new Date(`${fromDate}T00:00:00.000Z`).getUTCDay();

    const occurrences = reminders.flatMap((reminder) => {
      if (
        reminder.recurrence === ReminderRecurrence.UNICO &&
        reminder.date &&
        reminder.date >= fromDate &&
        reminder.date <= endDate
      ) {
        return [{ reminder, occurrenceDate: reminder.date }];
      }

      if (
        reminder.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL &&
        reminder.dayOfWeek !== undefined &&
        reminder.dayOfWeek >= 0 &&
        reminder.dayOfWeek <= 6
      ) {
        const delta = (reminder.dayOfWeek - fromDayOfWeek + 7) % 7;
        const occurrenceDate = addDays(fromDate, delta);

        if (occurrenceDate <= endDate) {
          return [{ reminder, occurrenceDate }];
        }
      }

      return [];
    });

    return occurrences.sort(
      (a, b) =>
        a.occurrenceDate.localeCompare(b.occurrenceDate) ||
        (a.reminder.time ?? "99:99").localeCompare(b.reminder.time ?? "99:99") ||
        a.reminder.description.localeCompare(b.reminder.description)
    );
  }
}

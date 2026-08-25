import {
  TaskStatus,
  TaskPriority,
  TimeBlockType,
  Shift,
  GoalPeriod,
  GoalStatus,
  ReminderRecurrence,
  ReminderType,
} from "./enums";

export interface Category {
  id: string;
  name: string;
  color: string; // hex, ex: "#4CAF50"
}

export interface Task {
  id: string;
  description: string;
  categoryId: string;
  date: string; // ISO "YYYY-MM-DD"
  timeBlockType: TimeBlockType;
  time?: string; // "HH:mm" quando timeBlockType != TURNO
  shift?: Shift; // quando timeBlockType == TURNO
  status: TaskStatus;
  priority: TaskPriority;
}

export interface Goal {
  id: string;
  description: string;
  categoryId: string;
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  status: GoalStatus;
}

export interface Reminder {
  id: string;
  description: string;
  type: ReminderType;
  recurrence: ReminderRecurrence;
  dayOfWeek?: number; // 0-6, para recorrentes
  date?: string; // para lembretes únicos
  time?: string;
}

// DTOs usados pelos services/controllers
export type CreateGoalDTO = Omit<Goal, "id" | "status">;
export type UpdateGoalStatusDTO = { status: GoalStatus };

export type CreateTaskDTO = Omit<Task, "id" | "status">;
export type UpdateTaskStatusDTO = { status: TaskStatus };

export type CreateCategoryDTO = Omit<Category, "id" | "color"> & {
  color?: string;
};

export type UpdateCategoryDTO = Partial<CreateCategoryDTO>;

export type CreateReminderDTO = Omit<Reminder, "id">;

export type UpdateReminderDTO = Partial<CreateReminderDTO>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// A divisão não define um enum novo para relatório. Mantemos apenas o tipo
// textual aceito pela API, reutilizando os enums já existentes do projeto.
export type ReportType = "weekly" | "monthly" | "yearly";

export interface CategoryCountDTO {
  categoryId: string;
  count: number;
}

export interface ReportDTO {
  period: ReportType;
  startDate: string;
  endDate: string;

  goalsTotal: number;
  goalsCompleted: number;
  goalsCompletionRate: number;

  tasksTotal: number;
  tasksExecuted: number;
  tasksCompletionRate: number;

  // monthly -> semana mais produtiva; yearly -> mês mais produtivo.
  // weekly não possui um período menor exigido pela especificação.
  mostProductivePeriod: string | null;
  mostProductiveShift: Shift | null;

  // Mantido por compatibilidade com o formato que já existia no Agenda.
  // O valor é o categoryId da categoria de tarefas executadas mais frequente.
  mostProductiveCategory: string | null;

  topTaskCategories: CategoryCountDTO[];
  topGoalCategories: CategoryCountDTO[];
}

export interface DashboardSummaryDTO {
  pendingTasks: number;
  completedTasks: number;
  goalsInProgress: number;
  upcomingReminders: { description: string; time?: string }[];
  productivityIndex: number;
}

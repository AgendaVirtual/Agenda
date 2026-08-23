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

export type CreateCategoryDTO = Omit<Category, "id">;
export type CreateReminderDTO = Omit<Reminder, "id">;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ReportDTO {
  period: "weekly" | "monthly" | "yearly";
  goalsCompletionRate: number;
  tasksCompletionRate: number;
  mostProductiveShift: Shift | null;
  mostProductiveCategory: string | null;
  topTaskCategories: { categoryId: string; count: number }[];
}

export interface DashboardSummaryDTO {
  pendingTasks: number;
  completedTasks: number;
  goalsInProgress: number;
  upcomingReminders: { description: string; time?: string }[];
  productivityIndex: number;
}

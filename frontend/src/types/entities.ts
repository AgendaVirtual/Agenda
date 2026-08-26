import type {
  TaskStatus,
  TaskPriority,
  TimeBlockType,
  TaskRecurrence,
  Shift,
  GoalPeriod,
  GoalStatus,
  ReminderRecurrence,
  ReminderType,
} from "./enums";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  description: string;
  categoryId: string;
  date: string;
  timeBlockType: TimeBlockType;
  time?: string;
  endTime?: string;
  shift?: Shift;
  status: TaskStatus;
  priority: TaskPriority;
  recurrence?: TaskRecurrence;
  recurrenceGroupId?: string;
  alertEnabled?: boolean;
  alertLeadMinutes?: number;
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
  dayOfWeek?: number;
  date?: string;
  time?: string;
}

export type CreateTaskDTO = Omit<
  Task,
  "id" | "status" | "timeBlockType" | "shift" | "recurrenceGroupId"
>;
export type UpdateTaskStatusDTO = { status: TaskStatus };

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type CreateGoalDTO = Omit<Goal, "id" | "status">;
export type CreateReminderDTO = Omit<Reminder, "id">;
export type CreateCategoryDTO = Omit<Category, "id">;

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

  mostProductivePeriod: string | null;
  mostProductiveShift: Shift | null;
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

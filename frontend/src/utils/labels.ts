import {
  GoalPeriod,
  GoalStatus,
  ReminderRecurrence,
  ReminderType,
  Shift,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
  TimeBlockType,
} from "../types/enums";
import type { BadgeTone } from "../components/ui/Badge";

export const SHIFT_LABELS: Record<Shift, string> = {
  [Shift.MANHA]: "Manhã",
  [Shift.TARDE]: "Tarde",
  [Shift.NOITE]: "Noite",
};

export const TIME_BLOCK_LABELS: Record<TimeBlockType, string> = {
  [TimeBlockType.MEIA_HORA]: "Meia hora",
  [TimeBlockType.UMA_HORA]: "Uma hora",
  [TimeBlockType.TURNO]: "Turno",
};

export const TASK_RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  [TaskRecurrence.UNICA]: "Não se repete",
  [TaskRecurrence.DIARIA]: "Todo dia",
  [TaskRecurrence.SEMANAL]: "Toda semana",
  [TaskRecurrence.MENSAL]: "Todo mês",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.PENDENTE]: "Pendente",
  [TaskStatus.EXECUTADA]: "Executada",
  [TaskStatus.PARCIALMENTE_EXECUTADA]: "Parcialmente executada",
  [TaskStatus.CANCELADA]: "Cancelada",
  [TaskStatus.ADIADA]: "Adiada",
};

export const TASK_STATUS_TONES: Record<TaskStatus, BadgeTone> = {
  [TaskStatus.PENDENTE]: "neutral",
  [TaskStatus.EXECUTADA]: "success",
  [TaskStatus.PARCIALMENTE_EXECUTADA]: "warning",
  [TaskStatus.CANCELADA]: "danger",
  [TaskStatus.ADIADA]: "accent",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.ALTA]: "Alta",
  [TaskPriority.MEDIA]: "Média",
  [TaskPriority.BAIXA]: "Baixa",
};

export const PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  [TaskPriority.ALTA]: "danger",
  [TaskPriority.MEDIA]: "warning",
  [TaskPriority.BAIXA]: "success",
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  [GoalPeriod.SEMANAL]: "Semanal",
  [GoalPeriod.MENSAL]: "Mensal",
  [GoalPeriod.ANUAL]: "Anual",
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  [GoalStatus.EM_ANDAMENTO]: "Em andamento",
  [GoalStatus.CUMPRIDA]: "Cumprida",
  [GoalStatus.PARCIALMENTE_CUMPRIDA]: "Parcialmente cumprida",
  [GoalStatus.NAO_CUMPRIDA]: "Não cumprida",
};

export const GOAL_STATUS_TONES: Record<GoalStatus, BadgeTone> = {
  [GoalStatus.EM_ANDAMENTO]: "accent",
  [GoalStatus.CUMPRIDA]: "success",
  [GoalStatus.PARCIALMENTE_CUMPRIDA]: "warning",
  [GoalStatus.NAO_CUMPRIDA]: "danger",
};

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  [ReminderType.REUNIAO]: "Reunião",
  [ReminderType.LIGACAO]: "Ligação",
  [ReminderType.COMPRA]: "Compra",
  [ReminderType.ESTUDO]: "Estudo",
  [ReminderType.EXERCICIO]: "Exercício",
  [ReminderType.ENTREGA]: "Entrega de trabalho",
};

export const RECURRENCE_LABELS: Record<ReminderRecurrence, string> = {
  [ReminderRecurrence.UNICO]: "Único",
  [ReminderRecurrence.RECORRENTE_SEMANAL]: "Toda semana",
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export function plural(count: number, singular: string, many: string): string {
  return count === 1 ? singular : many;
}

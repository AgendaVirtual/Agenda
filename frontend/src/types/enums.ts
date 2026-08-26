export const TaskStatus = {
  PENDENTE: "PENDENTE",
  EXECUTADA: "EXECUTADA",
  PARCIALMENTE_EXECUTADA: "PARCIALMENTE_EXECUTADA",
  CANCELADA: "CANCELADA",
  ADIADA: "ADIADA",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TimeBlockType = {
  MEIA_HORA: "MEIA_HORA",
  UMA_HORA: "UMA_HORA",
  TURNO: "TURNO",
} as const;
export type TimeBlockType = (typeof TimeBlockType)[keyof typeof TimeBlockType];

export const TaskRecurrence = {
  UNICA: "UNICA",
  DIARIA: "DIARIA",
  SEMANAL: "SEMANAL",
  MENSAL: "MENSAL",
} as const;
export type TaskRecurrence =
  (typeof TaskRecurrence)[keyof typeof TaskRecurrence];

export const Shift = {
  MANHA: "MANHA",
  TARDE: "TARDE",
  NOITE: "NOITE",
} as const;
export type Shift = (typeof Shift)[keyof typeof Shift];

export const GoalPeriod = {
  SEMANAL: "SEMANAL",
  MENSAL: "MENSAL",
  ANUAL: "ANUAL",
} as const;
export type GoalPeriod = (typeof GoalPeriod)[keyof typeof GoalPeriod];

export const GoalStatus = {
  CUMPRIDA: "CUMPRIDA",
  PARCIALMENTE_CUMPRIDA: "PARCIALMENTE_CUMPRIDA",
  NAO_CUMPRIDA: "NAO_CUMPRIDA",
  EM_ANDAMENTO: "EM_ANDAMENTO",
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const ReminderRecurrence = {
  UNICO: "UNICO",
  RECORRENTE_SEMANAL: "RECORRENTE_SEMANAL",
} as const;
export type ReminderRecurrence =
  (typeof ReminderRecurrence)[keyof typeof ReminderRecurrence];

export const ReminderType = {
  REUNIAO: "REUNIAO",
  LIGACAO: "LIGACAO",
  COMPRA: "COMPRA",
  ESTUDO: "ESTUDO",
  EXERCICIO: "EXERCICIO",
  ENTREGA: "ENTREGA",
} as const;
export type ReminderType = (typeof ReminderType)[keyof typeof ReminderType];

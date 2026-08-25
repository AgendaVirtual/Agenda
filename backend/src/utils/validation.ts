import {
  CreateCategoryDTO,
  CreateGoalDTO,
  CreateReminderDTO,
  CreateTaskDTO,
} from "../types/entities";
import {
  GoalPeriod,
  GoalStatus,
  ReminderRecurrence,
  ReminderType,
  Shift,
  TaskPriority,
  TaskStatus,
  TimeBlockType,
} from "../types/enums";
import { AppError } from "./errors";
import { isValidISODate } from "./reportCalculations";

type InputObject = Record<string, unknown>;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

function asObject(value: unknown): InputObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AppError("O corpo da requisição deve ser um objeto JSON");
  }
  return value as InputObject;
}

function rejectUnknownFields(
  data: InputObject,
  allowedFields: readonly string[]
): void {
  const unknown = Object.keys(data).filter(
    (key) => !allowedFields.includes(key)
  );

  if (unknown.length > 0) {
    throw new AppError(`Campo(s) não permitido(s): ${unknown.join(", ")}`);
  }
}

function requiredString(
  data: InputObject,
  field: string,
  label = field
): string {
  const value = data[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(`O campo "${label}" é obrigatório`);
  }
  return value.trim();
}

function optionalString(
  data: InputObject,
  field: string,
  label = field
): string | undefined {
  if (!(field in data) || data[field] === undefined) return undefined;
  if (typeof data[field] !== "string" || data[field]!.trim().length === 0) {
    throw new AppError(`${label} deve ser uma string não vazia`);
  }
  return (data[field] as string).trim();
}

function enumValue<T extends string>(
  value: unknown,
  enumObject: Record<string, T>,
  label: string
): T {
  if (typeof value !== "string" || !Object.values(enumObject).includes(value as T)) {
    throw new AppError(`${label} inválido`);
  }
  return value as T;
}

function optionalEnumValue<T extends string>(
  data: InputObject,
  field: string,
  enumObject: Record<string, T>,
  label: string
): T | undefined {
  if (!(field in data) || data[field] === undefined) return undefined;
  return enumValue(data[field], enumObject, label);
}

function isoDate(value: unknown, label: string): string {
  if (typeof value !== "string" || !isValidISODate(value)) {
    throw new AppError(`${label} deve estar no formato YYYY-MM-DD`);
  }
  return value;
}

function optionalISODate(
  data: InputObject,
  field: string,
  label: string
): string | undefined {
  if (!(field in data) || data[field] === undefined) return undefined;
  return isoDate(data[field], label);
}

function timeValue(value: unknown, label = "Horário"): string {
  if (typeof value !== "string" || !TIME_PATTERN.test(value)) {
    throw new AppError(`${label} deve estar no formato HH:mm`);
  }
  return value;
}

function optionalTime(
  data: InputObject,
  field: string,
  label = "Horário"
): string | undefined {
  if (!(field in data) || data[field] === undefined) return undefined;
  return timeValue(data[field], label);
}

function integerInRange(
  value: unknown,
  min: number,
  max: number,
  label: string
): number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new AppError(`${label} deve ser um inteiro entre ${min} e ${max}`);
  }
  return value as number;
}

export function parseCreateTaskBody(body: unknown): CreateTaskDTO {
  const data = asObject(body);
  rejectUnknownFields(data, [
    "description",
    "categoryId",
    "date",
    "timeBlockType",
    "time",
    "shift",
    "priority",
  ]);

  return {
    description: requiredString(data, "description", "Descrição"),
    categoryId: requiredString(data, "categoryId", "Categoria"),
    date: isoDate(data.date, "Data"),
    timeBlockType: enumValue(
      data.timeBlockType,
      TimeBlockType,
      "Tipo de bloco de tempo"
    ),
    time: optionalTime(data, "time"),
    shift: optionalEnumValue(data, "shift", Shift, "Turno"),
    priority: enumValue(data.priority, TaskPriority, "Prioridade"),
  };
}

export function parseUpdateTaskBody(body: unknown): Partial<CreateTaskDTO> {
  const data = asObject(body);
  rejectUnknownFields(data, [
    "description",
    "categoryId",
    "date",
    "timeBlockType",
    "time",
    "shift",
    "priority",
  ]);

  if (Object.keys(data).length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar a tarefa");
  }

  const result: Partial<CreateTaskDTO> = {};

  if ("description" in data) {
    result.description = requiredString(data, "description", "Descrição");
  }
  if ("categoryId" in data) {
    result.categoryId = requiredString(data, "categoryId", "Categoria");
  }
  if ("date" in data) {
    result.date = isoDate(data.date, "Data");
  }
  if ("timeBlockType" in data) {
    result.timeBlockType = enumValue(
      data.timeBlockType,
      TimeBlockType,
      "Tipo de bloco de tempo"
    );
  }
  if ("time" in data) {
    result.time = optionalTime(data, "time");
  }
  if ("shift" in data) {
    result.shift = optionalEnumValue(data, "shift", Shift, "Turno");
  }
  if ("priority" in data) {
    result.priority = enumValue(data.priority, TaskPriority, "Prioridade");
  }

  return result;
}

export function parseTaskStatusBody(body: unknown): TaskStatus {
  const data = asObject(body);
  rejectUnknownFields(data, ["status"]);
  return enumValue(data.status, TaskStatus, "Status da tarefa");
}

export function parseCreateGoalBody(body: unknown): CreateGoalDTO {
  const data = asObject(body);
  rejectUnknownFields(data, [
    "description",
    "categoryId",
    "period",
    "startDate",
    "endDate",
  ]);

  return {
    description: requiredString(data, "description", "Descrição"),
    categoryId: requiredString(data, "categoryId", "Categoria"),
    period: enumValue(data.period, GoalPeriod, "Período da meta"),
    startDate: isoDate(data.startDate, "Data inicial"),
    endDate: isoDate(data.endDate, "Data final"),
  };
}

export function parseGoalStatusBody(body: unknown): GoalStatus {
  const data = asObject(body);
  rejectUnknownFields(data, ["status"]);
  return enumValue(data.status, GoalStatus, "Status da meta");
}

export function parseCreateCategoryBody(body: unknown): CreateCategoryDTO {
  const data = asObject(body);
  rejectUnknownFields(data, ["name", "color"]);

  const color = requiredString(data, "color", "Cor");
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw new AppError("Cor deve estar no formato hexadecimal #RRGGBB");
  }

  return {
    name: requiredString(data, "name", "Nome da categoria"),
    color,
  };
}

export function parseCreateReminderBody(body: unknown): CreateReminderDTO {
  const data = asObject(body);
  rejectUnknownFields(data, [
    "description",
    "type",
    "recurrence",
    "dayOfWeek",
    "date",
    "time",
  ]);

  const recurrence = enumValue(
    data.recurrence,
    ReminderRecurrence,
    "Recorrência"
  );

  const result: CreateReminderDTO = {
    description: requiredString(data, "description", "Descrição"),
    type: enumValue(data.type, ReminderType, "Tipo de lembrete"),
    recurrence,
    time: optionalTime(data, "time"),
  };

  if (recurrence === ReminderRecurrence.UNICO) {
    result.date = isoDate(data.date, "Data");
    if ("dayOfWeek" in data && data.dayOfWeek !== undefined) {
      throw new AppError("Lembrete único não deve informar dayOfWeek");
    }
  } else {
    result.dayOfWeek = integerInRange(data.dayOfWeek, 0, 6, "dayOfWeek");
    if ("date" in data && data.date !== undefined) {
      throw new AppError("Lembrete recorrente semanal não deve informar date");
    }
  }

  return result;
}

export function parseOptionalTaskDateQuery(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return isoDate(value, "Data");
}

export function parseOptionalDashboardDateQuery(
  value: unknown
): string | undefined {
  if (value === undefined) return undefined;
  return isoDate(value, "Data de referência");
}

export function parseOptionalGoalPeriodQuery(
  value: unknown
): GoalPeriod | undefined {
  if (value === undefined) return undefined;
  return enumValue(value, GoalPeriod, "Período da meta");
}

export function parseUpcomingQuery(value: unknown): boolean {
  if (value === undefined) return false;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new AppError('O parâmetro "upcoming" deve ser true ou false');
}

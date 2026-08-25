import { IRepository } from "../persistence/FileRepository";
import { ReminderRepository } from "../repositories/ReminderRepository";
import {
  CreateReminderDTO,
  Reminder,
  UpdateReminderDTO,
} from "../types/entities";
import {
  ReminderRecurrence,
  ReminderType,
} from "../types/enums";
import { AppError } from "../utils/errors";
import {
  addDays,
  getLocalISODate,
  isValidISODate,
} from "../utils/reportCalculations";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const REMINDER_WRITE_FIELDS = new Set([
  "description",
  "type",
  "recurrence",
  "dayOfWeek",
  "date",
  "time",
]);


function validateCreateShape(data: unknown): asserts data is CreateReminderDTO {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AppError("Dados do lembrete são obrigatórios");
  }

  const invalid = Object.keys(data).filter(
    (key) => !REMINDER_WRITE_FIELDS.has(key)
  );
  if (invalid.length > 0) {
    throw new AppError(`Campo(s) não permitido(s): ${invalid.join(", ")}`);
  }
}

function isEnumValue<T extends string>(
  enumObject: Record<string, T>,
  value: unknown
): value is T {
  return (
    typeof value === "string" &&
    Object.values(enumObject).includes(value as T)
  );
}

function normalizeReminder(data: CreateReminderDTO): Omit<Reminder, "id"> {
  if (!data || typeof data !== "object") {
    throw new AppError("Dados do lembrete são obrigatórios");
  }

  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  if (!description) {
    throw new AppError("Descrição do lembrete é obrigatória");
  }

  if (!isEnumValue(ReminderType, data.type)) {
    throw new AppError("Tipo de lembrete inválido");
  }
  if (!isEnumValue(ReminderRecurrence, data.recurrence)) {
    throw new AppError("Recorrência do lembrete inválida");
  }
  if (
    data.time !== undefined &&
    (typeof data.time !== "string" || !TIME_PATTERN.test(data.time))
  ) {
    throw new AppError("Horário do lembrete deve estar no formato HH:mm");
  }

  if (data.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL) {
    if (
      !Number.isInteger(data.dayOfWeek) ||
      data.dayOfWeek! < 0 ||
      data.dayOfWeek! > 6
    ) {
      throw new AppError(
        "Lembrete recorrente exige dayOfWeek entre 0 e 6"
      );
    }
    if (data.date !== undefined) {
      throw new AppError(
        "Lembrete recorrente semanal não deve informar date"
      );
    }

    return {
      description,
      type: data.type,
      recurrence: data.recurrence,
      dayOfWeek: data.dayOfWeek,
      time: data.time,
    };
  }

  if (!data.date || !isValidISODate(data.date)) {
    throw new AppError(
      "Lembrete único exige uma data válida no formato YYYY-MM-DD"
    );
  }
  if (data.dayOfWeek !== undefined) {
    throw new AppError("Lembrete único não deve informar dayOfWeek");
  }

  return {
    description,
    type: data.type,
    recurrence: data.recurrence,
    date: data.date,
    time: data.time,
  };
}

function validateUpdateShape(data: unknown): asserts data is UpdateReminderDTO {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AppError("Dados do lembrete são obrigatórios");
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar o lembrete");
  }

  const invalid = keys.filter((key) => !REMINDER_WRITE_FIELDS.has(key));
  if (invalid.length > 0) {
    throw new AppError(`Campo(s) não permitido(s): ${invalid.join(", ")}`);
  }
}

export function validateReminderFields(data: CreateReminderDTO): void {
  normalizeReminder(data);
}

export function getNextOccurrence(
  dayOfWeek: number,
  from = new Date()
): Date {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AppError("dayOfWeek deve estar entre 0 e 6");
  }
  if (Number.isNaN(from.getTime())) {
    throw new AppError("Data de referência inválida");
  }

  // Esta função é um helper determinístico de calendário: normaliza a
  // ocorrência para 00:00 UTC. A listagem HTTP usa datas ISO locais
  // explicitamente e não depende deste Date para decidir o "dia de hoje".
  const result = new Date(from);
  result.setUTCHours(0, 0, 0, 0);
  const difference = (dayOfWeek - result.getUTCDay() + 7) % 7;
  result.setUTCDate(result.getUTCDate() + difference);
  return result;
}

export class ReminderService {
  constructor(
    private repository: IRepository<Reminder> = new ReminderRepository()
  ) {}

  async create(data: CreateReminderDTO): Promise<Reminder> {
    validateCreateShape(data);
    return this.repository.create(normalizeReminder(data));
  }

  async list(): Promise<Reminder[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Reminder> {
    const reminder = await this.repository.findById(id);
    if (!reminder) {
      throw new AppError("Lembrete não encontrado", 404);
    }
    return reminder;
  }

  async update(id: string, data: UpdateReminderDTO): Promise<Reminder> {
    validateUpdateShape(data);
    const current = await this.findById(id);
    const recurrence = data.recurrence ?? current.recurrence;

    if (
      recurrence === ReminderRecurrence.RECORRENTE_SEMANAL &&
      Object.prototype.hasOwnProperty.call(data, "date") &&
      data.date !== undefined
    ) {
      throw new AppError(
        "Lembrete recorrente semanal não deve informar date"
      );
    }
    if (
      recurrence === ReminderRecurrence.UNICO &&
      Object.prototype.hasOwnProperty.call(data, "dayOfWeek") &&
      data.dayOfWeek !== undefined
    ) {
      throw new AppError("Lembrete único não deve informar dayOfWeek");
    }

    const merged: CreateReminderDTO = {
      description: data.description ?? current.description,
      type: data.type ?? current.type,
      recurrence,
      time: data.time ?? current.time,
      ...(recurrence === ReminderRecurrence.UNICO
        ? { date: data.date ?? current.date }
        : { dayOfWeek: data.dayOfWeek ?? current.dayOfWeek }),
    };

    const normalized = normalizeReminder(merged);
    const updated = await this.repository.update(id, {
      ...normalized,
      date:
        normalized.recurrence === ReminderRecurrence.UNICO
          ? normalized.date
          : undefined,
      dayOfWeek:
        normalized.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL
          ? normalized.dayOfWeek
          : undefined,
    });

    if (!updated) {
      throw new AppError("Lembrete não encontrado", 404);
    }
    return updated;
  }

  async listUpcoming(
    days = 7,
    referenceDate: Date | string = new Date()
  ): Promise<Reminder[]> {
    if (!Number.isInteger(days) || days <= 0) {
      throw new AppError(
        "A quantidade de dias deve ser um inteiro positivo"
      );
    }

    let start: string;
    if (typeof referenceDate === "string") {
      if (!isValidISODate(referenceDate)) {
        throw new AppError("Data de referência inválida; use YYYY-MM-DD");
      }
      start = referenceDate;
    } else {
      if (Number.isNaN(referenceDate.getTime())) {
        throw new AppError("Data de referência inválida");
      }
      start = getLocalISODate(referenceDate);
    }

    const reminders = await this.repository.findAll();
    const limit = addDays(start, days - 1);
    const currentDay = new Date(`${start}T00:00:00.000Z`).getUTCDay();

    return reminders
      .flatMap((reminder) => {
        let occurrence: string | null = null;

        if (
          reminder.recurrence === ReminderRecurrence.UNICO &&
          reminder.date &&
          reminder.date >= start &&
          reminder.date <= limit
        ) {
          occurrence = reminder.date;
        } else if (
          reminder.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL &&
          reminder.dayOfWeek !== undefined
        ) {
          const difference =
            (reminder.dayOfWeek - currentDay + 7) % 7;
          const candidate = addDays(start, difference);
          if (candidate <= limit) occurrence = candidate;
        }

        return occurrence ? [{ reminder, occurrence }] : [];
      })
      .sort(
        (first, second) =>
          first.occurrence.localeCompare(second.occurrence) ||
          (first.reminder.time ?? "99:99").localeCompare(
            second.reminder.time ?? "99:99"
          ) ||
          first.reminder.description.localeCompare(
            second.reminder.description
          )
      )
      .map(({ reminder }) => reminder);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError("Lembrete não encontrado", 404);
    }
  }
}

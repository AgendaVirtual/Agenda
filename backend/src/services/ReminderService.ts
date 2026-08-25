import { CreateReminderDTO, Reminder } from "../types/entities";
import { ReminderRepository } from "../repositories/ReminderRepository";
import {
  ReminderRecurrence,
  ReminderType,
} from "../types/enums";
import { AppError } from "../utils/errors";
import { addDays, getLocalISODate, isValidISODate } from "../utils/reportCalculations";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isEnumValue<T extends string>(
  enumObject: Record<string, T>,
  value: unknown
): value is T {
  return typeof value === "string" && Object.values(enumObject).includes(value as T);
}

function validateReminderFields(data: CreateReminderDTO): void {
  if (typeof data.description !== "string" || data.description.trim().length === 0) {
    throw new AppError("Descrição é obrigatória");
  }

  if (!isEnumValue(ReminderType, data.type)) {
    throw new AppError("Tipo de lembrete inválido");
  }

  if (!isEnumValue(ReminderRecurrence, data.recurrence)) {
    throw new AppError("Recorrência inválida");
  }

  if (data.time !== undefined && !TIME_PATTERN.test(data.time)) {
    throw new AppError("Horário deve estar no formato HH:mm");
  }

  if (data.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL) {
    if (!Number.isInteger(data.dayOfWeek) || data.dayOfWeek! < 0 || data.dayOfWeek! > 6) {
      throw new AppError("Lembrete recorrente exige dayOfWeek entre 0 e 6");
    }
    if (data.date !== undefined) {
      throw new AppError("Lembrete recorrente semanal não deve informar date");
    }
  }

  if (data.recurrence === ReminderRecurrence.UNICO) {
    if (!data.date || !isValidISODate(data.date)) {
      throw new AppError("Lembrete único exige uma data válida em YYYY-MM-DD");
    }
    if (data.dayOfWeek !== undefined) {
      throw new AppError("Lembrete único não deve informar dayOfWeek");
    }
  }
}

// Calcula a próxima data em que um lembrete recorrente vai ocorrer.
export function getNextOccurrence(dayOfWeek: number, from = new Date()): Date {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AppError("dayOfWeek deve estar entre 0 e 6");
  }

  const result = new Date(from);
  const diff = (dayOfWeek - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + (diff === 0 ? 7 : diff));
  return result;
}

export class ReminderService {
  constructor(private repository = new ReminderRepository()) {}

  async create(data: CreateReminderDTO): Promise<Reminder> {
    validateReminderFields(data);
    return this.repository.create({
      description: data.description.trim(),
      type: data.type,
      recurrence: data.recurrence,
      dayOfWeek: data.dayOfWeek,
      date: data.date,
      time: data.time,
    });
  }

  async list(): Promise<Reminder[]> {
    return this.repository.findAll();
  }

  async listUpcoming(days = 7): Promise<Reminder[]> {
    if (!Number.isInteger(days) || days < 0) {
      throw new AppError("Quantidade de dias deve ser um inteiro não negativo");
    }

    const all = await this.repository.findAll();
    const now = new Date();
    const today = getLocalISODate(now);
    const limitDate = addDays(today, days);

    return all.filter((reminder) => {
      if (reminder.recurrence === ReminderRecurrence.UNICO && reminder.date) {
        return reminder.date >= today && reminder.date <= limitDate;
      }
      if (
        reminder.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL &&
        reminder.dayOfWeek !== undefined
      ) {
        const diff = (reminder.dayOfWeek - now.getDay() + 7) % 7;
        const occurrenceDate = addDays(today, diff === 0 ? 7 : diff);
        return occurrenceDate <= limitDate;
      }
      return false;
    });
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new AppError("Lembrete não encontrado", 404);
  }
}

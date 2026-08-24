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

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidISODate(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }

  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function normalizeReminder(
  data: CreateReminderDTO
): Omit<Reminder, "id"> {
  if (!data) {
    throw new AppError(
      "Dados do lembrete são obrigatórios"
    );
  }

  const description =
    typeof data.description === "string"
      ? data.description.trim()
      : "";

  if (!description) {
    throw new AppError(
      "Descrição do lembrete é obrigatória"
    );
  }

  if (!Object.values(ReminderType).includes(data.type)) {
    throw new AppError("Tipo de lembrete inválido");
  }

  if (
    !Object.values(ReminderRecurrence).includes(
      data.recurrence
    )
  ) {
    throw new AppError(
      "Recorrência do lembrete inválida"
    );
  }

  if (
    data.time !== undefined &&
    (
      typeof data.time !== "string" ||
      !TIME_PATTERN.test(data.time)
    )
  ) {
    throw new AppError(
      "Horário do lembrete deve estar no formato HH:mm"
    );
  }

  if (
    data.recurrence ===
    ReminderRecurrence.RECORRENTE_SEMANAL
  ) {
    if (
      data.dayOfWeek === undefined ||
      !Number.isInteger(data.dayOfWeek) ||
      data.dayOfWeek < 0 ||
      data.dayOfWeek > 6
    ) {
      throw new AppError(
        "Lembrete recorrente exige dayOfWeek entre 0 e 6"
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

  return {
    description,
    type: data.type,
    recurrence: data.recurrence,
    date: data.date,
    time: data.time,
  };
}

export function validateReminderFields(
  data: CreateReminderDTO
): void {
  normalizeReminder(data);
}

export function getNextOccurrence(
  dayOfWeek: number,
  from = new Date()
): Date {
  if (
    !Number.isInteger(dayOfWeek) ||
    dayOfWeek < 0 ||
    dayOfWeek > 6
  ) {
    throw new AppError(
      "dayOfWeek deve estar entre 0 e 6"
    );
  }

  if (Number.isNaN(from.getTime())) {
    throw new AppError(
      "Data de referência inválida"
    );
  }

  const result = new Date(from);

  result.setUTCHours(0, 0, 0, 0);

  const difference =
    (dayOfWeek - result.getUTCDay() + 7) % 7;

  result.setUTCDate(
    result.getUTCDate() + difference
  );

  return result;
}

export class ReminderService {
  constructor(
    private repository: IRepository<Reminder> =
      new ReminderRepository()
  ) {}

  async create(
    data: CreateReminderDTO
  ): Promise<Reminder> {
    const normalized = normalizeReminder(data);

    return this.repository.create(normalized);
  }

  async list(): Promise<Reminder[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<Reminder> {
    const reminder =
      await this.repository.findById(id);

    if (!reminder) {
      throw new AppError(
        "Lembrete não encontrado",
        404
      );
    }

    return reminder;
  }

  async update(
    id: string,
    data: UpdateReminderDTO
  ): Promise<Reminder> {
    const current = await this.findById(id);

    const normalized = normalizeReminder({
      ...current,
      ...data,
    });

    const updated = await this.repository.update(
      id,
      {
        ...normalized,

        date:
          normalized.recurrence ===
          ReminderRecurrence.UNICO
            ? normalized.date
            : undefined,

        dayOfWeek:
          normalized.recurrence ===
          ReminderRecurrence.RECORRENTE_SEMANAL
            ? normalized.dayOfWeek
            : undefined,
      }
    );

    if (!updated) {
      throw new AppError(
        "Lembrete não encontrado",
        404
      );
    }

    return updated;
  }

  async listUpcoming(
    days = 7,
    from = new Date()
  ): Promise<Reminder[]> {
    if (
      !Number.isInteger(days) ||
      days <= 0
    ) {
      throw new AppError(
        "A quantidade de dias deve ser um inteiro positivo"
      );
    }

    if (Number.isNaN(from.getTime())) {
      throw new AppError(
        "Data de referência inválida"
      );
    }

    const reminders =
      await this.repository.findAll();

    const start = new Date(from);

    start.setUTCHours(0, 0, 0, 0);

    const limit = new Date(start);

    limit.setUTCDate(
      limit.getUTCDate() + days - 1
    );

    return reminders
      .flatMap((reminder) => {
        if (
          reminder.recurrence ===
            ReminderRecurrence.UNICO &&
          reminder.date
        ) {
          const occurrence = new Date(
            `${reminder.date}T00:00:00.000Z`
          );

          if (
            occurrence >= start &&
            occurrence <= limit
          ) {
            return [{
              reminder,
              occurrence,
            }];
          }

          return [];
        }

        if (
          reminder.recurrence ===
            ReminderRecurrence.RECORRENTE_SEMANAL &&
          reminder.dayOfWeek !== undefined
        ) {
          const occurrence =
            getNextOccurrence(
              reminder.dayOfWeek,
              start
            );

          if (occurrence <= limit) {
            return [{
              reminder,
              occurrence,
            }];
          }
        }

        return [];
      })
      .sort(
        (first, second) =>
          first.occurrence.getTime() -
            second.occurrence.getTime() ||
          (first.reminder.time ?? "99:99")
            .localeCompare(
              second.reminder.time ?? "99:99"
            ) ||
          first.reminder.description
            .localeCompare(
              second.reminder.description
            )
      )
      .map(({ reminder }) => reminder);
  }

  async remove(id: string): Promise<void> {
    const deleted =
      await this.repository.delete(id);

    if (!deleted) {
      throw new AppError(
        "Lembrete não encontrado",
        404
      );
    }
  }
}
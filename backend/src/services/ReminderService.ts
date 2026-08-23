import { FileRepository } from "../persistence/FileRepository";
import { CreateReminderDTO, Reminder } from "../types/entities";
import { ReminderRecurrence } from "../types/enums";
import { AppError } from "../utils/errors";

export class ReminderRepository extends FileRepository<Reminder> {
  constructor() {
    super("reminders.json");
  }
}

function validateReminderFields(data: CreateReminderDTO) {
  if (data.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL && data.dayOfWeek === undefined) {
    throw new AppError("Lembrete recorrente exige dayOfWeek (0-6)");
  }
  if (data.recurrence === ReminderRecurrence.UNICO && !data.date) {
    throw new AppError("Lembrete único exige uma data (date)");
  }
}

// Calcula a próxima data em que um lembrete recorrente vai ocorrer
export function getNextOccurrence(dayOfWeek: number, from = new Date()): Date {
  const result = new Date(from);
  const diff = (dayOfWeek - result.getDay() + 7) % 7;
  result.setDate(result.getDate() + (diff === 0 ? 7 : diff));
  return result;
}

export class ReminderService {
  constructor(private repository = new ReminderRepository()) {}

  async create(data: CreateReminderDTO): Promise<Reminder> {
    validateReminderFields(data);
    return this.repository.create(data);
  }

  async listUpcoming(days = 7): Promise<Reminder[]> {
    const all = await this.repository.findAll();
    const now = new Date();
    const limit = new Date();
    limit.setDate(now.getDate() + days);

    return all.filter((r) => {
      if (r.recurrence === ReminderRecurrence.UNICO && r.date) {
        const d = new Date(r.date);
        return d >= now && d <= limit;
      }
      if (r.recurrence === ReminderRecurrence.RECORRENTE_SEMANAL && r.dayOfWeek !== undefined) {
        const next = getNextOccurrence(r.dayOfWeek, now);
        return next <= limit;
      }
      return false;
    });
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new AppError("Lembrete não encontrado", 404);
  }
}

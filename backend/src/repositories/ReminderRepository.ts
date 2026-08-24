import { FileRepository } from "../persistence/FileRepository";
import { Reminder } from "../types/entities";

/**
 * Dependência mínima do módulo de Lembretes necessária para a Pessoa 4.
 * O CRUD completo continua pertencendo à Pessoa 3.
 */
export class ReminderRepository extends FileRepository<Reminder> {
  constructor() {
    super("reminders.json");
  }
}

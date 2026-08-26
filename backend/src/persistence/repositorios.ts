import { Category, Goal, Reminder, Task } from "../types/entities";
import { FileRepository, IRepository } from "./FileRepository";
import { PgRepository } from "./PgRepository";
import { usaPostgres } from "./db";

const MAPA_CATEGORIA = {
  id: "id",
  name: "name",
  color: "color",
};

const MAPA_TAREFA = {
  id: "id",
  description: "description",
  categoryId: "category_id",
  date: "date",
  timeBlockType: "time_block_type",
  time: "time",
  shift: "shift",
  status: "status",
  priority: "priority",
};

const MAPA_META = {
  id: "id",
  description: "description",
  categoryId: "category_id",
  period: "period",
  startDate: "start_date",
  endDate: "end_date",
  status: "status",
};

const MAPA_LEMBRETE = {
  id: "id",
  description: "description",
  type: "type",
  recurrence: "recurrence",
  dayOfWeek: "day_of_week",
  date: "date",
  time: "time",
};

function escolher<T extends { id: string }>(
  tabela: string,
  mapa: Record<string, string>,
  arquivo: string
): IRepository<T> {
  return usaPostgres()
    ? new PgRepository<T>(tabela, mapa, true)
    : new FileRepository<T>(arquivo);
}

export const criarRepositorioDeCategorias = () =>
  escolher<Category>("categories", MAPA_CATEGORIA, "categories.json");

export const criarRepositorioDeTarefas = () =>
  escolher<Task>("tasks", MAPA_TAREFA, "tasks.json");

export const criarRepositorioDeMetas = () =>
  escolher<Goal>("goals", MAPA_META, "goals.json");

export const criarRepositorioDeLembretes = () =>
  escolher<Reminder>("reminders", MAPA_LEMBRETE, "reminders.json");

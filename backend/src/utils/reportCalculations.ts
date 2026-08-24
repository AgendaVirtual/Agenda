import { Goal, ReportType, Task } from "../types/entities";
import { GoalStatus, Shift, TaskStatus } from "../types/enums";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Calcula a taxa de conclusão sobre o total do período.
 * O retorno fica entre 0 e 1, conforme o contrato já usado no Agenda.
 */
export function calculateCompletionRate<T>(
  items: T[],
  isCompleted: (item: T) => boolean
): number {
  if (items.length === 0) return 0;

  const completed = items.filter(isCompleted).length;
  return roundRate(completed / items.length);
}

export function isTaskExecuted(task: Task): boolean {
  return task.status === TaskStatus.EXECUTADA;
}

export function isGoalCompleted(goal: Goal): boolean {
  return goal.status === GoalStatus.CUMPRIDA;
}

/**
 * Regra do plano: "mais produtivo" = maior taxa de conclusão,
 * e não maior volume bruto.
 *
 * Apenas tarefas com shift explícito participam do cálculo. O contrato
 * compartilhado só define Shift quando o bloco é TURNO; portanto não
 * inventamos faixas de horário para tarefas de meia hora/uma hora.
 */
export function findMostProductiveShift(tasks: Task[]): Shift | null {
  let bestShift: Shift | null = null;
  let bestRate = -1;

  for (const shift of Object.values(Shift)) {
    const tasksInShift = tasks.filter((task) => task.shift === shift);
    if (tasksInShift.length === 0) continue;

    const rate = calculateCompletionRate(tasksInShift, isTaskExecuted);
    if (rate > bestRate) {
      bestRate = rate;
      bestShift = shift;
    }
  }

  return bestShift;
}

/**
 * Encontra a semana/mês com maior taxa de tarefas executadas.
 * Em empate, mantém o primeiro período cronológico encontrado, sem usar
 * volume como desempate (para respeitar a regra de negócio do plano).
 */
export function findMostProductivePeriod(
  tasks: Task[],
  getPeriodKey: (date: string) => string
): string | null {
  const grouped = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = getPeriodKey(task.date);
    const current = grouped.get(key) ?? [];
    current.push(task);
    grouped.set(key, current);
  }

  let bestPeriod: string | null = null;
  let bestRate = -1;

  const keys = [...grouped.keys()].sort();
  for (const key of keys) {
    const rate = calculateCompletionRate(grouped.get(key) ?? [], isTaskExecuted);
    if (rate > bestRate) {
      bestRate = rate;
      bestPeriod = key;
    }
  }

  return bestPeriod;
}

/** Agrupa itens por categoria e ordena da maior para a menor quantidade. */
export function groupByCategory<T extends { categoryId: string }>(
  items: T[]
): { categoryId: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([categoryId, count]) => ({ categoryId, count }))
    .sort((a, b) => b.count - a.count || a.categoryId.localeCompare(b.categoryId));
}

/**
 * Indicador geral do painel.
 *
 * A especificação exige o indicador, mas não fixa uma fórmula. Para não
 * inventar peso de metas ou status intermediários, usamos a taxa objetiva
 * de tarefas EXECUTADAS no dia. Isso mantém o valor entre 0 e 1 e é fácil
 * de explicar/testar.
 */
export function calculateProductivityIndex(tasks: Task[]): number {
  return calculateCompletionRate(tasks, isTaskExecuted);
}

/**
 * Calcula o intervalo do relatório. A semana segue o padrão ISO:
 * segunda-feira a domingo.
 */
export function calculateReportRange(
  type: ReportType,
  referenceDate: string
): DateRange {
  const date = parseISODate(referenceDate);

  if (type === "weekly") {
    const day = date.getUTCDay(); // 0 domingo, 1 segunda ...
    const daysSinceMonday = (day + 6) % 7;

    const start = new Date(date);
    start.setUTCDate(start.getUTCDate() - daysSinceMonday);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);

    return { startDate: toISO(start), endDate: toISO(end) };
  }

  if (type === "monthly") {
    const start = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
    );
    const end = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
    );
    return { startDate: toISO(start), endDate: toISO(end) };
  }

  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), 11, 31));
  return { startDate: toISO(start), endDate: toISO(end) };
}

/** Chave de semana ISO no formato YYYY-Www. */
export function getISOWeekKey(dateISO: string): string {
  const date = parseISODate(dateISO);
  const thursday = new Date(date);

  // ISO week: a semana pertence ao ano da quinta-feira daquela semana.
  const day = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day);

  const isoYear = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDay = firstThursday.getUTCDay() || 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - firstDay);

  const week =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * MS_PER_DAY));

  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Chave de mês no formato YYYY-MM. */
export function getMonthKey(dateISO: string): string {
  return dateISO.slice(0, 7);
}

/** Validação estrita de data ISO YYYY-MM-DD. */
export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && toISO(date) === value;
}

export function addDays(dateISO: string, days: number): string {
  const date = parseISODate(dateISO);
  date.setUTCDate(date.getUTCDate() + days);
  return toISO(date);
}

function parseISODate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data ISO inválida: ${value}`);
  }
  return date;
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

import { FileRepository, IRepository } from "../persistence/FileRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { Category, CreateTaskDTO, Task } from "../types/entities";
import {
  Shift,
  TaskPriority,
  TaskRecurrence,
  TaskStatus,
  TimeBlockType,
} from "../types/enums";
import { randomUUID } from "crypto";
import { AppError } from "../utils/errors";
import { isValidISODate } from "../utils/reportCalculations";
import { criarRepositorioDeCategorias, criarRepositorioDeTarefas } from "../persistence/repositorios";

export class TaskRepository extends FileRepository<Task> {
  constructor() {
    super("tasks.json");
  }
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TASK_WRITE_FIELDS = new Set([
  "description",
  "categoryId",
  "date",
  "timeBlockType",
  "time",
  "endTime",
  "shift",
  "priority",
  "recurrence",
  "alertEnabled",
  "alertLeadMinutes",
]);

const MINUTOS_NO_DIA = 24 * 60;
const DURACAO_PADRAO = 30;
const INICIO_DA_TARDE = 12 * 60;
const INICIO_DA_NOITE = 18 * 60;

// Quantas ocorrencias materializamos quando a tarefa se repete.
const OCORRENCIAS: Record<TaskRecurrence, number> = {
  [TaskRecurrence.UNICA]: 1,
  [TaskRecurrence.DIARIA]: 30,
  [TaskRecurrence.SEMANAL]: 12,
  [TaskRecurrence.MENSAL]: 6,
};

function emMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// O turno sai do horario de inicio: quem planeja informa a hora, nao o turno.
export function turnoDoHorario(time: string): Shift {
  const minutos = emMinutos(time);
  if (minutos < INICIO_DA_TARDE) return Shift.MANHA;
  if (minutos < INICIO_DA_NOITE) return Shift.TARDE;
  return Shift.NOITE;
}

// E o bloco sai da duracao, mantendo os tres tamanhos previstos no projeto.
export function blocoDaDuracao(time: string, endTime?: string): TimeBlockType {
  if (!endTime) return TimeBlockType.MEIA_HORA;
  const duracao = emMinutos(endTime) - emMinutos(time);
  if (duracao <= DURACAO_PADRAO) return TimeBlockType.MEIA_HORA;
  if (duracao <= 60) return TimeBlockType.UMA_HORA;
  return TimeBlockType.TURNO;
}

function podeDerivar(data: Partial<CreateTaskDTO>): boolean {
  return data.timeBlockType === undefined && typeof data.time === "string";
}

function derivarBloco(data: CreateTaskDTO): CreateTaskDTO {
  const time = data.time as string;
  return {
    ...data,
    timeBlockType: blocoDaDuracao(time, data.endTime),
    shift: turnoDoHorario(time),
  };
}

function intervalo(task: { time?: string; endTime?: string }): [number, number] | null {
  if (!task.time) return null;
  const inicio = emMinutos(task.time);
  const fim = task.endTime ? emMinutos(task.endTime) : inicio + DURACAO_PADRAO;
  return [inicio, Math.min(fim, MINUTOS_NO_DIA)];
}

function somarDias(date: string, dias: number): string {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

function somarMeses(date: string, meses: number): string {
  const [ano, mes, dia] = date.split("-").map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(
    Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)
  ).getUTCDate();
  alvo.setUTCDate(Math.min(dia, ultimoDia));
  return alvo.toISOString().slice(0, 10);
}

function datasDaSerie(inicio: string, recorrencia: TaskRecurrence): string[] {
  const total = OCORRENCIAS[recorrencia];
  const datas: string[] = [];
  for (let i = 0; i < total; i += 1) {
    if (recorrencia === TaskRecurrence.DIARIA) datas.push(somarDias(inicio, i));
    else if (recorrencia === TaskRecurrence.SEMANAL) datas.push(somarDias(inicio, i * 7));
    else if (recorrencia === TaskRecurrence.MENSAL) datas.push(somarMeses(inicio, i));
    else datas.push(inicio);
  }
  return datas;
}

function validateTaskWriteShape(data: unknown, allowEmpty: boolean): void {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new AppError("Dados da tarefa são obrigatórios");
  }

  const keys = Object.keys(data);
  if (!allowEmpty && keys.length === 0) {
    throw new AppError("Informe ao menos um campo para atualizar a tarefa");
  }

  const invalid = keys.filter((key) => !TASK_WRITE_FIELDS.has(key));
  if (invalid.length > 0) {
    throw new AppError(`Campo(s) não permitido(s): ${invalid.join(", ")}`);
  }
}

function isEnumValue<T extends string>(
  enumObject: Record<string, T>,
  value: unknown
): value is T {
  return typeof value === "string" && Object.values(enumObject).includes(value as T);
}

// Garante que os dados persistidos de tarefa sejam sempre coerentes.
function validateTaskData(data: CreateTaskDTO): void {
  if (typeof data.description !== "string" || data.description.trim().length === 0) {
    throw new AppError("Descrição é obrigatória");
  }

  if (typeof data.categoryId !== "string" || data.categoryId.trim().length === 0) {
    throw new AppError("Categoria é obrigatória");
  }

  if (!isValidISODate(data.date)) {
    throw new AppError("Data deve estar no formato YYYY-MM-DD");
  }

  if (!isEnumValue(TimeBlockType, data.timeBlockType)) {
    throw new AppError("Tipo de bloco de tempo inválido");
  }

  if (!isEnumValue(TaskPriority, data.priority)) {
    throw new AppError("Prioridade inválida");
  }

  if (data.timeBlockType === TimeBlockType.TURNO) {
    if (!isEnumValue(Shift, data.shift)) {
      throw new AppError("Tarefas de turno exigem um turno (shift)");
    }
    return;
  }

  if (typeof data.time !== "string" || !TIME_PATTERN.test(data.time)) {
    throw new AppError(
      "Tarefas de meia hora ou uma hora exigem um horário (time) no formato HH:mm"
    );
  }
}

function validarJanela(data: CreateTaskDTO): void {
  if (data.endTime === undefined) return;

  if (typeof data.time !== "string") {
    throw new AppError("Para informar o fim, informe também o horário de início");
  }
  if (emMinutos(data.endTime) <= emMinutos(data.time)) {
    throw new AppError("O horário de fim precisa vir depois do de início");
  }
}

function validarAviso(data: CreateTaskDTO): void {
  if (!data.alertEnabled) return;
  if (typeof data.time !== "string") {
    throw new AppError("Só dá para avisar de uma tarefa que tem horário");
  }
}

export class TaskService {
  constructor(
    private repository: IRepository<Task> = criarRepositorioDeTarefas(),
    private categoryRepository: IRepository<Category> = criarRepositorioDeCategorias()
  ) {}

  // Garante que a categoria informada realmente existe (integração com P3)
  private async validateCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new AppError(`Categoria "${categoryId}" não existe`);
    }
  }

  // Detecta conflito de horário no mesmo dia, comparando as janelas inteiras.
  private conferirJanelaLivre(
    existentes: Task[],
    data: CreateTaskDTO,
    ignoreId?: string
  ): void {
    const nova = intervalo(data);
    if (!nova) return;

    const conflito = existentes.some((task) => {
      if (task.date !== data.date || task.id === ignoreId) return false;
      const atual = intervalo(task);
      return atual !== null && nova[0] < atual[1] && atual[0] < nova[1];
    });

    if (conflito) {
      throw new AppError("Já existe uma tarefa nesse mesmo horário e dia");
    }
  }

  private async checkOverlap(
    data: CreateTaskDTO,
    ignoreId?: string
  ): Promise<void> {
    if (!data.time) return;
    this.conferirJanelaLivre(await this.repository.findAll(), data, ignoreId);
  }

  async create(data: CreateTaskDTO): Promise<Task> {
    validateTaskWriteShape(data, true);

    const derivado = podeDerivar(data);
    const preparado = derivado ? derivarBloco(data) : data;

    validateTaskData(preparado);
    validarJanela(preparado);
    validarAviso(preparado);
    await this.validateCategoryExists(preparado.categoryId);

    const normalized = derivado
      ? preparado
      : this.normalizeTimeBlock(preparado);

    const recorrencia = normalized.recurrence ?? TaskRecurrence.UNICA;
    const datas = datasDaSerie(normalized.date, recorrencia);
    const grupo =
      recorrencia === TaskRecurrence.UNICA ? undefined : randomUUID();

    const existentes = await this.repository.findAll();
    this.conferirJanelaLivre(existentes, { ...normalized, date: datas[0] });

    const base = {
      description: normalized.description.trim(),
      categoryId: normalized.categoryId.trim(),
      timeBlockType: normalized.timeBlockType,
      time: normalized.time,
      endTime: normalized.endTime,
      shift: normalized.shift,
      priority: normalized.priority,
      status: TaskStatus.PENDENTE,
      recurrence: recorrencia,
      recurrenceGroupId: grupo,
      alertEnabled: normalized.alertEnabled ?? false,
      alertLeadMinutes: normalized.alertLeadMinutes ?? DURACAO_PADRAO,
    };

    const primeira = await this.repository.create({ ...base, date: datas[0] });

    // Ocorrencia que esbarra em algo ja marcado fica de fora, em vez de
    // derrubar a serie inteira.
    for (const data of datas.slice(1)) {
      try {
        this.conferirJanelaLivre(existentes, { ...normalized, date: data });
      } catch {
        continue;
      }
      const criada = await this.repository.create({ ...base, date: data });
      existentes.push(criada);
    }

    return primeira;
  }

  async listByDate(date?: string): Promise<Task[]> {
    if (date && !isValidISODate(date)) {
      throw new AppError("Data deve estar no formato YYYY-MM-DD");
    }

    const all = await this.repository.findAll();
    const filtered = date ? all.filter((task) => task.date === date) : all;
    return this.sortByPriority(filtered);
  }

  async update(id: string, data: Partial<CreateTaskDTO>): Promise<Task> {
    // Defesa em profundidade: mesmo se alguém chamar o service sem passar
    // pelo controller, id e status continuam imutáveis por esta operação.
    const unsafeData = data as Partial<Task>;
    if (Object.prototype.hasOwnProperty.call(unsafeData, "id")) {
      throw new AppError("O id da tarefa não pode ser alterado");
    }
    if (Object.prototype.hasOwnProperty.call(unsafeData, "status")) {
      throw new AppError(
        "O status deve ser alterado pela rota específica de status"
      );
    }
    validateTaskWriteShape(data, false);

    const current = await this.repository.findById(id);
    if (!current) throw new AppError("Tarefa não encontrada", 404);

    const hasField = (field: keyof CreateTaskDTO): boolean =>
      Object.prototype.hasOwnProperty.call(data, field);

    // Usamos presença real da propriedade (e não ??) para que null/undefined
    // maliciosos não sejam silenciosamente substituídos pelo valor antigo.
    const merged = {
      description: hasField("description") ? data.description : current.description,
      categoryId: hasField("categoryId") ? data.categoryId : current.categoryId,
      date: hasField("date") ? data.date : current.date,
      timeBlockType: hasField("timeBlockType")
        ? data.timeBlockType
        : current.timeBlockType,
      time: hasField("time") ? data.time : current.time,
      endTime: hasField("endTime") ? data.endTime : current.endTime,
      shift: hasField("shift") ? data.shift : current.shift,
      priority: hasField("priority") ? data.priority : current.priority,
      recurrence: hasField("recurrence") ? data.recurrence : current.recurrence,
      alertEnabled: hasField("alertEnabled")
        ? data.alertEnabled
        : current.alertEnabled,
      alertLeadMinutes: hasField("alertLeadMinutes")
        ? data.alertLeadMinutes
        : current.alertLeadMinutes,
    } as CreateTaskDTO;

    // Tres caminhos: quem mexeu no horario tem bloco e turno rededuzidos;
    // quem mandou o bloco na mao segue a normalizacao antiga; e quem nao
    // tocou em nenhum dos dois fica exatamente como estava - senao uma
    // edicao de descricao apagaria o horario de uma tarefa de turno.
    const blocoNaMao = hasField("timeBlockType");
    const rededuzir =
      !blocoNaMao &&
      (hasField("time") || hasField("endTime")) &&
      typeof merged.time === "string";

    const normalized = rededuzir
      ? derivarBloco({ ...merged, timeBlockType: undefined as never })
      : blocoNaMao
        ? this.normalizeTimeBlock(merged)
        : merged;

    validateTaskData(normalized);
    validarJanela(normalized);
    validarAviso(normalized);
    await this.validateCategoryExists(normalized.categoryId);
    await this.checkOverlap(normalized, id);

    const updateData: Partial<Task> = {
      description: normalized.description.trim(),
      categoryId: normalized.categoryId.trim(),
      timeBlockType: normalized.timeBlockType,
      time: normalized.time,
      endTime: normalized.endTime,
      shift: normalized.shift,
      priority: normalized.priority,
      date: normalized.date,
      recurrence: normalized.recurrence,
      alertEnabled: normalized.alertEnabled,
      alertLeadMinutes: normalized.alertLeadMinutes,
    };

    const updated = await this.repository.update(id, updateData);
    if (!updated) throw new AppError("Tarefa não encontrada", 404);
    return updated;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    if (!isEnumValue(TaskStatus, status)) {
      throw new AppError("Status da tarefa inválido");
    }

    const updated = await this.repository.update(id, { status });
    if (!updated) throw new AppError("Tarefa não encontrada", 404);
    return updated;
  }

  async remove(id: string, escopo: "unica" | "serie" = "unica"): Promise<number> {
    const atual = await this.repository.findById(id);
    if (!atual) throw new AppError("Tarefa não encontrada", 404);

    if (escopo === "serie" && atual.recurrenceGroupId) {
      const serie = (await this.repository.findAll()).filter(
        (task) => task.recurrenceGroupId === atual.recurrenceGroupId
      );
      for (const task of serie) await this.repository.delete(task.id);
      return serie.length;
    }

    await this.repository.delete(id);
    return 1;
  }

  private normalizeTimeBlock(data: CreateTaskDTO): CreateTaskDTO {
    if (data.timeBlockType === TimeBlockType.TURNO) {
      return { ...data, time: undefined, endTime: undefined };
    }
    return { ...data, shift: undefined };
  }

  private sortByPriority(tasks: Task[]): Task[] {
    const order = { ALTA: 0, MEDIA: 1, BAIXA: 2 } as const;
    return [...tasks].sort((a, b) => order[a.priority] - order[b.priority]);
  }
}

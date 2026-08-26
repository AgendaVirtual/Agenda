import { FileRepository, IRepository } from "../persistence/FileRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { Category, CreateTaskDTO, Task } from "../types/entities";
import { Shift, TaskPriority, TaskStatus, TimeBlockType } from "../types/enums";
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
  "shift",
  "priority",
]);

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

  // Detecta conflito de horário no mesmo dia.
  private async checkOverlap(
    data: CreateTaskDTO,
    ignoreId?: string
  ): Promise<void> {
    if (!data.time) return;
    const sameDay = (await this.repository.findAll()).filter(
      (task) => task.date === data.date && task.id !== ignoreId
    );
    const conflict = sameDay.some((task) => task.time === data.time);
    if (conflict) {
      throw new AppError("Já existe uma tarefa nesse mesmo horário e dia");
    }
  }

  async create(data: CreateTaskDTO): Promise<Task> {
    validateTaskWriteShape(data, true);
    validateTaskData(data);
    await this.validateCategoryExists(data.categoryId);
    await this.checkOverlap(data);

    const normalized = this.normalizeTimeBlock(data);
    return this.repository.create({
      description: normalized.description.trim(),
      categoryId: normalized.categoryId.trim(),
      date: normalized.date,
      timeBlockType: normalized.timeBlockType,
      time: normalized.time,
      shift: normalized.shift,
      priority: normalized.priority,
      status: TaskStatus.PENDENTE,
    });
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
      shift: hasField("shift") ? data.shift : current.shift,
      priority: hasField("priority") ? data.priority : current.priority,
    } as CreateTaskDTO;

    const normalized = this.normalizeTimeBlock(merged);
    validateTaskData(normalized);
    await this.validateCategoryExists(normalized.categoryId);
    await this.checkOverlap(normalized, id);

    const updateData: Partial<Task> = {
      description: normalized.description.trim(),
      categoryId: normalized.categoryId.trim(),
      timeBlockType: normalized.timeBlockType,
      time: normalized.time,
      shift: normalized.shift,
      priority: normalized.priority,
      date: normalized.date,
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

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new AppError("Tarefa não encontrada", 404);
  }

  private normalizeTimeBlock(data: CreateTaskDTO): CreateTaskDTO {
    if (data.timeBlockType === TimeBlockType.TURNO) {
      return { ...data, time: undefined };
    }
    return { ...data, shift: undefined };
  }

  private sortByPriority(tasks: Task[]): Task[] {
    const order = { ALTA: 0, MEDIA: 1, BAIXA: 2 } as const;
    return [...tasks].sort((a, b) => order[a.priority] - order[b.priority]);
  }
}

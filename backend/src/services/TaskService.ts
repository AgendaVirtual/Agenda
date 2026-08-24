import { FileRepository } from "../persistence/FileRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { CreateTaskDTO, Task } from "../types/entities";
import { TaskStatus, TimeBlockType } from "../types/enums";
import { AppError } from "../utils/errors";

export class TaskRepository extends FileRepository<Task> {
  constructor() {
    super("tasks.json");
  }
}

// Garante que time ou shift seja coerente com timeBlockType
function validateTimeBlock(data: CreateTaskDTO) {
  if (
    (data.timeBlockType === TimeBlockType.MEIA_HORA ||
      data.timeBlockType === TimeBlockType.UMA_HORA) &&
    !data.time
  ) {
    throw new AppError(
      "Tarefas de meia hora ou uma hora exigem um horário (time)"
    );
  }
  if (data.timeBlockType === TimeBlockType.TURNO && !data.shift) {
    throw new AppError("Tarefas de turno exigem um turno (shift)");
  }
}

export class TaskService {
  constructor(
    private repository = new TaskRepository(),
    private categoryRepository = new CategoryRepository()
  ) {}

  // Garante que a categoria informada realmente existe (integração com P3)
  private async validateCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new AppError(`Categoria "${categoryId}" não existe`);
    }
  }

  // Detecta conflito de horário no mesmo dia
  private async checkOverlap(
    data: CreateTaskDTO,
    ignoreId?: string
  ): Promise<void> {
    if (!data.time) return;
    const sameDay = (await this.repository.findAll()).filter(
      (t) => t.date === data.date && t.id !== ignoreId
    );
    const conflict = sameDay.some((t) => t.time === data.time);
    if (conflict) {
      throw new AppError(
        "Já existe uma tarefa nesse mesmo horário e dia"
      );
    }
  }

  async create(data: CreateTaskDTO): Promise<Task> {
    validateTimeBlock(data);
    await this.validateCategoryExists(data.categoryId);
    await this.checkOverlap(data);
    return this.repository.create({ ...data, status: TaskStatus.PENDENTE });
  }

  async listByDate(date?: string): Promise<Task[]> {
    const all = await this.repository.findAll();
    const filtered = date ? all.filter((t) => t.date === date) : all;
    return this.sortByPriority(filtered);
  }

  async update(id: string, data: Partial<Task>): Promise<Task> {
    const updated = await this.repository.update(id, data);
    if (!updated) throw new AppError("Tarefa não encontrada", 404);
    return updated;
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const updated = await this.repository.update(id, { status });
    if (!updated) throw new AppError("Tarefa não encontrada", 404);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new AppError("Tarefa não encontrada", 404);
  }

  private sortByPriority(tasks: Task[]): Task[] {
    const order = { ALTA: 0, MEDIA: 1, BAIXA: 2 } as const;
    return [...tasks].sort((a, b) => order[a.priority] - order[b.priority]);
  }
}
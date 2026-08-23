import { useEffect, useMemo, useState } from "react";
import { TaskCard } from "../components/TaskCard";
import { TaskForm } from "../components/TaskForm";
import { getCategories } from "../services/categoryApi";
import {
  createTask,
  deleteTask,
  getTasksByDate,
  updateTask,
  updateTaskStatus,
} from "../services/taskApi";
import type { Category, CreateTaskDTO, Task } from "../types/entities";
import { Shift, TaskStatus, TimeBlockType } from "../types/enums";
import { formatDateLabel, todayISO } from "../utils/date";

const SHIFT_ORDER = [Shift.MANHA, Shift.TARDE, Shift.NOITE] as const;

const SHIFT_LABELS: Record<Shift, string> = {
  [Shift.MANHA]: "Manhã",
  [Shift.TARDE]: "Tarde",
  [Shift.NOITE]: "Noite",
};

// Turnos MEIA_HORA/UMA_HORA são alocados no turno correspondente ao horário;
// tarefas TURNO caem diretamente no turno escolhido pelo usuário.
function shiftForTime(time: string): Shift {
  const hour = Number(time.split(":")[0]);
  if (hour < 12) return Shift.MANHA;
  if (hour < 18) return Shift.TARDE;
  return Shift.NOITE;
}

function groupTasksByBlock(tasks: Task[]): Record<Shift, Task[]> {
  const groups: Record<Shift, Task[]> = {
    [Shift.MANHA]: [],
    [Shift.TARDE]: [],
    [Shift.NOITE]: [],
  };

  for (const task of tasks) {
    const shift =
      task.timeBlockType === TimeBlockType.TURNO && task.shift
        ? task.shift
        : shiftForTime(task.time ?? "00:00");
    groups[shift].push(task);
  }

  for (const shift of SHIFT_ORDER) {
    groups[shift].sort((a, b) => {
      if (a.timeBlockType === TimeBlockType.TURNO) return -1;
      if (b.timeBlockType === TimeBlockType.TURNO) return 1;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
  }

  return groups;
}

export function DailyPlannerPage() {
  const [date, setDate] = useState(todayISO());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  useEffect(() => {
    getCategories().then(setCategories).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setLoading(true);
    getTasksByDate(date)
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const visibleTasks = useMemo(
    () =>
      categoryFilter
        ? tasks.filter((t) => t.categoryId === categoryFilter)
        : tasks,
    [tasks, categoryFilter]
  );

  const grouped = useMemo(() => groupTasksByBlock(visibleTasks), [visibleTasks]);

  async function handleCreateTask(data: CreateTaskDTO) {
    try {
      const task = await createTask(data);
      setTasks((prev) => [...prev, task]);
      setFormOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar tarefa");
    }
  }

  async function handleUpdateTask(id: string, data: CreateTaskDTO) {
    try {
      const task = await updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      setEditingTask(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar tarefa");
    }
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    try {
      const task = await updateTaskStatus(id, status);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar status"
      );
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover tarefa");
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-xl font-bold text-slate-800">
          Planejamento diário
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todas as categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setFormOpen((open) => !open);
            }}
            className="ml-auto rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nova tarefa
          </button>
        </div>
        <p className="text-sm capitalize text-slate-500">
          {formatDateLabel(date)}
        </p>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {formOpen && (
        <TaskForm
          date={date}
          categories={categories}
          onSubmit={handleCreateTask}
          onCancel={() => setFormOpen(false)}
        />
      )}

      {editingTask && (
        <TaskForm
          date={date}
          categories={categories}
          initialTask={editingTask}
          onSubmit={(data) => handleUpdateTask(editingTask.id, data)}
          onCancel={() => setEditingTask(null)}
        />
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando tarefas...</p>
      ) : visibleTasks.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhuma tarefa planejada para este dia.
        </p>
      ) : (
        SHIFT_ORDER.map((shift) =>
          grouped[shift].length === 0 ? null : (
            <section key={shift} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-slate-600">
                {SHIFT_LABELS[shift]}
              </h2>
              <div className="flex flex-col gap-2">
                {grouped[shift].map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    category={categoriesById.get(task.categoryId)}
                    onStatusChange={(status) =>
                      handleStatusChange(task.id, status)
                    }
                    onEdit={() => {
                      setFormOpen(false);
                      setEditingTask(task);
                    }}
                    onDelete={() => handleDeleteTask(task.id)}
                  />
                ))}
              </div>
            </section>
          )
        )
      )}
    </div>
  );
}

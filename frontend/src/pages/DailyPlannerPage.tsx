import { Fragment, useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/AppShell";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { TaskRow } from "../components/TaskRow";
import { TaskForm } from "../components/TaskForm";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
} from "../components/ui/Feedback";
import { TextInput, SelectInput } from "../components/ui/Field";
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
import { addDays, formatDateLabel, taskTimeKey, todayISO } from "../utils/date";
import { plural, SHIFT_LABELS } from "../utils/labels";
import {
  aoMudarPreferencias,
  lerPreferencias,
  type FaixasDeTurno,
} from "../services/preferencias";

const SHIFT_ORDER = [Shift.MANHA, Shift.TARDE, Shift.NOITE] as const;

function shiftForTime(time: string, turnos: FaixasDeTurno): Shift {
  const hour = Number(time.split(":")[0]);
  if (hour < turnos.tarde) return Shift.MANHA;
  if (hour < turnos.noite) return Shift.TARDE;
  return Shift.NOITE;
}

function shiftOf(task: Task, turnos: FaixasDeTurno): Shift {
  if (task.timeBlockType === TimeBlockType.TURNO && task.shift) {
    return task.shift;
  }
  return shiftForTime(task.time ?? "00:00", turnos);
}

function groupTasksByShift(
  tasks: Task[],
  turnos: FaixasDeTurno,
): Record<Shift, Task[]> {
  const groups: Record<Shift, Task[]> = {
    [Shift.MANHA]: [],
    [Shift.TARDE]: [],
    [Shift.NOITE]: [],
  };

  for (const task of tasks) groups[shiftOf(task, turnos)].push(task);

  for (const shift of SHIFT_ORDER) {
    groups[shift].sort((a, b) => {
      const aIsShift = a.timeBlockType === TimeBlockType.TURNO;
      const bIsShift = b.timeBlockType === TimeBlockType.TURNO;
      if (aIsShift !== bIsShift) return aIsShift ? -1 : 1;
      return taskTimeKey(a).localeCompare(taskTimeKey(b));
    });
  }

  return groups;
}

function currentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

function NowMarker() {
  return (
    <li
      className="flex items-center gap-3 px-3 py-2"
      role="separator"
      aria-label={`Agora, ${currentTimeHHMM()}`}
    >
      <span className="tabular w-14 shrink-0 text-sm font-medium text-accent">
        {currentTimeHHMM()}
      </span>
      <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-accent" />
      <span className="h-px flex-1 bg-accent/40" />
    </li>
  );
}

export function DailyPlannerPage() {
  const [date, setDate] = useState(todayISO());

  const [turnos, setTurnos] = useState(() => lerPreferencias().turnos);

  useEffect(() => aoMudarPreferencias((p) => setTurnos(p.turnos)), []);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  const [newTaskId, setNewTaskId] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    setEditingTask(null);
    setFormOpen(false);
    setNewTaskId(null);

    getTasksByDate(date)
      .then((data) => active && setTasks(data))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [date]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const visibleTasks = useMemo(
    () =>
      categoryFilter
        ? tasks.filter((t) => t.categoryId === categoryFilter)
        : tasks,
    [tasks, categoryFilter],
  );

  const grouped = useMemo(
    () => groupTasksByShift(visibleTasks, turnos),
    [visibleTasks, turnos],
  );

  const nowMarker = useMemo(() => {
    if (date !== todayISO()) return null;
    const nowKey = currentTimeHHMM();
    const shift = shiftForTime(nowKey, turnos);
    const list = grouped[shift];
    const index = list.findIndex((task) => taskTimeKey(task) > nowKey);
    return { shift, index: index === -1 ? list.length : index };
  }, [date, grouped, turnos]);

  const shiftOffset = useMemo(() => {
    let running = 0;
    const offsets = {} as Record<Shift, number>;
    for (const shift of SHIFT_ORDER) {
      offsets[shift] = running;
      running += grouped[shift].length;
    }
    return offsets;
  }, [grouped]);

  const doneCount = visibleTasks.filter(
    (t) => t.status === TaskStatus.EXECUTADA,
  ).length;

  function closeForm() {
    setFormOpen(false);
    setEditingTask(null);
  }

  async function handleCreateTask(data: CreateTaskDTO) {
    try {
      const task = await createTask(data);
      setTasks((prev) => [...prev, task]);
      setNewTaskId(task.id);
      setFormOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu para criar a tarefa.");
    }
  }

  async function handleUpdateTask(id: string, data: CreateTaskDTO) {
    try {
      const task = await updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      setEditingTask(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu para salvar a tarefa.");
    }
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    try {
      const task = await updateTaskStatus(id, status);
      setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu para mudar o status da tarefa.");
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não deu para remover a tarefa.");
    }
  }

  return (
    <>
      <PageHeader
        title="Meu dia"
        description={formatDateLabel(date)}
        badge={
          date === todayISO() ? <Badge tone="accent">Hoje</Badge> : undefined
        }
        action={
          <Button
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            Nova tarefa
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDate((d) => addDays(d, -1))}
        >
          Dia anterior
        </Button>

        <TextInput
          type="date"
          aria-label="Escolher data"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth={false}
          variant="subtle"
          className="min-w-0 flex-1 sm:flex-none"
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDate((d) => addDays(d, 1))}
        >
          Próximo dia
        </Button>

        {date !== todayISO() && (
          <Button variant="ghost" size="sm" onClick={() => setDate(todayISO())}>
            Voltar para hoje
          </Button>
        )}

        <SelectInput
          aria-label="Filtrar por categoria"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          fullWidth={false}
          variant="subtle"
          className="w-full sm:ml-auto sm:w-auto"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectInput>
      </div>

      {!formOpen && !editingTask && error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <Modal
        open={formOpen || Boolean(editingTask)}
        onClose={closeForm}
        title={editingTask ? "Editar tarefa" : "Nova tarefa"}
        description={formatDateLabel(date)}
        error={error}
        onDismissError={() => setError(null)}
      >
        <TaskForm
          key={editingTask?.id ?? "nova"}
          date={date}
          categories={categories}
          initialTask={editingTask ?? undefined}
          onSubmit={(data) =>
            editingTask
              ? handleUpdateTask(editingTask.id, data)
              : handleCreateTask(data)
          }
          onCancel={closeForm}
        />
      </Modal>

      {loading ? (
        <LoadingState label="Carregando tarefas..." />
      ) : visibleTasks.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma tarefa planejada para este dia"
            description="Divida o dia em blocos de meia hora, uma hora ou por turno. Tarefas da mesma categoria aparecem com a mesma cor."
            action={
              <Button
                onClick={() => {
                  setEditingTask(null);
                  setFormOpen(true);
                }}
              >
                Nova tarefa
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="anim-rise-late">
          <p className="mb-3 text-sm font-light text-ink-muted">
            {doneCount} de {visibleTasks.length}{" "}
            {plural(
              visibleTasks.length,
              "tarefa concluída",
              "tarefas concluídas",
            )}
          </p>

          <div className="flex flex-col gap-6">
            {SHIFT_ORDER.map((shift) =>
              grouped[shift].length === 0 ? null : (
                <section key={shift} className="flex flex-col gap-1">
                  <h2 className="flex items-baseline gap-2 px-3">
                    <span className="text-[15px] font-semibold text-ink-strong">
                      {SHIFT_LABELS[shift]}
                    </span>
                    <span className="tabular text-[13px] font-light text-ink-faint">
                      {
                        grouped[shift].filter(
                          (t) => t.status === TaskStatus.EXECUTADA,
                        ).length
                      }{" "}
                      de {grouped[shift].length}
                    </span>
                  </h2>

                  <ul className="flex flex-col">
                    {grouped[shift].map((task, index) => (
                      <Fragment key={task.id}>
                        {nowMarker?.shift === shift &&
                          nowMarker.index === index && <NowMarker />}
                        <TaskRow
                          task={task}
                          category={categoriesById.get(task.categoryId)}
                          onStatusChange={(status: TaskStatus) =>
                            handleStatusChange(task.id, status)
                          }
                          onEdit={() => {
                            setFormOpen(false);
                            setEditingTask(task);
                          }}
                          onDelete={() => handleDeleteTask(task.id)}
                          isNew={task.id === newTaskId}
                          staggerIndex={shiftOffset[shift] + index}
                          animate={!loading}
                        />
                      </Fragment>
                    ))}
                    {nowMarker?.shift === shift &&
                      nowMarker.index === grouped[shift].length && (
                        <NowMarker />
                      )}
                  </ul>
                </section>
              ),
            )}
          </div>
        </div>
      )}
    </>
  );
}

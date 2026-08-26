import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { CategoryTag } from "../components/CategoryTag";
import { DayFocusCard } from "../components/DayFocusCard";
import { Checkbox } from "../components/ui/Checkbox";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
} from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { TaskForm } from "../components/TaskForm";
import { getTodaySummary } from "../services/dashboardApi";
import { getCategories } from "../services/categoryApi";
import {
  createTask,
  getTasksByDate,
  updateTaskStatus,
} from "../services/taskApi";
import { lerPreferencias, aoMudarPreferencias } from "../services/preferencias";
import type {
  Category,
  CreateTaskDTO,
  DashboardSummaryDTO,
  Task,
} from "../types/entities";
import { TaskStatus } from "../types/enums";
import { addDays, formatDateLabel, taskTimeKey, todayISO } from "../utils/date";
import { janelaDaTarefa } from "../utils/tempo";
import { plural, SHIFT_LABELS } from "../utils/labels";
import { useSessao } from "../services/sessaoContexto";

const RESUMO_LEMBRETES = 5;

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [concluidasOntem, setConcluidasOntem] = useState<number | null>(null);
  const [prefs, setPrefs] = useState(lerPreferencias);
  const { conta } = useSessao();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const today = todayISO();

  useEffect(() => aoMudarPreferencias(setPrefs), []);

  useEffect(() => {
    let active = true;

    Promise.all([getTodaySummary(), getTasksByDate(today), getCategories()])
      .then(([summaryData, taskData, categoryData]) => {
        if (!active) return;
        setSummary(summaryData);
        setTasks(taskData);
        setCategories(categoryData);
      })
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    getTasksByDate(addDays(today, -1))
      .then(
        (lista) =>
          active &&
          setConcluidasOntem(
            lista.filter((t) => t.status === TaskStatus.EXECUTADA).length,
          ),
      )
      .catch(() => active && setConcluidasOntem(null));

    return () => {
      active = false;
    };
  }, [today]);

  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  const tasksInOrder = [...tasks].sort((a, b) =>
    taskTimeKey(a).localeCompare(taskTimeKey(b)),
  );

  const pendentes = tasks.filter(
    (t) => t.status === TaskStatus.PENDENTE,
  ).length;

  async function criarTarefa(dados: CreateTaskDTO) {
    try {
      const nova = await createTask(dados);
      setTasks((atual) => [...atual, nova]);
      setCriando(false);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function alternarStatus(task: Task, executada: boolean) {
    const alvo = executada ? TaskStatus.EXECUTADA : TaskStatus.PENDENTE;
    const anterior = tasks;
    setTasks((atual) =>
      atual.map((t) => (t.id === task.id ? { ...t, status: alvo } : t)),
    );
    try {
      await updateTaskStatus(task.id, alvo);
    } catch (err) {
      setTasks(anterior);
      setError((err as Error).message);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <div className="mt-7 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[40px] leading-[1.1] font-light tracking-[-0.02em] text-ink">
            {saudacao()}
{conta?.name.trim() ? `, ${primeiroNome(conta.name)}` : ""}
          </h1>
          <p className="text-[15px] font-light text-ink-faint">
            {formatDateLabel(today)}
            {!loading &&
              ` · ${pendentes} ${plural(pendentes, "tarefa", "tarefas")} para fechar o dia`}
          </p>
        </div>

        <div className="flex gap-2.5">
          <Link to="/dia">
            <Button variant="secondary">Ver meu dia</Button>
          </Link>
          <Button onClick={() => setCriando(true)}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nova tarefa
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Montando seu painel..." />
      ) : summary ? (
        <div className="anim-rise-late">
          {tasks.length > 0 && (
            <DayFocusCard
              tasks={tasks}
              categoriesById={categoriesById}
              turnos={prefs.turnos}
              metasEmAndamento={summary.goalsInProgress}
              lembretes={summary.upcomingReminders.length}
              concluidasOntem={concluidasOntem}
            />
          )}

          <div className="flex flex-wrap items-start gap-x-14 gap-y-10">
            <section className="flex min-w-[min(400px,100%)] flex-[2] flex-col gap-0.5">
              <CabecalhoDeLista
                titulo="Hoje"
                acao={{ to: "/dia", texto: "Planejar o dia" }}
              />

              {tasks.length === 0 ? (
                <EmptyState
                  title="Nada planejado para hoje"
                  description="Diga a que horas cada coisa começa e o Nexo organiza o resto."
                  action={
                    <Link to="/dia">
                      <Button>Planejar o dia</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="flex flex-col">
                  {tasksInOrder.map((task) => {
                    const executada = task.status === TaskStatus.EXECUTADA;
                    const quando =
                      janelaDaTarefa(task) ??
                      (task.shift ? SHIFT_LABELS[task.shift] : null);

                    return (
                      <li
                        key={task.id}
                        className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 rounded-soft px-3 py-1 transition-colors hover:bg-canvas"
                      >
                        <Checkbox
                          checked={executada}
                          label={
                            executada
                              ? `Marcar como pendente: ${task.description}`
                              : `Marcar como executada: ${task.description}`
                          }
                          onChange={(next) => void alternarStatus(task, next)}
                        />
                        <span className="tabular w-[86px] shrink-0 text-sm text-ink-faint">
                          {quando ?? "-"}
                        </span>
                        <span
                          className={
                            "min-w-0 flex-1 basis-40 truncate text-[15px] " +
                            (executada
                              ? "text-ink-faint line-through"
                              : "text-ink")
                          }
                        >
                          {task.description}
                        </span>
                        <CategoryTag
                          category={categoriesById.get(task.categoryId)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="flex min-w-[min(280px,100%)] max-w-[420px] flex-1 flex-col gap-0.5">
              <CabecalhoDeLista
                titulo="Próximos lembretes"
                acao={{ to: "/lembretes", texto: "Ver todos" }}
              />

              {summary.upcomingReminders.length === 0 ? (
                <EmptyState
                  title="Nenhum lembrete nos próximos 7 dias"
                  description="Crie lembretes para reuniões, entregas e compromissos que se repetem."
                />
              ) : (
                <>
                  <ul className="flex flex-col">
                    {summary.upcomingReminders
                      .slice(0, RESUMO_LEMBRETES)
                      .map((reminder, index) => (
                        <li
                          key={`${reminder.description}-${index}`}
                          className="flex min-h-12 items-center justify-between gap-4 rounded-soft px-3 py-1 transition-colors hover:bg-canvas"
                        >
                          <span className="truncate text-[15px] text-ink">
                            {reminder.description}
                          </span>
                          {reminder.time && (
                            <span className="tabular shrink-0 text-sm text-ink-faint">
                              {reminder.time}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>

                  {summary.upcomingReminders.length > RESUMO_LEMBRETES && (
                    <p className="px-3 pt-2 text-[13px] text-ink-faint">
                      e mais{" "}
                      {summary.upcomingReminders.length - RESUMO_LEMBRETES}{" "}
                      {plural(
                        summary.upcomingReminders.length - RESUMO_LEMBRETES,
                        "lembrete",
                        "lembretes",
                      )}{" "}
                      nos próximos 7 dias
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      ) : null}

      <Modal
        open={criando}
        onClose={() => setCriando(false)}
        title="Nova tarefa"
        description={formatDateLabel(today)}
      >
        <TaskForm
          date={today}
          categories={categories}
          onSubmit={(dados) => void criarTarefa(dados)}
          onCancel={() => setCriando(false)}
        />
      </Modal>
    </>
  );
}

function CabecalhoDeLista({
  titulo,
  acao,
}: {
  titulo: string;
  acao: { to: string; texto: string };
}) {
  return (
    <div className="flex items-baseline justify-between px-3 pb-2.5">
      <h2 className="text-[17px] font-semibold text-ink-strong">{titulo}</h2>

      <Link
        to={acao.to}
        className="-my-3 py-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        {acao.texto}
      </Link>
    </div>
  );
}

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0];
}

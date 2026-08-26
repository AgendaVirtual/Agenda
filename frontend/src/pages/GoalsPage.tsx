import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/AppShell";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { SelectInput } from "../components/ui/Field";
import { Badge, DotBadge } from "../components/ui/Badge";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
} from "../components/ui/Feedback";
import { GoalForm } from "../components/GoalForm";
import { getCategories } from "../services/categoryApi";
import { createGoal, getGoals, updateGoalStatus } from "../services/goalApi";
import type { Category, CreateGoalDTO, Goal } from "../types/entities";
import { GoalPeriod, GoalStatus } from "../types/enums";
import { formatShortDate } from "../utils/date";
import {
  GOAL_PERIOD_LABELS,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_TONES,
} from "../utils/labels";

const PERIOD_ORDER = [
  GoalPeriod.SEMANAL,
  GoalPeriod.MENSAL,
  GoalPeriod.ANUAL,
] as const;

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periodFilter, setPeriodFilter] = useState<GoalPeriod | "">("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getGoals(periodFilter)
      .then((data) => active && setGoals(data))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [periodFilter]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const grouped = useMemo(() => {
    const map = new Map<GoalPeriod, Goal[]>();
    for (const period of PERIOD_ORDER) map.set(period, []);
    for (const goal of goals) map.get(goal.period)?.push(goal);
    return map;
  }, [goals]);

  async function handleCreate(data: CreateGoalDTO) {
    try {
      const goal = await createGoal(data);
      setGoals((prev) => [...prev, goal]);
      setFormOpen(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar meta");
    }
  }

  async function handleStatus(id: string, status: GoalStatus) {
    try {
      const updated = await updateGoalStatus(id, status);
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar meta");
    }
  }

  return (
    <>
      <PageHeader
        title="Metas"
        description="Defina o que você quer alcançar na semana, no mês e no ano - e marque o resultado quando o período fechar."
        action={<Button onClick={() => setFormOpen(true)}>Nova meta</Button>}
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Nova meta"
        description="Semana, mês ou ano - o resultado você marca quando o período fechar."
      >
        <GoalForm
          categories={categories}
          onSubmit={handleCreate}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip
          active={periodFilter === ""}
          onClick={() => setPeriodFilter("")}
        >
          Todas
        </FilterChip>
        {PERIOD_ORDER.map((period) => (
          <FilterChip
            key={period}
            active={periodFilter === period}
            onClick={() => setPeriodFilter(period)}
          >
            {GOAL_PERIOD_LABELS[period]}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Carregando metas..." />
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma meta por aqui"
            description="Comece com uma meta da semana. Metas curtas são mais fáceis de acompanhar e aparecem no painel enquanto estão em andamento."
            action={
              <Button onClick={() => setFormOpen(true)}>Nova meta</Button>
            }
          />
        </Card>
      ) : (
        <div className="anim-rise-late flex flex-col gap-5">
          {PERIOD_ORDER.map((period) => {
            const list = grouped.get(period) ?? [];
            if (list.length === 0) return null;

            return (
              <section key={period} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium tracking-wide text-ink-muted uppercase">
                  {GOAL_PERIOD_LABELS[period]}
                </h2>
                <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
                  {list.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      category={categoriesById.get(goal.categoryId)}
                      onStatusChange={(status) => handleStatus(goal.id, status)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "h-11 rounded-pill px-5 text-sm font-medium transition-colors " +
        (active
          ? "bg-ink text-white"
          : "border border-hairline bg-surface text-ink-muted hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

function GoalCard({
  goal,
  category,
  onStatusChange,
}: {
  goal: Goal;
  category?: Category;
  onStatusChange: (status: GoalStatus) => void;
}) {
  return (
    <Card padding="sm" className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base leading-snug text-ink">{goal.description}</p>
        <Badge tone={GOAL_STATUS_TONES[goal.status]}>
          {GOAL_STATUS_LABELS[goal.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {category && (
          <DotBadge color={category.color}>{category.name}</DotBadge>
        )}
        <span className="tabular text-[13px] font-light text-ink-faint">
          {formatShortDate(goal.startDate)} - {formatShortDate(goal.endDate)}
        </span>
      </div>

      <SelectInput
        aria-label={`Resultado da meta: ${goal.description}`}
        controlSize="sm"
        variant="subtle"
        value={goal.status}
        onChange={(e) => onStatusChange(e.target.value as GoalStatus)}
        className="mt-auto"
      >
        {Object.values(GoalStatus).map((status) => (
          <option key={status} value={status}>
            {GOAL_STATUS_LABELS[status]}
          </option>
        ))}
      </SelectInput>
    </Card>
  );
}

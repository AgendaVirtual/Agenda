import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/AppShell";
import { Card, SectionTitle } from "../components/ui/Card";
import {
  BarList,
  Highlight,
  Meter,
  StatTile,
  type BarDatum,
} from "../components/ui/DataViz";
import { ErrorBanner, LoadingState } from "../components/ui/Feedback";
import { getCategories } from "../services/categoryApi";
import { getReport } from "../services/reportApi";
import type {
  CategoryCountDTO,
  Category,
  ReportDTO,
  ReportType,
} from "../types/entities";
import { formatPeriodKey, formatShortDate, todayISO } from "../utils/date";
import { plural, SHIFT_LABELS } from "../utils/labels";

const TABS: { value: ReportType; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

const PERIOD_HIGHLIGHT_LABEL: Record<ReportType, string> = {
  weekly: "Semana analisada",
  monthly: "Semana mais produtiva",
  yearly: "Mês mais produtivo",
};

export function ReportsPage() {
  const [type, setType] = useState<ReportType>("weekly");
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getReport(type, todayISO())
      .then((data) => active && setReport(data))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [type]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  function toBars(counts: CategoryCountDTO[]): BarDatum[] {
    return counts.map((entry) => {
      const category = categoriesById.get(entry.categoryId);
      return {
        id: entry.categoryId,
        label: category?.name ?? "Categoria removida",
        value: entry.count,
        color: category?.color,
      };
    });
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Quanto do que você planejou saiu do papel - e onde a sua produtividade se concentra."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setType(tab.value)}
            aria-pressed={type === tab.value}
            className={
              "h-11 rounded-pill px-5 text-sm font-medium transition-colors " +
              (type === tab.value
                ? "bg-ink text-white"
                : "border border-hairline bg-surface text-ink-muted hover:text-ink")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {loading ? (
        <LoadingState label="Calculando relatório..." />
      ) : report ? (
        <div className="anim-rise-late flex flex-col gap-3">
          <p className="tabular text-sm font-light text-ink-muted">
            Período analisado: {formatShortDate(report.startDate)} até{" "}
            {formatShortDate(report.endDate)}
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Metas no período"
              value={report.goalsTotal}
              hint={`${report.goalsCompleted} ${plural(
                report.goalsCompleted,
                "cumprida",
                "cumpridas",
              )}`}
            />
            <StatTile
              label="Tarefas no período"
              value={report.tasksTotal}
              hint={`${report.tasksExecuted} ${plural(
                report.tasksExecuted,
                "executada",
                "executadas",
              )}`}
            />
            <StatTile
              label="Metas cumpridas"
              value={`${Math.round(report.goalsCompletionRate * 100)}%`}
            />
            <StatTile
              label="Tarefas executadas"
              value={`${Math.round(report.tasksCompletionRate * 100)}%`}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="flex flex-col gap-6">
              <SectionTitle>Taxas de conclusão</SectionTitle>
              <Meter
                value={report.goalsCompletionRate}
                label="Metas cumpridas"
                caption={`${report.goalsCompleted} de ${report.goalsTotal} ${plural(
                  report.goalsTotal,
                  "meta",
                  "metas",
                )}`}
              />
              <Meter
                value={report.tasksCompletionRate}
                label="Tarefas executadas"
                caption={`${report.tasksExecuted} de ${report.tasksTotal} ${plural(
                  report.tasksTotal,
                  "tarefa",
                  "tarefas",
                )}`}
              />
            </Card>

            <Card className="flex flex-col gap-6">
              <SectionTitle>Destaques</SectionTitle>
              <Highlight
                label={PERIOD_HIGHLIGHT_LABEL[type]}
                value={
                  type === "weekly"
                    ? `${formatShortDate(report.startDate)} - ${formatShortDate(
                        report.endDate,
                      )}`
                    : (formatPeriodKey(report.mostProductivePeriod) ??
                      "Sem dados suficientes")
                }
              />
              <Highlight
                label="Turno mais produtivo"
                value={
                  report.mostProductiveShift
                    ? SHIFT_LABELS[report.mostProductiveShift]
                    : "Sem dados suficientes"
                }
              />

              <p className="text-[13px] font-light text-ink-faint">
                O turno mais produtivo considera hoje apenas as tarefas criadas
                no bloco “Turno”.
              </p>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <SectionTitle>Categorias de tarefa mais realizadas</SectionTitle>
              <BarList
                data={toBars(report.topTaskCategories)}
                unit={{ one: "tarefa", many: "tarefas" }}
                emptyLabel="Nenhuma tarefa executada neste período."
              />
            </Card>

            <Card>
              <SectionTitle>Categorias de meta mais realizadas</SectionTitle>
              <BarList
                data={toBars(report.topGoalCategories)}
                unit={{ one: "meta", many: "metas" }}
                emptyLabel="Nenhuma meta cumprida neste período."
              />
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}

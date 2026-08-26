import type { ReactNode } from "react";
import { Card } from "./Card";

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <Card padding="sm" className="flex flex-col gap-1">
      <span className="text-[13px] font-light text-ink-muted">{label}</span>
      <span className="tabular text-2xl font-normal leading-none text-ink-strong">
        {value}
      </span>
      {hint && (
        <span className="text-[13px] font-light text-ink-faint">{hint}</span>
      )}
    </Card>
  );
}

interface MeterProps {
  value: number;
  label: string;
  caption?: string;
}

export function Meter({ value, label, caption }: MeterProps) {
  const safe = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
  const pct = Math.round(safe * 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink-muted">{label}</span>
        <span className="tabular text-3xl font-light leading-none text-ink-strong">
          {pct}
          <span className="text-xl text-ink-muted">%</span>
        </span>
      </div>

      <div
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-pill bg-canvas"
      >
        <div
          className="anim-grow h-full rounded-pill bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>

      {caption && (
        <span className="text-[13px] font-light text-ink-faint">{caption}</span>
      )}
    </div>
  );
}

interface BlockGaugeProps {
  total: number;
  done: number;
  label: string;
  emptyLabel?: string;
}

const MAX_BLOCKS = 24;

export function BlockGauge({
  total,
  done,
  label,
  emptyLabel = "Nenhuma tarefa planejada para hoje ainda.",
}: BlockGaugeProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  if (total === 0) {
    return (
      <div className="flex flex-col gap-3">
        <span className="tabular text-5xl font-light leading-none text-ink-faint">
          -
        </span>
        <span className="text-sm font-light text-ink-muted">{emptyLabel}</span>
      </div>
    );
  }

  if (total > MAX_BLOCKS) {
    return (
      <Meter
        value={done / total}
        label={label}
        caption={`${done} de ${total} tarefas do dia`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="tabular text-5xl font-light leading-none text-ink-strong">
          {done}
        </span>
        <span className="text-xl font-light text-ink-muted">de {total}</span>
      </div>

      <div
        role="meter"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${label}: ${done} de ${total}`}
        className="flex flex-wrap gap-1"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className={
              "anim-block h-8 flex-1 rounded-sm " +
              (index < done ? "bg-accent" : "bg-canvas")
            }

            style={{ animationDelay: `${Math.min(index, MAX_BLOCKS) * 55}ms` }}
          />
        ))}
      </div>

      <span className="text-sm font-light text-ink-muted">
        {label} · {pct}% do dia
      </span>
    </div>
  );
}

export interface BarDatum {
  id: string;
  label: string;
  value: number;
  color?: string;
}

interface BarListProps {
  data: BarDatum[];

  unit?: { one: string; many: string };
  emptyLabel?: string;
}

export function BarList({
  data,
  unit,
  emptyLabel = "Sem dados no período.",
}: BarListProps) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-sm font-light text-ink-muted">{emptyLabel}</p>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {data.map((d, index) => {
        const pct = (d.value / max) * 100;
        return (
          <li key={d.id} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm text-ink">{d.label}</span>
              <span className="tabular shrink-0 text-sm font-medium text-ink-strong">
                {d.value}
                {unit && (
                  <span className="ml-1 font-light text-ink-muted">
                    {d.value === 1 ? unit.one : unit.many}
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-pill bg-canvas">
              <div
                className="anim-grow h-full rounded-pill"
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: d.color ?? "var(--color-ink-muted)",

                  animationDelay: `${index * 70}ms`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface HighlightProps {
  label: string;
  value: ReactNode;
  empty?: string;
}

export function Highlight({ label, value, empty = "-" }: HighlightProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <span className="text-xl font-normal text-ink-strong">
        {value ?? empty}
      </span>
    </div>
  );
}

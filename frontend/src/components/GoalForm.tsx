import { useState, type FormEvent } from "react";
import { Button } from "./ui/Button";
import { Field, SelectInput, TextInput } from "./ui/Field";
import type { Category, CreateGoalDTO } from "../types/entities";
import { GoalPeriod } from "../types/enums";
import { addDays, endOfMonth, startOfMonth, todayISO } from "../utils/date";
import { GOAL_PERIOD_LABELS } from "../utils/labels";

interface GoalFormProps {
  categories: Category[];
  onSubmit: (data: CreateGoalDTO) => void;
  onCancel: () => void;
}

const PERIOD_RANGE: Record<GoalPeriod, { min: number; max: number }> = {
  [GoalPeriod.SEMANAL]: { min: 1, max: 10 },
  [GoalPeriod.MENSAL]: { min: 11, max: 40 },
  [GoalPeriod.ANUAL]: { min: 41, max: 400 },
};

function suggestRange(period: GoalPeriod): { start: string; end: string } {
  const today = todayISO();

  if (period === GoalPeriod.SEMANAL) {
    return { start: today, end: addDays(today, 6) };
  }
  if (period === GoalPeriod.MENSAL) {
    return { start: startOfMonth(today), end: endOfMonth(today) };
  }
  return {
    start: `${today.slice(0, 4)}-01-01`,
    end: `${today.slice(0, 4)}-12-31`,
  };
}

function durationInDays(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

export function GoalForm({ categories, onSubmit, onCancel }: GoalFormProps) {
  const [period, setPeriod] = useState<GoalPeriod>(GoalPeriod.SEMANAL);
  const initial = suggestRange(GoalPeriod.SEMANAL);

  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const effectiveCategoryId = categoryId || (categories[0]?.id ?? "");

  function handlePeriodChange(next: GoalPeriod) {
    setPeriod(next);
    const range = suggestRange(next);
    setStartDate(range.start);
    setEndDate(range.end);
    setErrors({});
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: Record<string, string> = {};

    if (!description.trim()) {
      found.description = "Descreva o que você quer alcançar.";
    }
    if (!effectiveCategoryId) {
      found.categoryId = "Escolha uma categoria.";
    }
    if (!startDate || !endDate) {
      found.startDate = "Informe as duas datas.";
    } else if (startDate > endDate) {
      found.startDate = "A data de início não pode ser depois da data de fim.";
    } else {
      const days = durationInDays(startDate, endDate);
      const range = PERIOD_RANGE[period];
      if (days < range.min || days > range.max) {
        found.startDate =
          `Uma meta ${GOAL_PERIOD_LABELS[period].toLowerCase()} precisa durar ` +
          `entre ${range.min} e ${range.max} dias. Esse intervalo tem ${days}.`;
      }
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      description: description.trim(),
      categoryId: effectiveCategoryId,
      period,
      startDate,
      endDate,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="O que você quer alcançar?" error={errors.description}>
        {(id, invalid) => (
          <TextInput
            id={id}
            invalid={invalid}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Entregar o projeto de PLP"
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Categoria" error={errors.categoryId}>
          {(id, invalid) => (
            <SelectInput
              id={id}
              invalid={invalid}
              value={effectiveCategoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.length === 0 && (
                <option value="">Nenhuma categoria disponível</option>
              )}
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>

        <Field label="Período">
          {(id) => (
            <SelectInput
              id={id}
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value as GoalPeriod)}
            >
              {Object.values(GoalPeriod).map((value) => (
                <option key={value} value={value}>
                  {GOAL_PERIOD_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Começa em"
          error={errors.startDate}
          hint={
            errors.startDate
              ? undefined
              : `Sugerimos um intervalo típico de meta ${GOAL_PERIOD_LABELS[
                  period
                ].toLowerCase()}.`
          }
        >
          {(id, invalid) => (
            <TextInput
              id={id}
              invalid={invalid}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          )}
        </Field>

        <Field label="Termina em">
          {(id) => (
            <TextInput
              id={id}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          )}
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Criar meta</Button>
      </div>
    </form>
  );
}

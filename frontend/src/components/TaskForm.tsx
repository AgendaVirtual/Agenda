import { useState, type FormEvent } from "react";
import type { Category, CreateTaskDTO, Task } from "../types/entities";
import { TaskPriority, TaskRecurrence } from "../types/enums";
import { PRIORITY_LABELS } from "../utils/labels";
import { emMinutos } from "../utils/tempo";
import {
  TaskScheduleFields,
  type AgendaDaTarefa,
} from "./TaskScheduleFields";
import { Button } from "./ui/Button";
import { Field, SelectInput, TextInput } from "./ui/Field";

interface TaskFormProps {
  date: string;
  categories: Category[];
  initialTask?: Task;
  onSubmit: (data: CreateTaskDTO) => void;
  onCancel: () => void;
}

export function TaskForm({
  date,
  categories,
  initialTask,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [description, setDescription] = useState(
    initialTask?.description ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    initialTask?.categoryId ?? categories[0]?.id ?? "",
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority ?? TaskPriority.MEDIA,
  );
  const [agenda, setAgenda] = useState<AgendaDaTarefa>({
    date: initialTask?.date ?? date,
    time: initialTask?.time ?? "",
    endTime: initialTask?.endTime ?? "",
    recurrence: initialTask?.recurrence ?? TaskRecurrence.UNICA,
    alertEnabled: initialTask?.alertEnabled ?? false,
    alertLeadMinutes: initialTask?.alertLeadMinutes ?? 30,
  });
  const [error, setError] = useState<string | null>(null);

  const effectiveCategoryId = categoryId || (categories[0]?.id ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!description.trim()) {
      setError("Descreva a tarefa");
      return;
    }
    if (!effectiveCategoryId) {
      setError("Selecione uma categoria");
      return;
    }
    if (!agenda.date) {
      setError("Escolha a data");
      return;
    }
    if (!agenda.time) {
      setError("Informe a que horas a tarefa começa");
      return;
    }
    if (agenda.endTime && emMinutos(agenda.endTime) <= emMinutos(agenda.time)) {
      setError("O fim precisa vir depois do começo");
      return;
    }

    setError(null);
    onSubmit({
      description: description.trim(),
      categoryId: effectiveCategoryId,
      date: agenda.date,
      priority,
      time: agenda.time,
      ...(agenda.endTime ? { endTime: agenda.endTime } : {}),
      recurrence: agenda.recurrence,
      alertEnabled: agenda.alertEnabled,
      alertLeadMinutes: agenda.alertLeadMinutes,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="Descrição">
        {(id, invalid) => (
          <TextInput
            id={id}
            invalid={invalid}
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Revisar slides da apresentação"
          />
        )}
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Categoria">
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

        <Field label="Prioridade">
          {(id, invalid) => (
            <SelectInput
              id={id}
              invalid={invalid}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              {Object.values(TaskPriority).map((value) => (
                <option key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </option>
              ))}
            </SelectInput>
          )}
        </Field>
      </div>

      <TaskScheduleFields value={agenda} onChange={setAgenda} />

      {error && (
        <p role="alert" className="text-[13px] font-light text-danger">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialTask ? "Salvar alterações" : "Criar tarefa"}
        </Button>
      </div>
    </form>
  );
}

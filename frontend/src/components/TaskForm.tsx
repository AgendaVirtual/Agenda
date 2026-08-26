import { useState, type FormEvent } from "react";
import type { Category, CreateTaskDTO, Task } from "../types/entities";
import { TaskPriority, TimeBlockType } from "../types/enums";
import { PRIORITY_LABELS } from "../utils/labels";
import { TimeBlockSelector, type TimeBlockValue } from "./TimeBlockSelector";
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
  const [timeBlock, setTimeBlock] = useState<TimeBlockValue>({
    timeBlockType: initialTask?.timeBlockType ?? TimeBlockType.UMA_HORA,
    time: initialTask?.time,
    shift: initialTask?.shift,
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
    if (timeBlock.timeBlockType !== TimeBlockType.TURNO && !timeBlock.time) {
      setError("Informe um horário");
      return;
    }
    if (timeBlock.timeBlockType === TimeBlockType.TURNO && !timeBlock.shift) {
      setError("Selecione um turno");
      return;
    }

    setError(null);
    const isShiftBlock = timeBlock.timeBlockType === TimeBlockType.TURNO;

    onSubmit({
      description: description.trim(),
      categoryId: effectiveCategoryId,
      date,
      priority,
      timeBlockType: timeBlock.timeBlockType,
      time: isShiftBlock ? null : timeBlock.time,
      shift: isShiftBlock ? timeBlock.shift : null,
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

      <fieldset className="flex min-w-0 flex-col">
        <legend className="mb-2 text-sm font-medium text-ink">
          Bloco de tempo
        </legend>
        <TimeBlockSelector value={timeBlock} onChange={setTimeBlock} />
      </fieldset>

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

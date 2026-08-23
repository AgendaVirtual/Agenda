import { useState, type FormEvent } from "react";
import type { Category, CreateTaskDTO, Task } from "../types/entities";
import { TaskPriority, TimeBlockType } from "../types/enums";
import { TimeBlockSelector, type TimeBlockValue } from "./TimeBlockSelector";

interface TaskFormProps {
  date: string;
  categories: Category[];
  initialTask?: Task;
  onSubmit: (data: CreateTaskDTO) => void;
  onCancel: () => void;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.ALTA]: "Alta",
  [TaskPriority.MEDIA]: "Média",
  [TaskPriority.BAIXA]: "Baixa",
};

export function TaskForm({
  date,
  categories,
  initialTask,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [description, setDescription] = useState(
    initialTask?.description ?? ""
  );
  const [categoryId, setCategoryId] = useState(
    initialTask?.categoryId ?? categories[0]?.id ?? ""
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority ?? TaskPriority.MEDIA
  );
  const [timeBlock, setTimeBlock] = useState<TimeBlockValue>({
    timeBlockType: initialTask?.timeBlockType ?? TimeBlockType.UMA_HORA,
    time: initialTask?.time,
    shift: initialTask?.shift,
  });
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!description.trim()) {
      setError("Descreva a tarefa");
      return;
    }
    if (!categoryId) {
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
    onSubmit({
      description: description.trim(),
      categoryId,
      date,
      priority,
      timeBlockType: timeBlock.timeBlockType,
      time: timeBlock.time,
      shift: timeBlock.shift,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          Descrição
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Revisar slides da apresentação"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">
            Prioridade
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {Object.values(TaskPriority).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-600">
          Bloco de tempo
        </label>
        <TimeBlockSelector value={timeBlock} onChange={setTimeBlock} />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {initialTask ? "Salvar alterações" : "Criar tarefa"}
        </button>
      </div>
    </form>
  );
}

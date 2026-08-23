import type { Category, Task } from "../types/entities";
import { Shift, TaskStatus, TimeBlockType } from "../types/enums";
import { CategoryTag } from "./CategoryTag";
import { PriorityBadge } from "./PriorityBadge";
import { StatusSelector } from "./StatusSelector";

const SHIFT_LABELS: Record<Shift, string> = {
  [Shift.MANHA]: "Manhã",
  [Shift.TARDE]: "Tarde",
  [Shift.NOITE]: "Noite",
};

interface TaskCardProps {
  task: Task;
  category?: Category;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({
  task,
  category,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isDone = task.status === TaskStatus.EXECUTADA;
  const timeLabel =
    task.timeBlockType === TimeBlockType.TURNO
      ? task.shift && SHIFT_LABELS[task.shift]
      : task.time;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-xs font-semibold text-slate-500">
            {timeLabel}
          </span>
          <p
            className={`truncate text-sm font-medium text-slate-800 ${
              isDone ? "line-through text-slate-400" : ""
            }`}
          >
            {task.description}
          </p>
        </div>
        <div className="flex items-center gap-2 pl-16">
          <CategoryTag category={category} />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusSelector value={task.status} onChange={onStatusChange} />
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          Remover
        </button>
      </div>
    </div>
  );
}

import type { Category, Task } from "../types/entities";
import { TaskStatus, TimeBlockType } from "../types/enums";
import { SHIFT_LABELS } from "../utils/labels";
import { CategoryTag } from "./CategoryTag";
import { PriorityBadge } from "./PriorityBadge";
import { StatusSelector } from "./StatusSelector";
import { Checkbox } from "./ui/Checkbox";

interface TaskRowProps {
  task: Task;
  category?: Category;
  onStatusChange: (status: TaskStatus) => void;
  onEdit: () => void;
  onDelete: () => void;

  isNew?: boolean;

  staggerIndex?: number;
  animate?: boolean;
}

export function TaskRow({
  task,
  category,
  onStatusChange,
  onEdit,
  onDelete,
  isNew = false,
  staggerIndex = 0,
  animate = false,
}: TaskRowProps) {
  const isDone = task.status === TaskStatus.EXECUTADA;

  const timeLabel =
    task.timeBlockType === TimeBlockType.TURNO
      ? task.shift
        ? SHIFT_LABELS[task.shift]
        : "-"
      : (task.time ?? "-");

  return (
    <li
      className={
        "group flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 rounded-soft px-3 py-1 " +
        "transition-colors hover:bg-canvas " +
        (isNew ? "anim-highlight " : "") +
        (animate ? "anim-rise" : "")
      }
      style={
        animate
          ? { animationDelay: `${Math.min(staggerIndex, 8) * 40}ms` }
          : undefined
      }
    >
      <Checkbox
        checked={isDone}
        label={
          isDone
            ? `Marcar como pendente: ${task.description}`
            : `Marcar como executada: ${task.description}`
        }
        onChange={(next) =>
          onStatusChange(next ? TaskStatus.EXECUTADA : TaskStatus.PENDENTE)
        }
      />

      <span className="tabular w-14 shrink-0 text-sm font-medium text-ink-muted">
        {timeLabel}
      </span>

      <p
        className={
          "min-w-0 flex-1 basis-48 truncate text-[15px] transition-colors duration-200 " +
          (isDone ? "text-ink-faint line-through" : "text-ink")
        }
      >
        {task.description}
      </p>

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <CategoryTag category={category} />
        <PriorityBadge priority={task.priority} />
      </div>

      <div
        className={
          "flex w-full shrink-0 flex-wrap items-center gap-1 transition-opacity duration-150 " +
          "sm:w-auto lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100"
        }
      >
        <StatusSelector
          value={task.status}
          onChange={onStatusChange}
          taskDescription={task.description}
        />

        <AcaoDeLinha
          rotulo={`Editar tarefa: ${task.description}`}
          onClick={onEdit}
        >
          <path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5V20z" />
          <path d="M13.5 6.5l4 4" />
        </AcaoDeLinha>

        <AcaoDeLinha
          rotulo={`Remover tarefa: ${task.description}`}
          onClick={onDelete}
          perigo
        >
          <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
        </AcaoDeLinha>
      </div>
    </li>
  );
}

function AcaoDeLinha({
  rotulo,
  onClick,
  perigo = false,
  children,
}: {
  rotulo: string;
  onClick: () => void;
  perigo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      title={rotulo}
      onClick={onClick}
      className={
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-md " +
        "transition-colors lg:h-9 lg:w-9 " +
        (perigo
          ? "text-ink-muted hover:bg-danger-soft hover:text-danger"
          : "text-ink-muted hover:bg-surface hover:text-ink")
      }
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-[18px] w-[18px]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
